import express from "express"
import dotenv from "dotenv"
import { connectDB } from "./libs/db.js"
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import friendRoutes from "./routes/friendRoutes.js"
import messageRoutes from "./routes/messageRoutes.js"
import cookieParser from 'cookie-parser'
import cors from "cors"
import { protectedRoute } from "./middlewares/authMiddleware.js"
dotenv.config()
const app = express()
const PORT = process.env.PORT || 5001
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))
// middlewares
app.use(express.json())
app.use(cookieParser())
// giup express hieu va doc dc request body
// duoi dang json

//public routes
app.use('/api/auth', authRoutes)
// private routes
app.use(protectedRoute)
app.use("/api/users", userRoutes)
app.use("/api/friend", friendRoutes)
app.use("/api/message", messageRoutes)

connectDB()

app.listen(PORT,() => {
    console.log(`RUN NEWJOURNEY PORT ${PORT}`);

})