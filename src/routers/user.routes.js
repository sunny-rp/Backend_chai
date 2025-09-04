import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(
    upload.fields([   // ye 1 humne middleware laga di ki jab bi ye vala route call hogha to phele file upload hogi tab uska controller call hoga...!!!
        {
            name: "avatar", //front end m bi filed m same name hona chiye jo hum apne backend m declare karenge..!!!
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    
    registerUser)

router.route("/login").post(loginUser)

//secured routes

router.route("/logout").post(verifyJWT,logoutUser)


export default router