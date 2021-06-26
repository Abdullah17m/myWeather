require('dotenv').config();
const fs = require("fs");
const path = require("path")
const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const cron = require('node-cron');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const _ = require("lodash")
const nodemailer = require("nodemailer")
const app = express();
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }))
app.use(session({
     secret : "hellonfjsdj ss",
     resave: false,
     saveUninitialized: true,
}))
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://abd:"+process.env.dbpass+"@cluster0.9p1fj.mongodb.net/weatherDB?retryWrites=true&w=majority", {useNewUrlParser: true,useUnifiedTopology : true});
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const userSchema = new mongoose.Schema({
 
     email : String,
     password:String,
     city:String
     
})
userSchema.plugin(passportLocalMongoose)
const User =new mongoose.model("user",userSchema)
passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
     done(null, user._id);
     // if you use Model.id as your idAttribute maybe you'd want
     // done(null, user.id);
   });
   
   passport.deserializeUser(function(id, done) {
   User.findById(id, function(err, user) {
     done(err, user);
   });
   });
app.get("/", function (req, res) {

     res.render("register.ejs")
});
app.get("/register",function(req,res){
     res.render("register.ejs")
})
app.get("/login",function(req,res){
     
          res.render("login.ejs")
   
     
})
app.get("/success",function(req,res){
     if(req.isAuthenticated()){
          res.render("success.ejs")
         
     }
     else{
          res.redirect("/login")
     }
     
})
app.get("/mail",function(req,res){
     if(req.isAuthenticated()){


          const url = "https://api.openweathermap.org/data/2.5/weather?q="+ req.user.city +"&units=metric&appid="+process.env.apikey
          https.get(url,function(response,err) {
               if(err){
                    console.log(err);
               }
     
               response.on("data", function (data) {
     
                    const wdata = JSON.parse(data)
                    const temp =wdata.main.temp
                    const iconid = wdata.weather[0].icon 
         const imgurl = "http://openweathermap.org/img/wn/"+iconid+"@2x.png"
         const d = new Date();
     const months = ["Jan", "Feb", "Mar", "April", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];
     
         res.render("mail.ejs",{city:wdata.name,temp:temp,source:imgurl,date:months[d.getMonth()],day:d.getDate(),
     description:wdata.weather[0].description})
     
                   // res.send(wdata);
     
     
               })
          });
     }
     else{
          res.redirect("/login")
     }
})

app.get("/index", function(req, res) {
if(req.isAuthenticated()){


               const url = "https://api.openweathermap.org/data/2.5/weather?q="+ req.user.city +"&units=metric&appid="+process.env.apikey
               https.get(url,function(response,err) {
                    if(err){
                         console.log(err);
                    }
          
                    response.on("data", function (data) {
          
                         const wdata = JSON.parse(data)
                         const temp =wdata.main.temp
                         const iconid = wdata.weather[0].icon 
              const imgurl = "http://openweathermap.org/img/wn/"+iconid+"@2x.png"
              const d = new Date();
          const months = ["Jan", "Feb", "Mar", "April", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];
          
               res.render("index.ejs",{city:wdata.name,temp:temp,source:imgurl,date:months[d.getMonth()],day:d.getDate(),description:wdata.weather[0].description})
          
                         //res.send(wdata);
          
          
                    })
               });
          }
          else{
               res.redirect("/login")
          }
          })
          
          
app.get("/logout",function(req,res){
   req.logout();
  res.redirect("/login")
})   

 app.post("/mail",function(req,res){
     if(req.isAuthenticated()){
          const url = "https://api.openweathermap.org/data/2.5/weather?q="+ req.user.city +"&units=metric&appid="+process.env.apikey
          https.get(url,function(response,err) {
               if(err){
                    console.log(err);
               }
     
               response.on("data", function (dat) {
     
                    const wdata = JSON.parse(dat)
                    const temp =wdata.main.temp
                    const iconid = wdata.weather[0].icon 
         const imgurl = "http://openweathermap.org/img/wn/"+iconid+"@2x.png"
         const d = new Date();
     const months = ["Jan", "Feb", "Mar", "April", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];
     const transporter = nodemailer.createTransport({
          service: "gmail",
          auth:{
               user:process.env.gmail,
               pass:process.env.pass
          }

     })
     let a = _.capitalize(req.user.city)
     const mailOptions = {
          from:process.env.email,
          to : req.user.username,
          subject:"Weather today in "+a,
          
          
          
          
       }
     ejs.renderFile(path.join(__dirname,"views/mail.ejs"),{city:wdata.name,temp:temp,source:imgurl,date:months[d.getMonth()],day:d.getDate(),description:wdata.weather[0].description},function(err,data){
             
          if(err){
               console.log(err);
          }
          else{
               mailOptions.html = data
               
             
                   
               
                
                    transporter.sendMail(mailOptions,function(err,info){
                         if(err){
                              console.log("err");
                              res.redirect("/index")
                         }
                         else{
                              res.redirect("/success")

                         }
                       
                    })
               
          }
   
          
      
    
            
     //        transporter.sendMail(mailOptions,function(err,info){
     //             if(err){
     //                  console.log("err");
     //                  res.redirect("/index")
     //             }
     //             else{
     //                  res.redirect("/success")
     //             }
                
     //        })
        
          })
          
     
                   
     
     
               })
          });
          
     }
          
          else{
               res.redirect("/login")
          }
    
     })
     
     

app.post("/register",function(req,res){
     User.register({city:req.body.city,username : req.body.username},req.body.password,function(err,result){
          if(err){
            console.log(err);
            res.redirect("/register");
          }
          else{
            passport.authenticate("local")(req,res,function(){
              res.redirect("/index")
            })
      
          }
        })
     })

app.post("/login",function(req,res){
     const user = new User ({
          email : req.body.username,
          password : req.body.password
        })
        req.login(user,function(err){
          if(err){
            console.log(err);
          }
          else{
            passport.authenticate("local")(req,res,function(){
              res.redirect("/index")
            })
          }
        })
})


app.post("/delete",function(req,res){
  
     User.findByIdAndRemove(req.user.id,function(err){
       if(err){
           console.log(err);
       }
    
       res.redirect("/register")
   
   })
})

app.listen(process.env.PORT || 3000, function() {
     console.log("Server started ");
   });
