import { Server } from 'socket.io'
import http from "http"
import express from 'express'
import { log } from 'console'
import { socketAuthMiddleware } from '../middlewares/socketMiddleware.js'

const app = express()

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true
    }
})

io.use(socketAuthMiddleware)

const onlineUsers = new Map()


// lang nghe sk ket noi
io.on("connection", async (socket) => {

    const user = socket.user
    console.log(`${user.displayName} online voi socketID : ${socket.id}`);

    onlineUsers.set(user._id, socket.id)

    io.emit("online-users", Array.from(onlineUsers.keys()))

    socket.on("disconnect", () => {
        onlineUsers.delete(user._id)
        io.emit("online-users", Array.from(onlineUsers.keys()))

        console.log(`socket disconnected : ${socket.id}`);


    })
})
export { io, app, server }