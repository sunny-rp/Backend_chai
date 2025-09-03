import express from "express";
import cookieParser from "cookie-parser";
import cors from 'cors';
import dotenv from "dotenv";

const app = express();
dotenv.config({
    path: "./.env",
});


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
app.use(cookieParser())

//routes importing

import userRouter from "./routers/user.routes.js"

//routes declaration

app.use("/api/v1/users",userRouter)




export { app }