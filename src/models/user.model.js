import mongoose from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new mongoose.Schema({
      username:{
        type:String,
        required:true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
      },
      email:{
        type:String,
        required:true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      fullname:{
        type:String,
        required:true,
        trim: true,
      },
      avatar:{
        type:String, //cloudinary url
        required: true,
      },
      coverImage:{
        type: String,
      },
      watchHistory:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
      },
      password:{
        type:String,
        required: true,
      },
      refreshToken:{
        type:String,
      }
},{
    timestamps: true
})

userSchema.methods.isPasswordCorrect = async function(password){ //used to compare user incoming passowrd and encrpyted saved password
    return await bcrypt.compare(password, this.password);
}

userSchema.pre("save", async function (next) {   // pre is a middleware that is used to encrypt the password before saving the password in 
    if(this.isModified("password")){             // Database 
        this.password = await bcrypt.hash(this.password, 10)
        next();
    }
    return next();   
})

userSchema.methods.generateAccessToken = function(){ //ab se hum access token , refresh token or password ko bcrypt yahi karenge sab 
    const accessToken = jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )

    return accessToken;
}

userSchema.methods.generateRefreshToken = function(){
    const refreshToken = jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )

    return refreshToken;
}


export const User = mongoose.model("User",userSchema)