import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";

import { connectDB } from "./libs/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import friendRoute from "./routes/friendRoute.js";
import messageRoute from "./routes/messageRoutes.js";
import conversationRoute from "./routes/conversationRoutes.js";
import { protectedRoute } from "./middlewares/authMiddleware.js";

import { app, server } from "./socket/index.js";

dotenv.config();

const PORT = process.env.PORT || 5001;

/* ================= CORS ================= */
const allowedOrigins = [
    "http://localhost:5173",
    "https://new-journey-j9q5.vercel.app",
];

app.use(
    cors({
        origin: (origin, callback) => {
            console.log("🌍 Origin:", origin);

            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("❌ Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

// 🔥 VERY IMPORTANT (fix preflight)
app.options("*", cors());

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(cookieParser());

/* ================= CLOUDINARY ================= */
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ================= ROUTES ================= */
// public
app.use("/api/auth", authRoutes);

// private
app.use(protectedRoute);
app.use("/api/users", userRoutes);
app.use("/api/friend", friendRoute);
app.use("/api/message", messageRoute);
app.use("/api/conversation", conversationRoute);

/* ================= DB ================= */
connectDB();

/* ================= START SERVER ================= */
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});