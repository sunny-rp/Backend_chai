import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const ConnectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`MongoDB Connect !! DB Host: ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("ERR",error);
        process.exit(1);
        
    }
    
}


export default ConnectDB