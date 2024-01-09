const express = require("express")
const morgan = require("morgan")
const cors = require("cors")
const bodyParser = require("body-parser")
const User = require('./models/user')
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const userModel = require("./models/user")
require('dotenv').config()

const app = express()
app.use(express.json())
app.use(cors())
app.use(morgan("tiny"))
app.use(bodyParser.urlencoded({extended:true}))

app.get('/',(req,res,next)=>{
    req.send("hello world")
})

app.post('/user/login',async(req,res,next)=>{
    try{
        const {email,password} = req.body
        if(!email || !password){
            throw new Error("email or password is missing")
        }        
        const user = await User.find({email:email})
        if(!user){
            req.statusCode = 404
            throw new Error("email or password is not correct")
        }
        // update with otp login
        const passwordCheck = await bcrypt.compare(user.password,password)
        if(!passwordCheck){
            req.statusCode = 400
            throw new Error("email or password is incorrect")
        }
        return res.status(200).send({user,message:"user logged in successfully"})
    }catch(err){
        console.log(err)
    }
})

app.post('/user/signup',async(req,res,next)=>{
    try{
        const {email,password,DoB,mobileNo,aadharNo,type,fname,lname,walletId} = req.body
        if(!email || !password){
            throw new Error("email or password is missing")
        }        
        const existingUser = await User.findOne({email:email})
        if(existingUser){
            req.statusCode = 409
            throw new Error("user already exists")
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)
        const user = await User.create({
            email:email,
            password:hashedPassword,
            fname:fname,
            type:type,
            lname:lname,
            aadharNo:aadharNo,
            mobileNo:mobileNo,
            DoB:DoB,
            walletId:walletId
        })
        return res.status(200).send({status:200,message:"user created successfully",user:{}})
    }catch(err){
        console.log(err)
        next(err)
    }
})

app.post('/user/verify',async(reqq,res,next)=>{
    try{
        //get token from redis
        const token = req.body.token;
        const {email,mobileNo,aadharNo} =await jwt.decode(token,{complete:true})
        const user = await User.findOne({email:email,mobileNo:mobileNo,aadharNo:aadharNo})
        if(user.password!==token.password){
            req.statusCode = 409
            throw new Error("tokens doesn't match")
        }
        const salt = bcrypt.getSalt(10)
        const hashedPassword = await bcrypt.hash(req.password,salt)
        user.password = hashedPassword
        await user.save()
        res.status(200).send({user:{},message:"password updated successfully",status:200})
    }catch(err){
        console.log(err)
        next(err)
    }
})

app.post('/user/forgot',async(req,res,next)=>{
    try{
        const {email,mobileNo,aadharNo} = req.body
        if(!email || !mobileNo || !aadharNo){
            throw new Error("username or password is missing")
        }        
        const existingUser = await User.findOne({email:email})
        if(!existingUser){
            req.statusCode = 404
            throw new Error("user doesn't exists")
        }
        if(existingUser.aadharNo!==aadharNo || existingUser.mobileNo!==mobileNo){
            req.statusCode(400)
            throw new Error("aadhar card or mobile no doesn' match")
        }
        const userToken = jwt.sign({aadharNo,email,mobileNo,password:existingUser.password},process.env.JWT_SECRET)
        //setup token in redis
        return res.status(200).send({status:200,message:"user created successfully",user:userToken})
    }catch(err){
        console.log(err)
        next(err)
    }
})

app.post('/user/reset',async(req,res,next)=>{
    try{
        //get token from redis
        const token = req.body.token;
        const {email,mobileNo,aadharNo} =await jwt.decode(token,{complete:true})
        const user = await User.findOne({email:email,mobileNo:mobileNo,aadharNo:aadharNo})
        if(user.password!==token.password){
            req.statusCode = 409
            throw new Error("tokens doesn't match")
        }
        const salt = bcrypt.getSalt(10)
        const hashedPassword = await bcrypt.hash(req.password,salt)
        user.password = hashedPassword
        await user.save()
        res.status(200).send({user:{},message:"password updated successfully",status:200})
    }catch(err){
        console.log(err)
        next(err)
    }
})