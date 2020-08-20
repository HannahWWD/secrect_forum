require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// const _ = require('lodash');
const ejs = require('ejs');
const session = require('express-session');
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static('public'))
// make sure to paste this part before mongoose connection
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
    // cookie: { secure: true }
  }))

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB",{
    useUnifiedTopology: true, 
    useNewUrlParser: true,
    useCreateIndex:true});

const userSchema = new mongoose.Schema({
    email:{
        type:String},
        // required:[true,"Please enter user email"]},
    password:{
        type:String},
        // required:[true,"please enter user password"]}
    googleId:String,
    secret:String

});

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model("user",userSchema);

passport.use(User.createStrategy());
 
// come from the passport-local-mongoose, only for local auth, won't work with google
// create cookies
// passport.serializeUser(User.serializeUser());
// destroy cookies
// passport.deserializeUser(User.deserializeUser());

// this will works for all the strategy, instead of only local
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

// for google auth
// options
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3002/auth/google/secrets",
    // to handle google plus sunsetting
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  // get trigger after successfully authenticate 
  // accessToken is the authorization that allows us to use the user profile
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile)
      // findOrCreate package needed
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/',function(req,res){
    res.render("home");
})


app.get('/login',function(req,res){
    res.render("login");
})


app.get('/register',function(req,res){
    res.render("register");
})

app.get("/secrets",function(req,res){
    // find all the users with secrets
    User.find({secret:{$ne:null}}, function(err,foundUsers){
        if(err){
            console.log(err)
        }else{
            if (foundUsers){
                res.render("secrets",{usersWithSecrets:foundUsers})
            }
        }
    })
    // if (req.isAuthenticated()){
    //     res.render("secrets");
    // }else {
    //     res.redirect("/login");  
    // }

})

// activate authentication from google server, will fire callback function in the schema
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

// authenticated locally
app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect secrets page.
        res.redirect('/secrets');
    });

app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");

})

app.get("/submit",function(req,res){

    if (req.isAuthenticated()){
        res.render("submit");
    }else {
        res.redirect("/login");  
    }

})

app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;

    User.findById(req.user.id,function(err,foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                })
            }

        }
    })



})

app.post('/register',function(req,res){
    
    // make sure you have deleted the validation in the schema
    // method from passport-local-mongoose, to send data to database
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            // closure
            // In this example, note that authenticate() is called from within the route handler, rather than being used as route middleware.
            // This gives the callback access to the req and res objects through closure
            // If this function gets called, authentication was successful.
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    })
    
})

app.post('/login', function (req, res) {
    const user = new User ({
        username: req.body.username,
        password: req.body.password
    })

    // this method comes from passport
    req.login(user,function(err){
        if(err){
            console.log(err)
        }else {
            passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets")})
        }
    })

})



app.listen(3002,function(){
    console.log("Server is listening to port 3002");

})