import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, {
    _id: false
})

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',

    }
}, {
    _id: false
})

const lastMessageSchema = new mongoose.Schema({
    _id: {
        type:String
    },
    content: {
        type: String,
        default:null
    },
    senderId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    createdAt: {
        type: Date,
        default:null
    }
}, {
    _id:false
})
const conversationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["direct", "group"],
        require: true
    },
    participant: {
        type: [participantSchema],
        required: true
    },
    group: {
        type: groupSchema
    },
    lastMessageAt: {
        type: Date
    },
    seenBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    ]
    ,
    lastMessage: {
        type: lastMessageSchema,
        default:null
    },
    unreadCounts: {
        type: Map,
        of: Number,
        default:{}
        
    }
}, {
    timestamps:TextTrackCue
})

conversationSchema.index({
    "participant.userId": 1,
    lastMessageAt:1
})

const Conversation = mongoose.model("Conversation", conversationSchema),
export default Conversation