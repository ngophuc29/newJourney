import mongoose from "mongoose"

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index:true
    }
    , 
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        trim:true
    },
    imageUrl: {
        type:String 
    },
    mediaUrl: {
        type: String
    },
    mediaType: {
        type: String,
        enum: ["image", "video", "file"]
    },
    mediaPublicId: {
        type: String
    },
    fileName: {
        type: String
    },
    fileSize: {
        type: Number
    },
    type: {
        type: String,
        enum: ["user", "system"],
        default: "user"
    },
    systemType: {
        type: String
    },
    mentions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    readBy: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            readAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    reactions: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            emoji: {
                type: String,
                required: true
            }
        }
    ],
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    isForwarded: {
        type: Boolean,
        default: false
    },
    forwardedFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date,
        default: null
    },
    isRevoked: {
        type: Boolean,
        default: false
    },
    revokedAt: {
        type: Date
    }
}, {
    timestamps:true
})

messageSchema.index({ conversationId: 1, createdAt: -1 })

const Message = mongoose.model("Message", messageSchema)
export default Message
