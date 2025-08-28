import dotenv from 'dotenv';
import express from 'express';
import ConnectDB from './db/index.js';
import { app } from './app.js'

// Load env variables
dotenv.config({ path: './.env' });

const IM_PORT = process.env.PORT || 8000;

ConnectDB()
.then(() => {
    app.listen(IM_PORT, () => {
        console.log(`Server is running at PORT : ${IM_PORT}`);
        
    })
})
.catch((err) => {
    console.log("Database Connection Failed !!!!!!!!", err);
    
})
