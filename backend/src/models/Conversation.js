import mongoose from "mongoose";


const participantSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true
    },
    joinedAt: {
        type: Date,
        default : Date.now
    }
}, {
    _id: false

})

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim:true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',required:true
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
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',required:true
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
        enum: ['direct', 'group'],
        required: true
    },
    participant: {
        type: [participantSchema],
        required: true
    }
    ,
    group: {
        type: groupSchema

    },
    lastMessage: {
        type: lastMessageSchema,
         
    },
    lastMessageAt: {
        type: Date
    },
    unreadCounts: {
        type: Map,
        of: Number,
        default:{}
    },
    seenBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    ]
})
conversationSchema.index({
    "participant.userId": 1,
    lastMessageAt: -1,
});

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;