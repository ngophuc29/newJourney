import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    content: {
        type: String,
        trim: true,
        maxlength: 2000
    },
    media: [
        {
            url: {
                type: String,
                required: true
            },
            type: {
                type: String,
                enum: ["image", "video"],
                required: true
            },
            publicId: {
                type: String
            }
        }
    ],
    privacy: {
        type: String,
        enum: ["public", "friends", "private"],
        default: "public"
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    commentsCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

postSchema.index({ createdAt: -1 });

const Post = mongoose.model("Post", postSchema);
export default Post;
