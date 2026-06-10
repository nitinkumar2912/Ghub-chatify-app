import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.router.js";
import path from "path";


dotenv.config();
const app = express();
const __dirname = path.resolve();

const PORT = process.env.PORT || 3000

app.use("/api/auth",authRoutes);  
app.use("/api/auth",messageRoutes);  


// make ready for deployement

if(process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname , "../frontend/dist")))

    app.get("*" , (req,res) => {
        res.sendFile(path.join(__dirname , "../frontend/dist","index.html"))
    })
}

app.listen(PORT, ()=> {
    console.log("server is running on port: " + PORT)
})