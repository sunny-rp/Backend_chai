import { asyncHandler } from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }


  } catch (error) {
    throw new apiError(500, "something went Wrong while generating Acces and Refresh Token")
  }
}

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
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
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


const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body //1 Get data from frontend

  if (!username && !email) { // 2. check the fields
    throw new apiError(400, "Username and email Fields are required")
  }

  const user = await User.findOne({ //3. check if the user exist or not
    $or: [{ username }, { email }]
  })

  if (!user) {
    throw new apiError(404, "User Not Exist")
  }

  const ispasswordValid = await user.isPasswordCorrect(password) //4 .  Validate the password

  if (!ispasswordValid) {
    throw new apiError(401, "Incorrect Credentials")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id) // 5. Setting up the accessToken and refreshToken

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken") // remove the password and refresh token field from the rrsponse


  const options = { // setting the options so the frontend user not allowed to change the token value
    httpOnly: true,
    secure: true,
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options) // 6. set the token in cookies
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(200, // 7. returning the response after succesfully login 
        {
          user: loggedInUser, accessToken, refreshToken
        },
        "User Login Succesfully"
      )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged Out"))

})


// regenerating Access Token and Refresh Token when Access token expired

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new apiError(401, "unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)

    if (!user) {
      throw new apiError(401, "Invalid refresh token")
    }
    console.log(incomingRefreshToken);
    console.log(user?.refreshToken

    );



    if (incomingRefreshToken !== user?.refreshToken) {
      throw new apiError(401, "Refresh token is expired or used")

    }

    const options = {
      httpOnly: true,
      secure: true
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new apiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed"
        )
      )
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid refresh token")
  }

})



const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id)

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new apiError(400, "Check Your Password...!!!")
  }

  user.password = newPassword
  user.save({ validateBeforeSave: false })

  return res.status(200).json(new apiResponse(200, {}, "Paaword is Changed Successfully"))

})


const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(200, req.user, "Current User Fetched Successfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body

  if (!fullName || !email) {
    throw new apiError(400, "All fields are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email
      }
    },
    { new: true }

  ).select("-password")

  return res
    .status(200)
    .json(new apiResponse(200, user, "Account details updated successfully"))
});


const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar File is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
    throw new apiError(400, "Error while uploading on avatar")
  }


  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    { new: true }
  ).select("-password")


  return res.status(200).json(new apiResponse(200, user, "Avatar Change Successfully"))

})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const CoverImageLocalPath = req.file?.path

  if (!CoverImageLocalPath) {
    throw new apiError(400, "Avatar File is missing")
  }

  const CoverImage = await uploadOnCloudinary(CoverImageLocalPath)

  if (!CoverImage.url) {
    throw new apiError(400, "Error while uploading on avatar")
  }


  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        CoverImage: CoverImage.url
      }
    },
    { new: true }
  ).select("-password")


  return res.status(200).json(new apiResponse(200, user, "CoverImage Change Successfully"))

})


export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar,updateUserCoverImage }
