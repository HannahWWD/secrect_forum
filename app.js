require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// const _ = require('lodash');
const ejs = require('ejs');
const session = require('express-session');
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')




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

});

userSchema.plugin(passportLocalMongoose)

const User = new mongoose.model("user",userSchema);

passport.use(User.createStrategy());
 
// create cookies
passport.serializeUser(User.serializeUser());
// destroy cookies
passport.deserializeUser(User.deserializeUser());


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
    if (req.isAuthenticated()){
        res.render("secrets");
    }else {
        res.redirect("/login");  
    }

})

app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");

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



    // bcrypt.hash(req.body.password,saltRounds,function(err,hash){
    //     const newUser = new User ({
    //         email:req.body.username,
    //         password:hash
    //     })
    //     // the callback function could be replaced by await 
    //     newUser.save(function(err){
    //         if(err){
    //             console.log(err);
    //         }else{
    //             res.render('secrets')
    //         }
    //     })

    // })
    
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

    // const username = req.body.username;
    // if with the same input, hash function will always return the same value, 
    // const password = req.body.password;

    // User.findOne({ email: username }, function (err, foundUser) {
    //     if (err) {
    //         console.log(err)
    //     } else {
    //         if (foundUser) {
    //             bcrypt.compare(password, foundUser.password, function (err, result) {
    //                 if (result === true) {
    //                     res.render('secrets')
    //                 }
    //             })
    //         }
    //     }
    // })
})



app.listen(3002,function(){
    console.log("Server is listening to port 3002");

})