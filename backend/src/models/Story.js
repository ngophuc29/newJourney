import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    mediaUrl: {
        type: String,
        required: true,
    },
    mediaType: {
        type: String,
        enum: ["image", "video"],
        required: true,
    },
    viewers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400, // 24 hours in seconds
    }
}, {
    timestamps: true,
});

const Story = mongoose.model("Story", storySchema);
export default Story;
