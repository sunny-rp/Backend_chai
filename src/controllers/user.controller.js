import { asyncHandler } from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body // 1. get details of users from the frontend..

//   console.log(req.body,"req.body");
  
  console.log("ENV", process.env.CLOUDINARY_CLOUD_NAME);
  if (
    // 2. Validation if any field are empty or not
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All fields are required")
  }

//   console.log("[v0] BODY ===>", req.body)
//   console.log("[v0] FILES ===>", req.files)
//   console.log("[v0] FILE ===>", req.file)

  const existedUser = await User.findOne({
    // 3. Check if user already exist or not
    $or: [{ username }, { email }],
  })

  if (existedUser) {
    throw new apiError(409, "User with this email or username already exist")
  }

//   console.log("[v0] Avatar file check:", req.files?.avatar)
//   console.log("[v0] Cover image file check:", req.files?.coverImage)

  const avatarLocalPath = req.files?.avatar?.[0]?.path
//   const coverImageLocalPath = req.files?.coverImage?.[0]?.path

let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path 
}

//   console.log(req.files,"req.files");

//   console.log("[v0] Avatar local path:", avatarLocalPath)
//   console.log("[v0] Cover image local path:", coverImageLocalPath)

  if (!avatarLocalPath) {
    // console.log("[v0] Avatar file missing. Files received:", Object.keys(req.files || {}))
    throw new apiError(400, "Avatar File is required. Please ensure the field name is 'avatar'")
  }
console.log("avatarpath", avatarLocalPath);

//   console.log("[v0] Starting Cloudinary upload for avatar...")
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  console.log("[v0] Avatar upload result:", avatar ? "Success" : "Failed")

  let coverImage = null
  if (coverImageLocalPath) {
    // console.log("[v0] Starting Cloudinary upload for cover image...")
    coverImage = await uploadOnCloudinary(coverImageLocalPath)
    // console.log("[v0] Cover image upload result:", coverImage ? "Success" : "Failed")
  }

  if (!avatar) {
    throw new apiError(
      400,
      "Avatar File upload to Cloudinary failed. Please check your Cloudinary configuration and try again.",
    )
  }

  const user = await User.create({
    // 6 . Create user object and make its entry in DB
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  })

  const createdUser = await User.findById(user._id).select("-password -refreshToken") // 7. remove password and refreshTOken from created user

  if (!createdUser) {
    // 8. Checking that it the user created or not (USER CREATION)
    throw new apiError(500, "Something went wrong while registring this User...!!!!")
  }


  

  return res.status(201).json(new apiResponse(201, createdUser, "User register Successfully..!!!!"))
})

export { registerUser }
