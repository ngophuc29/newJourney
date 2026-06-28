import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ["friend_request", "mention", "group_invite"],
        required: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId, // MessageId or ConversationId
    },
    isRead: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
