import mongoose from "mongoose";
import dotenv from "dotenv";
import Message from "./src/models/Message.js";

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_CONNECTION);
    console.log("Connected to DB");

    const messages = await Message.find({ mediaType: "file" }).sort({ createdAt: -1 }).limit(5);
    console.log("LAST 5 FILE MESSAGES:");
    messages.forEach((m) => {
        console.log({
            _id: m._id,
            content: m.content,
            mediaUrl: m.mediaUrl,
            mediaType: m.mediaType,
            fileName: m.fileName,
            fileSize: m.fileSize,
        });
    });

    await mongoose.disconnect();
}

run().catch(console.error);
