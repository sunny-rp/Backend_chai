import {asyncHandler} from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";


const registerUser = asyncHandler( async (req,res)=>{
    const {fullname,username,email,password} = req.body; // 1. get details of users from the frontend..

    if(   // 2. Validation if any field are empty or not
        [fullname,email,username,password].some((field) => field?.trim()==="")
    ){
        throw new apiError(400,"All fields are required")
    }

    const existedUser = User.find({ // 3. Check if user already exist or not
        $or: [{ username },{ email }]
    })

    if(existedUser){
        throw new apiError(409,"User with this email or username already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path; // 4. check for images , Check for Avatar because it mandatory.....!!!!
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new apiError(400,"Avatar File is required")
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath) // 5. upload them on cloudinary
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new apiError(400,"Avatar File is required")
    }

    const user = await User.create({ // 6 . Create user object and make its entry in DB
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken") // 7. remove password and refreshTOken from created user

    if(!createdUser){ // 8. Checking that it the user created or not (USER CREATION)
        throw new apiError(500,"Something went wrong while registring this User...!!!!")
    }

    return res.status(201).json(
        new apiResponse(201,createdUser,"User register Successfully..!!!!")
    )
})


export {registerUser}