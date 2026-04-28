import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { emitNewMessage, updateConversationAfterCreateMessage } from "../utils/messageHelper.js";
import {io} from "../socket/index.js"
export const sendDirectMessage = async (req,res) => {
    
    try {
        // lay nguoi nhan ,noi dung tin nhan , id cua doan hoi thoai
        const { recipientId, content, conversationId } = req.body
        const senderId = req.user._id
        

        let conversation;

        // kiem tra content bi rong
        if (!content) {
            return res.status(400).json({message:"Thieu noi dung"})
        }

        // tim doan hoi thoai theo id
        if (conversationId) {
            conversation = await Conversation.findById(conversationId)
        }

        // neu k co doan hoi thoai nao trc do thi tao 
        if (!conversation) {
            conversation = await Conversation.create({
                type: 'direct',
                participant: [
                    { userId: senderId, joinedAt: new Date() },
                    { userId: recipientId, joinedAt: new Date() },
                ],
                lastMessageAt: new Date(),
                unreadCounts: new Map()
            })
        }


        //tao 1 tin nhan moi
        const message = await Message.create({
            conversationId: conversation._id,
            senderId,
            content

        })

        updateConversationAfterCreateMessage(conversation, message, senderId);
        await conversation.save()


        emitNewMessage(io,conversation,message)
        return res.status(201).json({ message })
        

    } catch (error) {
        console.log("Loi xay ra khi gui tin nhan truc tiep",error);
        return res.status(500).json({message :" Loi he thong"})
        
    }
}

export const sendGroupMessage = async (req, res) => {
    try {
        const { conversationId, content } = req.body
        const senderId = req.user._id
        const conversation = req.conversation

        if (!content) {
            return res.status(400).json({message:"thieu noi dung"})
        }

        const message = await Message.create({
            conversationId,
            senderId,
            content
        })


        updateConversationAfterCreateMessage(conversation, message, senderId)
        
        await conversation.save();
        emitNewMessage(io, conversation, message)


        return res.status(201).json({message})
    } catch (error) {
        console.log("loi khi gui tin nhan nhom");
        return res.status(500).json({ message:"Loi he thong" })

    }
}