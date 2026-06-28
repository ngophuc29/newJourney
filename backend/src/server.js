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
import storyRoute from "./routes/storyRoutes.js";
import notificationRoute from "./routes/notificationRoutes.js";
import { protectedRoute } from "./middlewares/authMiddleware.js";

import { app, server } from "./socket/index.js";

dotenv.config();

const PORT = process.env.PORT || 5001;

/* ================= CORS ================= */
app.use(cors({
    origin: true,
    credentials: true,
}));

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
app.get("/api/health", (req, res) => {
    console.log(`[health] ${new Date().toISOString()} server is online`);
    return res.status(200).json({
        ok: true,
        message: "server is online",
        timestamp: new Date().toISOString(),
    });
});

// public
app.use("/api/auth", authRoutes);

// private
app.use(protectedRoute);
app.use("/api/users", userRoutes);
app.use("/api/friend", friendRoute);
app.use("/api/message", messageRoute);
app.use("/api/conversation", conversationRoute);
app.use("/api/stories", storyRoute);
app.use("/api/notifications", notificationRoute);

/* ================= DB ================= */
connectDB();

/* ================= START SERVER ================= */
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});