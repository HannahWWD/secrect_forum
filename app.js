require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// const _ = require('lodash');
const ejs = require('ejs');
const encrypt = require('mongoose-encryption');


const app = express ();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static('public'))

mongoose.connect("mongodb://localhost:27017/userDB",{useUnifiedTopology: true, useNewUrlParser: true })

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:[true,"Please enter user email"]},
    password:{
        type:String,
        required:[true,"please enter user password"]}

});

// encryption key
const secret = process.env.SECRET
// encrypt only password
// encrypt when save and decrypt when find
userSchema.plugin(encrypt,{ secret:secret, encryptedFields: ['password']})

const User = new mongoose.model("user",userSchema);


app.get('/',function(req,res){
    res.render("home");
})


app.get('/login',function(req,res){
    res.render("login");
})


app.get('/register',function(req,res){
    res.render("register");
})

app.post('/login',function(req,res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email:username},function(err,foundUser){
        if(err){
            console.log(err)
        }else{
            if(foundUser){
                if(foundUser.password === password){
                    res.render('secrets')
                }
            }
        }
    })
})

app.post('/register',function(req,res){
    const newUser = new User ({
        email:req.body.username,
        password:req.body.password
    })
    // the callback function could be replaced by await 
    newUser.save(function(err){
        if(err){
            console.log(err);
        }else{
            res.render('secrets')
        }
    })
})




app.listen(3002,function(){
    console.log("Server is listening to port 3002");

})