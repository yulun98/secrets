//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

// Hashing
// const md5 = require("md5");

// Database encryption
// const encrypt = require("mongoose-encryption");

console.log(process.env.SECRET);

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/userDB');
};

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  secret: Array
});

userSchema.plugin(passportLocalMongoose);
// Database encryption
// userSchema.plugin(encrypt, {secret:process.env.SECRET, encryptedFields:['password']});

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function(req, res) {
  res.render("home");
});
app.get("/login", function(req, res) {
  res.render("login");
});
app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/secrets",function(req,res){
  User.find({secret:{$ne:null}},function (err, users){
    if(!err){
      if (users){
        res.render("secrets",{usersWithSecrets:users});
      }else {
        console.log(err);
      }
    }else {
      console.log(err);
    }
  });
});

app.get("/submit", function(req, res){
  if (req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
})

// app.post("/submit", function(req, res){
//   const submittedSecret = req.body.secret;
//   console.log(req.user.id);
//   User.findById(req.user.id, function(err, foundUser){
//     if(err){
//       console.log(err);
//     } else {
//       if(foundUser) {
//         foundUser.secret = submittedSecret;
//         foundUser.save(function(){
//           res.redirect("/secrets");
//         });
//       }
//     }
//   })
// })

app.post("/submit",(function (req, res){
  if(req.isAuthenticated()){
    User.findById(req.user.id,function (err, user){
      user.secret.push(req.body.secret);
      user.save(function (){
        res.redirect("/secrets");
      });
    });

  }else {
   res.redirect("/login");
  }
}));

app.post("/register", function(req, res) {
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err){
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

});

app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){

    if (err){
      console.log(err)
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      })}
    });
});

app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
