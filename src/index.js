import express from 'express';
import { app } from './app.js'
import ConnectDB from './db/index.js';

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
