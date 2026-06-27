import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { emitNewMessage, updateConversationAfterCreateMessage } from "../utils/messageHelper.js";
import {io} from "../socket/index.js"
import { uploadMediaFromBuffer } from "../middlewares/uploadMiddleware.js";

const getMediaType = (mimetype = "") => {
    if (mimetype.startsWith("image/")) return "image";
    if (mimetype.startsWith("video/")) return "video";
    return null;
}

const getUploadedMedia = async (file) => {
    if (!file) return {};

    const mediaType = getMediaType(file.mimetype);

    if (!mediaType) {
        const error = new Error("Chi ho tro gui anh hoac video");
        error.status = 400;
        throw error;
    }

    const result = await uploadMediaFromBuffer(file.buffer, {
        resource_type: mediaType === "video" ? "video" : "image",
    });

    return {
        mediaUrl: result.secure_url,
        mediaType,
        mediaPublicId: result.public_id,
        imageUrl: mediaType === "image" ? result.secure_url : undefined,
    };
}

export const sendDirectMessage = async (req,res) => {
    
    try {
        // lay nguoi nhan ,noi dung tin nhan , id cua doan hoi thoai
        const { recipientId, content, conversationId } = req.body
        const senderId = req.user._id
        const trimmedContent = content?.trim() ?? ""
        const media = await getUploadedMedia(req.file)
        

        let conversation;

        // kiem tra content bi rong
        if (!trimmedContent && !media.mediaUrl) {
            return res.status(400).json({message:"Thieu noi dung"})
        }

        // tim doan hoi thoai theo id
        if (conversationId) {
            conversation = await Conversation.findById(conversationId)
        } else {
            conversation = await Conversation.findOne({
                type: "direct",
                "participant.userId": { $all: [senderId, recipientId] }
            })
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
            content: trimmedContent,
            ...media

        })

        updateConversationAfterCreateMessage(conversation, message, senderId);
        await conversation.save()

        await conversation.populate([
            { path: 'participant.userId', select: "displayName avatarURL" },
            { path: "seenBy", select: "displayName avatarURL" },
            { path: 'lastMessage.senderId', select: "displayName avatarURL" }
        ])

        emitNewMessage(io,conversation,message)
        return res.status(201).json({ message })
        

    } catch (error) {
        console.log("Loi xay ra khi gui tin nhan truc tiep",error);
        return res.status(error.status || 500).json({message : error.message || " Loi he thong"})
        
    }
}

export const sendGroupMessage = async (req, res) => {
    try {
        const { conversationId, content } = req.body
        const senderId = req.user._id
        const conversation = req.conversation
        const trimmedContent = content?.trim() ?? ""
        const media = await getUploadedMedia(req.file)

        if (!trimmedContent && !media.mediaUrl) {
            return res.status(400).json({message:"thieu noi dung"})
        }

        const message = await Message.create({
            conversationId,
            senderId,
            content: trimmedContent,
            ...media
        })


        updateConversationAfterCreateMessage(conversation, message, senderId)
        
        await conversation.save();
        await conversation.populate([
            { path: 'participant.userId', select: "displayName avatarURL" },
            { path: "seenBy", select: "displayName avatarURL" },
            { path: 'lastMessage.senderId', select: "displayName avatarURL" }
        ])
        emitNewMessage(io, conversation, message)


        return res.status(201).json({message})
    } catch (error) {
        console.log("loi khi gui tin nhan nhom", error);
        return res.status(error.status || 500).json({ message:error.message || "Loi he thong" })

    }
}

export const toggleMessageReaction = async (req, res) => {
    try {
        const { messageId } = req.params
        const { emoji } = req.body
        const userId = req.user._id

        if (!emoji?.trim()) {
            return res.status(400).json({ message: "Thieu emoji" })
        }

        const message = await Message.findById(messageId)

        if (!message) {
            return res.status(404).json({ message: "Khong tim thay tin nhan" })
        }

        const conversation = await Conversation.findById(message.conversationId)

        if (!conversation) {
            return res.status(404).json({ message: "Khong tim thay cuoc tro chuyen" })
        }

        const isMember = conversation.participant.some(
            (p) => p.userId.toString() === userId.toString()
        )

        if (!isMember) {
            return res.status(403).json({ message: "Ban khong o trong cuoc tro chuyen nay" })
        }

        const existingIndex = message.reactions.findIndex(
            (reaction) => reaction.userId.toString() === userId.toString()
        )

        if (existingIndex >= 0) {
            if (message.reactions[existingIndex].emoji === emoji) {
                message.reactions.splice(existingIndex, 1)
            } else {
                message.reactions[existingIndex].emoji = emoji
            }
        } else {
            message.reactions.push({ userId, emoji })
        }

        await message.save()

        io.to(message.conversationId.toString()).emit("message-reaction-updated", {
            messageId: message._id,
            conversationId: message.conversationId,
            reactions: message.reactions,
        })

        return res.status(200).json({
            messageId: message._id,
            conversationId: message.conversationId,
            reactions: message.reactions,
        })
    } catch (error) {
        console.log("Loi khi reaction tin nhan", error);
        return res.status(500).json({ message: "Loi he thong" })
    }
}

export const revokeMessage = async (req, res) => {
    try {
        const { messageId } = req.params
        const userId = req.user._id

        const message = await Message.findById(messageId)

        if (!message) {
            return res.status(404).json({ message: "Khong tim thay tin nhan" })
        }

        if (message.type === "system") {
            return res.status(400).json({ message: "Khong the thu hoi thong bao he thong" })
        }

        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Chi co the thu hoi tin nhan cua ban" })
        }

        const conversation = await Conversation.findById(message.conversationId)

        if (!conversation) {
            return res.status(404).json({ message: "Khong tim thay cuoc tro chuyen" })
        }

        const isMember = conversation.participant.some(
            (p) => p.userId.toString() === userId.toString()
        )

        if (!isMember) {
            return res.status(403).json({ message: "Ban khong o trong cuoc tro chuyen nay" })
        }

        message.isRevoked = true
        message.revokedAt = new Date()
        message.content = ""
        message.mediaUrl = undefined
        message.mediaType = undefined
        message.mediaPublicId = undefined
        message.imageUrl = undefined
        message.reactions = []

        await message.save()

        if (conversation.lastMessage?._id?.toString() === message._id.toString()) {
            conversation.lastMessage.content = "Tin nhan da bi thu hoi"
            await conversation.save()
        }

        const payload = {
            messageId: message._id,
            conversationId: message.conversationId,
            isRevoked: true,
            revokedAt: message.revokedAt,
            reactions: [],
        }

        io.to(message.conversationId.toString()).emit("message-revoked", payload)

        return res.status(200).json(payload)
    } catch (error) {
        console.log("Loi khi thu hoi tin nhan", error);
        return res.status(500).json({ message: "Loi he thong" })
    }
}
