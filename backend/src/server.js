import express from "express"
import dotenv from "dotenv"
import { connectDB } from "./libs/db.js"
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import cookieParser from 'cookie-parser'
import { protectedRoute } from "./middlewares/authMiddleware.js"
dotenv.config()
const app = express()
const PORT = process.env.PORT || 5001

// middlewares
app.use(express.json())
app.use(cookieParser())
// giup express hieu va doc dc request body
// duoi dang json

//public routes
app.use('/api/auth', authRoutes)
// private routes
app.use(protectedRoute)
app.use("/api/users" ,userRoutes)
connectDB()

app.listen(PORT,() => {
    console.log(`RUN NEWJOURNEY PORT ${PORT}`);

})