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
        enum: ["image", "video"]
    },
    mediaPublicId: {
        type: String
    },
    type: {
        type: String,
        enum: ["user", "system"],
        default: "user"
    },
    systemType: {
        type: String
    },
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
