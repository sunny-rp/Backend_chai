import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber:{
        type: mongoose.Schema.Types.ObjectId, // jo banda subscribe karega EX. Sunny
        ref:"User",
    },

    channel:{
        type: mongoose.Schema.Types.ObjectId, // vo banda jisko subscriber subscribe karega  EX. BB KI VINES
        ref:"User",
    }
},{timestamps: true})



export const subscription = mongoose.model("subscription",subscriptionSchema)

