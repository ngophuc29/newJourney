import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { emitNewMessage, updateConversationAfterCreateMessage } from "../utils/messageHelper.js";
import {io} from "../socket/index.js"
import { uploadMediaFromBuffer } from "../middlewares/uploadMiddleware.js";

const getMediaType = (mimetype = "") => {
    if (mimetype.startsWith("image/")) return "image";
    if (mimetype.startsWith("video/")) return "video";
    if (mimetype.startsWith("audio/")) return "audio";
    return "file";
}

const getUploadedMedia = async (file) => {
    if (!file) return {};

    const mediaType = getMediaType(file.mimetype);

    let resourceType = "image";
    if (mediaType === "video" || mediaType === "audio") resourceType = "video";
    if (mediaType === "file") resourceType = "raw";

    // Generate a unique public ID preserving the original extension
    const originalName = file.originalname || "file";
    const parts = originalName.split(".");
    const ext = parts.length > 1 ? parts.pop().toLowerCase() : "";
    const nameWithoutExt = parts.join(".").replace(/[^a-zA-Z0-9-_]/g, "_"); // sanitize filename
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // For "raw" files, Cloudinary requires the extension in the public_id to preserve it
    const publicId = ext ? `${nameWithoutExt}_${uniqueId}.${ext}` : `${nameWithoutExt}_${uniqueId}`;

    const uploadOptions = {
        resource_type: resourceType,
        public_id: publicId,
    };

    if (mediaType === "file") {
        // Force attachment download with the original filename on Cloudinary side
        uploadOptions.content_disposition = `attachment; filename="${file.originalname}"`;
    }

    const result = await uploadMediaFromBuffer(file.buffer, uploadOptions);

    return {
        mediaUrl: result.secure_url,
        mediaType,
        mediaPublicId: result.public_id,
        imageUrl: mediaType === "image" ? result.secure_url : undefined,
        fileName: mediaType === "file" ? file.originalname : undefined,
        fileSize: mediaType === "file" ? file.size : undefined,
    };
}

/**
 * Parse @mentions from message content.
 * Accepts an array of participant userIds for the conversation,
 * and an explicit mentionedIds array from the client.
 */
const parseMentions = async (mentionedIds, participantUserIds) => {
    if (!mentionedIds || !Array.isArray(mentionedIds) || mentionedIds.length === 0) {
        return [];
    }
    // Only keep IDs that are actual participants in the conversation
    const participantSet = new Set(participantUserIds.map(id => id.toString()));
    return mentionedIds.filter(id => participantSet.has(id.toString()));
}

export const sendDirectMessage = async (req,res) => {
    
    try {
        // lay nguoi nhan ,noi dung tin nhan , id cua doan hoi thoai
        const { recipientId, content, conversationId, replyTo, mentions: mentionedIds, duration, mediaUrl, mediaType } = req.body
        const senderId = req.user._id
        const trimmedContent = content?.trim() ?? ""
        let media = await getUploadedMedia(req.file)
        
        if (!req.file && mediaUrl && mediaType) {
            media = {
                mediaUrl,
                mediaType,
                imageUrl: mediaType === "image" ? mediaUrl : undefined
            };
        }
        

        // Check if blocked
        const [senderUser, recipientUser] = await Promise.all([
            User.findById(senderId),
            User.findById(recipientId)
        ]);

        if (recipientUser) {
            if (senderUser.blockedUsers?.map(id => id.toString()).includes(recipientId.toString())) {
                return res.status(403).json({ message: "Bạn đã chặn người dùng này" });
            }
            if (recipientUser.blockedUsers?.map(id => id.toString()).includes(senderId.toString())) {
                return res.status(403).json({ message: "Người dùng này đã chặn bạn" });
            }
        }

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

        // Parse mentions
        const participantUserIds = conversation.participant.map(p => p.userId);
        const mentions = await parseMentions(
            mentionedIds ? (Array.isArray(mentionedIds) ? mentionedIds : JSON.parse(mentionedIds)) : [],
            participantUserIds
        );

        //tao 1 tin nhan moi
        const message = await Message.create({
            conversationId: conversation._id,
            senderId,
            content: trimmedContent,
            ...media,
            replyTo: replyTo || null,
            mentions,
            duration: duration ? Number(duration) : undefined
        })

        // Populate replyTo for the response
        if (message.replyTo) {
            await message.populate({
                path: 'replyTo',
                select: 'content senderId mediaType',
                populate: { path: 'senderId', select: 'displayName' }
            })
        }

        // Create DB notifications for mentions
        if (mentions && mentions.length > 0) {
            for (const mentionUserId of mentions) {
                if (mentionUserId.toString() === senderId.toString()) continue;
                const notif = await Notification.create({
                    userId: mentionUserId,
                    type: "mention",
                    senderId,
                    relatedId: message.conversationId
                });
                const populatedNotif = await notif.populate("senderId", "displayName avatarURL username");
                io.to(mentionUserId.toString()).emit("new-notification", { notification: populatedNotif });
            }
        }

        updateConversationAfterCreateMessage(conversation, message, senderId);
        await conversation.save()

        await conversation.populate([
            { path: 'participant.userId', select: "displayName avatarURL" },
            { path: "seenBy", select: "displayName avatarURL" },
            { path: 'lastMessage.senderId', select: "displayName avatarURL" }
        ])

        // Format replyTo for client
        const messageForClient = message.toObject()
        if (messageForClient.replyTo && messageForClient.replyTo.senderId) {
            messageForClient.replyTo = {
                _id: messageForClient.replyTo._id,
                content: messageForClient.replyTo.content,
                senderId: messageForClient.replyTo.senderId._id || messageForClient.replyTo.senderId,
                senderName: messageForClient.replyTo.senderId.displayName || null,
                mediaType: messageForClient.replyTo.mediaType || null
            }
        }

        emitNewMessage(io,conversation, messageForClient)
        return res.status(201).json({ message: messageForClient })
        

    } catch (error) {
        console.log("Loi xay ra khi gui tin nhan truc tiep",error);
        return res.status(error.status || 500).json({message : error.message || " Loi he thong"})
        
    }
}

export const sendGroupMessage = async (req, res) => {
    try {
        const { conversationId, content, replyTo, mentions: mentionedIds, duration, mediaUrl, mediaType } = req.body
        const senderId = req.user._id
        const conversation = req.conversation
        const trimmedContent = content?.trim() ?? ""
        let media = await getUploadedMedia(req.file)

        if (!req.file && mediaUrl && mediaType) {
            media = {
                mediaUrl,
                mediaType,
                imageUrl: mediaType === "image" ? mediaUrl : undefined
            };
        }

        if (!trimmedContent && !media.mediaUrl) {
            return res.status(400).json({message:"thieu noi dung"})
        }

        // Parse mentions
        const participantUserIds = conversation.participant.map(p => p.userId);
        const mentions = await parseMentions(
            mentionedIds ? (Array.isArray(mentionedIds) ? mentionedIds : JSON.parse(mentionedIds)) : [],
            participantUserIds
        );

        const message = await Message.create({
            conversationId,
            senderId,
            content: trimmedContent,
            ...media,
            replyTo: replyTo || null,
            mentions,
            duration: duration ? Number(duration) : undefined
        })

        // Populate replyTo for the response
        if (message.replyTo) {
            await message.populate({
                path: 'replyTo',
                select: 'content senderId mediaType',
                populate: { path: 'senderId', select: 'displayName' }
            })
        }

        // Create DB notifications for mentions
        if (mentions && mentions.length > 0) {
            for (const mentionUserId of mentions) {
                if (mentionUserId.toString() === senderId.toString()) continue;
                const notif = await Notification.create({
                    userId: mentionUserId,
                    type: "mention",
                    senderId,
                    relatedId: message.conversationId
                });
                const populatedNotif = await notif.populate("senderId", "displayName avatarURL username");
                io.to(mentionUserId.toString()).emit("new-notification", { notification: populatedNotif });
            }
        }

        updateConversationAfterCreateMessage(conversation, message, senderId)
        
        await conversation.save();
        await conversation.populate([
            { path: 'participant.userId', select: "displayName avatarURL" },
            { path: "seenBy", select: "displayName avatarURL" },
            { path: 'lastMessage.senderId', select: "displayName avatarURL" }
        ])

        // Format replyTo for client
        const messageForClient = message.toObject()
        if (messageForClient.replyTo && messageForClient.replyTo.senderId) {
            messageForClient.replyTo = {
                _id: messageForClient.replyTo._id,
                content: messageForClient.replyTo.content,
                senderId: messageForClient.replyTo.senderId._id || messageForClient.replyTo.senderId,
                senderName: messageForClient.replyTo.senderId.displayName || null,
                mediaType: messageForClient.replyTo.mediaType || null
            }
        }

        emitNewMessage(io, conversation, messageForClient)


        return res.status(201).json({ message: messageForClient })
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
        message.fileName = undefined
        message.fileSize = undefined
        message.mentions = []
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

export const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params
        const { content } = req.body
        const userId = req.user._id

        if (!content?.trim()) {
            return res.status(400).json({ message: "Noi dung khong duoc de trong" })
        }

        const message = await Message.findById(messageId)

        if (!message) {
            return res.status(404).json({ message: "Khong tim thay tin nhan" })
        }

        if (message.type === "system") {
            return res.status(400).json({ message: "Khong the chinh sua thong bao he thong" })
        }

        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Chi co the chinh sua tin nhan cua ban" })
        }

        if (message.isRevoked) {
            return res.status(400).json({ message: "Khong the chinh sua tin nhan da thu hoi" })
        }

        const conversation = await Conversation.findById(message.conversationId)

        if (!conversation) {
            return res.status(404).json({ message: "Khong tim thay cuoc tro chuyen" })
        }

        message.content = content.trim()
        message.isEdited = true
        message.editedAt = new Date()

        await message.save()

        // Update lastMessage content if this is the last message
        if (conversation.lastMessage?._id?.toString() === message._id.toString()) {
            conversation.lastMessage.content = message.content
            await conversation.save()
        }

        const payload = {
            messageId: message._id,
            conversationId: message.conversationId,
            content: message.content,
            isEdited: true,
            editedAt: message.editedAt,
        }

        io.to(message.conversationId.toString()).emit("message-edited", payload)

        return res.status(200).json(payload)
    } catch (error) {
        console.log("Loi khi chinh sua tin nhan", error);
        return res.status(500).json({ message: "Loi he thong" })
    }
}

export const forwardMessage = async (req, res) => {
    try {
        const { messageId, targetConversationIds } = req.body;
        const senderId = req.user._id;

        if (!messageId || !targetConversationIds || !Array.isArray(targetConversationIds) || targetConversationIds.length === 0) {
            return res.status(400).json({ message: "Thieu thong tin tin nhan hoac cuoc tro chuyen dich" });
        }

        const sourceMessage = await Message.findById(messageId);
        if (!sourceMessage) {
            return res.status(404).json({ message: "Khong tim thay tin nhan goc" });
        }

        if (sourceMessage.isRevoked) {
            return res.status(400).json({ message: "Khong the chuyen tiep tin nhan da bi thu hoi" });
        }

        const forwardedMessages = [];

        for (const targetConvoId of targetConversationIds) {
            const conversation = await Conversation.findById(targetConvoId);
            if (!conversation) continue;

            const isMember = conversation.participant.some(
                (p) => p.userId.toString() === senderId.toString()
            );
            if (!isMember) continue;

            // Create new message in target conversation
            const newMessage = await Message.create({
                conversationId: targetConvoId,
                senderId,
                content: sourceMessage.content,
                imageUrl: sourceMessage.imageUrl,
                mediaUrl: sourceMessage.mediaUrl,
                mediaType: sourceMessage.mediaType,
                mediaPublicId: sourceMessage.mediaPublicId,
                fileName: sourceMessage.fileName,
                fileSize: sourceMessage.fileSize,
                isForwarded: true,
                forwardedFrom: sourceMessage.senderId
            });

            // Populate forwardedFrom
            await newMessage.populate({
                path: 'forwardedFrom',
                select: 'displayName avatarURL'
            });

            updateConversationAfterCreateMessage(conversation, newMessage, senderId);
            await conversation.save();

            await conversation.populate([
                { path: 'participant.userId', select: "displayName avatarURL" },
                { path: "seenBy", select: "displayName avatarURL" },
                { path: 'lastMessage.senderId', select: "displayName avatarURL" }
            ]);

            const messageForClient = newMessage.toObject();
            emitNewMessage(io, conversation, messageForClient);
            forwardedMessages.push(messageForClient);
        }

        return res.status(201).json({ messages: forwardedMessages });
    } catch (error) {
        console.log("Loi khi chuyen tiep tin nhan", error);
        return res.status(500).json({ message: "Loi he thong" });
    }
};
