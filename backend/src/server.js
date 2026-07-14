import express from "express";
import cookieParser from "cookie-parser";


import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.router.js";
import path from "path";
import mongoose from "mongoose";
import {ENV} from "./lib/env.js"


mongoose.connect(ENV.MONGO_URI)
.then(() => {
    console.log("MongoDB connected");
})
.catch((err) => {
    console.log(err);
});


const app = express();

app.use(express.json());
app.use(cookieParser());

const __dirname = path.resolve();

const PORT = ENV.PORT || 3000

app.use("/api/auth",authRoutes);  
app.use("/api/messages",messageRoutes);  


// make ready for deployement

if(ENV.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname , "../frontend/dist")))

    app.get("*" , (req,res) => {
        res.sendFile(path.join(__dirname , "../frontend/dist","index.html"))
    })
}

app.listen(PORT, ()=> {
    console.log("server is running on port: " + PORT)
})