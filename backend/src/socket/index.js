import { Server } from "socket.io";
import http from "http";
import express from "express";
import { socketAuthMiddleware } from "../middlewares/socketMiddleware.js";
import { getUserConversationsForSocketIO } from "../controllers/conversationController.js";

const app = express();
const server = http.createServer(app);

/* ================= SOCKET CORS ================= */
const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "https://new-journey-j9q5.vercel.app",
        ],
        credentials: true,
    },
});

io.use(socketAuthMiddleware);

const onlineUsers = new Map();

io.on("connection", async (socket) => {
    const user = socket.user;

    console.log(`🟢 ${user.displayName} online: ${socket.id}`);

    onlineUsers.set(user._id.toString(), socket.id);

    io.emit("online-users", Array.from(onlineUsers.keys()));

    const conversationIds = await getUserConversationsForSocketIO(user._id);

    conversationIds.forEach((id) => {
        socket.join(id.toString());
    });

    socket.on("join-conversation", (conversationId) => {
        socket.join(conversationId);
    });

    socket.join(user._id.toString());

    socket.on("disconnect", () => {
        onlineUsers.delete(user._id.toString());

        io.emit("online-users", Array.from(onlineUsers.keys()));

        console.log(`🔴 Disconnected: ${socket.id}`);
    });
});

export { io, app, server };