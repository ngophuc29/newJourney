import express from "express"
import dotenv from "dotenv"
import { connectDB } from "./libs/db.js"
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import friendRoute from "./routes/friendRoute.js"
import messageRoute from "./routes/messageRoutes.js"
import conversationRoute from "./routes/conversationRoutes.js"
import cookieParser from 'cookie-parser'
import cors from "cors"
import { protectedRoute } from "./middlewares/authMiddleware.js"
import { app, server } from './socket/index.js'
import { v2 as cloudinary} from 'cloudinary'
dotenv.config()
// const app = express()
const PORT = process.env.PORT || 5001
const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL || "https://new-journey-j9q5.vercel.app",
];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (e.g. server-to-server, curl)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            // Deny other origins but don't throw so CORS middleware will simply not set headers
            return callback(null, false);
        },
        credentials: true,
    })
);
 
// middlewares
app.use(express.json())
app.use(cookieParser())
// giup express hieu va doc dc request body
// duoi dang json
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
//public routes
app.use('/api/auth', authRoutes)
// private routes
app.use(protectedRoute)
app.use("/api/users", userRoutes)
app.use("/api/friend", friendRoute)
app.use("/api/message", messageRoute)
app.use("/api/conversation", conversationRoute)



connectDB()

server.listen(PORT,() => {
    console.log(`RUN NEWJOURNEY PORT ${PORT}`);

})