import express from "express"
import dotenv from "dotenv"
import { connectDB } from "./libs/db.js"
import authRoutes from "./routes/authRoutes.js"

dotenv.config()
const app = express()
const PORT = process.env.PORT || 5001

// middlewares
app.use(express.json())
// giup express hieu va doc dc request body
// duoi dang json

//public routes
app.use('/api/auth', authRoutes)
// private routes


connectDB()

app.listen(PORT,() => {
    console.log(`RUN NEWJOURNEY PORT ${PORT}`);

})