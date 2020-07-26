//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));


app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-muskan:"+process.env.PASSWORD+"@cluster0.bmbo9.mongodb.net/eisenDB", {useNewUrlParser: true, useUnifiedTopology: true} );
mongoose.set("useCreateIndex", true);

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function (){
  console.log("server started on port 3000");
});


const itemsSchema=new mongoose.Schema({
  email:String,
  password:String,
  todos: [
    {
      name:String,
      urgent: String,
      imp: String
    }
  ]
});

itemsSchema.plugin(passportLocalMongoose);

const Item = mongoose.model("Item", itemsSchema);

passport.use(Item.createStrategy());
passport.serializeUser(function(user, done){
  done(null, user.id);
});
passport.deserializeUser(function(id, done){
  Item.findById(id, function(err, user){
    done(err, user);
  });
});

var today=new Date();
var options = {
  weekday:"long",
  month:"numeric",
  day:"numeric",
  year:"numeric"
};
var date=today.toLocaleDateString("en-US");
var year=today.getFullYear();

app.get("/", function(req, res){
  res.render("informationpage", {yearmat:year});
});



app.post("/delete", function(req, res){
  const checkedItemId = req.body.matrixbox;
  Item.updateOne({'_id': req.user.id},
                  {$pull:{"todos": {_id: checkedItemId}}},
                 {safe:true},
               function(err, obj){

               });
  console.log("sucessfully deleted!");
  res.redirect("/matrix");

});
//req.user.todos.id
app.get("/login", function(req, res){
  res.render("login", {yearmat:year});
});

app.get("/register", function(req, res){
  res.render("register",{yearmat:year});
});

app.get("/matrix", function(req, res){
  if(req.isAuthenticated()){
    Item.findById(req.user.id, function(err, foundUser){
      if(err){
        console.log(err);
        res.redirect("/login");
      }else{
        if(foundUser){
          res.render("matrix",{
            datemat:date,
            yearmat:year,
            newListItems: foundUser.todos
          });
        }
      }
    });
  }
});

app.post("/matrix", function(req, res){
  let task=req.body.tasktodoform;
  let impo=req.body.importantform;
  let urg=req.body.urgentform;


  Item.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        if(impo=="on" && urg=="on"){
          let taskitem = {
              name:task,
              urgent: "yes",
              imp:"yes"
            };
          foundUser.todos.push(taskitem);
          foundUser.save(function(){
            res.redirect("/matrix");
          });
        }
        else if(impo=="on" && urg!="on"){
          let taskitem = {
            name:task,
            urgent: "no",
            imp:"yes"
          };
          foundUser.todos.push(taskitem);
          foundUser.save(function(){
            res.redirect("/matrix");
          });
        }
        else if( impo!="on" && urg=="on"){
          let taskitem = {
            name:task,
            urgent: "yes",
            imp:"no"
          };
          foundUser.todos.push(taskitem);
          foundUser.save(function(){
            res.redirect("/matrix");
          });
        }
        else if(impo!="on" && urg!="on"){
          let taskitem = {
            name:task,
            urgent: "no",
            imp:"no"
          };
          foundUser.todos.push(taskitem);
          foundUser.save(function(){
            res.redirect("/matrix");
          });
        }
      }
    }
  });
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/login", function(req, res){
  const user = new Item({
    usename: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/matrix");
      });
    }
  });
});

app.post("/register", function(req, res){
  Item.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/matrix");
      });
    }
  });
});
