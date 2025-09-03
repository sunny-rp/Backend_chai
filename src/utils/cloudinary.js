import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import path from "path";
import dotenv from "dotenv"

dotenv.config({
    path: "./.env",
});

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
});




//  console.log(process.env.CLOUDINARY_CLOUD_NAME,"here the name");
 
    const uploadOnCloudinary = async (localFilepath) => {
        try {  
            if(!localFilepath){
                return null;
            }

            else{
                //uplaoding file on cloudinary by taking the local file path when user uploads file on the server, but hum iss file ko temporarily apne server par store rakhenge jab tak ki file cloudinary par upload naa ho jaaye, jaise hi uplaod hogi, fir um apne server se delete kar denge file ko.
                const response = await cloudinary.uploader.upload(localFilepath, {
                    resource_type: "auto",
                })
                
                // console.log("File uploaded successfully on cloudinary!!", response);
                fs.unlinkSync(path.resolve(localFilepath));
                return response;
            }
        } catch (error) {
            
            fs.unlinkSync(path.resolve(localFilepath)); // jo humne apne server par local file save karayi thi usko hum delete kar denge, kyoki cloudinary par file upload nahin ho paayi hai, and hum delete iliye kar rahe hain kyoki user firse file upload karega toh fir wahi same file dobara se mere local server par aa jaayegi, aise data badhta rahega
            return null;
        }
    }


    const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;

        const result = await cloudinary.uploader.destroy(publicId);

        console.log("🗑️ Cloudinary delete result:", result);
        return result;
    } catch (error) {
        console.error("❌ Error deleting from Cloudinary:", error);
        return null;
    }
    };


export {uploadOnCloudinary, deleteFromCloudinary}