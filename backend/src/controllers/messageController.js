import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js"
import { updateConversationAfterCreateMessage } from "../utils/messageHelper.js";
export const sendDirectMessage =async (req,res ) =>{
    try {
        
        try {
            const { recipientId, content, conversationId } = req.body
            const senderId = req.user._id


            if (!content) {
                return res.status(400).json({message:"Thieu noi dung tin nhan"})
            }

            let conversation;

            if (conversation) {
                conversation = await Conversation.findById(conversationId)
            }


            if (!conversation) {
                conversation = await Conversation.create({
                    type: 'direct',
                    participant: [
                        { userId: senderId, joinedAt: new Date() },
                        { userId: recipientId, joinedAt: new Date() }

                    ],

                    unreadCounts: new Map(),
                    lastMessageAt: new Date(),
                    
                    
                })
            }


            const message = await Message.create({
                conversationId: conversation._id,
                content: content,
                senderId
            })

            updateConversationAfterCreateMessage(conversation, message, senderId)
            
            await conversation.save()


            return res.status(200).json({message})
        } catch (error) {
            console.log("Loi xay ra khi gui tin nhan truc tiep", error);
            return res.status(500).json({ message: "Loi he thong" })
        }
    } catch (error) {
        
    }
}

export const sendGroupMessage = async (req, res) => {
    try {
        const { conversationId, content } = req.body
        const senderId = req.user._id
        const conversation = req.conversation

        if (!content) {
            return res.status(400).json({ message: "thieu noi dung" })
        }

        const message = await Message.create({
            conversationId,
            senderId,
            content
        })


        updateConversationAfterCreateMessage(conversation, message, senderId)

        await conversation.save();


        return res.status(201).json({ message })
    } catch (error) {
        console.log("loi khi gui tin nhan nhom");
        return res.status(500).json({ message: "Loi he thong" })

    }
}