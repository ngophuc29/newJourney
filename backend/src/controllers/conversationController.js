import Conversation from "../models/Conversation.js"
import Message from "../models/Message.js"
import Friend from "../models/Friend.js"
import User from "../models/User.js"
import { io} from "../socket/index.js"
import { emitNewMessage, formatConversationForClient, updateConversationAfterCreateMessage } from "../utils/messageHelper.js"

const pair = (a, b) => (a < b ? [a, b] : [b, a])

const populateConversation = async (conversation) => {
    await conversation.populate([
        { path: 'participant.userId', select: "_id username displayName avatarURL" },
        { path: "seenBy", select: '_id username displayName avatarURL' }, {
            path: 'lastMessage.senderId', select: "_id username displayName avatarURL"
        }
    ])

    return formatConversationForClient(conversation)
}

const emitGroupUpdated = (conversation, formatted) => {
    const rooms = (conversation.participant || []).map((p) =>
        (p.userId?._id ?? p.userId).toString()
    )

    io.to(rooms).emit("group-updated", formatted)
}

const getGroupForMember = async (conversationId, userId) => {
    const conversation = await Conversation.findById(conversationId)

    if (!conversation || conversation.type !== "group") {
        return { error: { status: 404, message: "Khong tim thay nhom chat" } }
    }

    const isMember = conversation.participant.some(
        (p) => p.userId.toString() === userId.toString()
    )

    if (!isMember) {
        return { error: { status: 403, message: "Ban khong o trong nhom nay" } }
    }

    return { conversation }
}

const isGroupOwner = (conversation, userId) =>
    conversation.group?.createdBy?.toString() === userId.toString()

const appendSystemMessage = async (conversation, actorId, content, systemType) => {
    const message = await Message.create({
        conversationId: conversation._id,
        senderId: actorId,
        content,
        type: "system",
        systemType
    })

    updateConversationAfterCreateMessage(conversation, message, actorId)
    await conversation.save()

    return message
}

export const createConversation = async (req, res) => {
    try {
        const { type, name, memberIds } = req.body
        const userId = req.user._id

        if (
            !type || (type === "group" && !name)
            || !memberIds
            || !Array.isArray(memberIds)
            || memberIds.length === 0) {
            return res.status(400).json({ message: "Ten nhom va ds thanh vien la bat buoc" })
        }


        let conversation;
        if (type === "direct") {
            const participantId = memberIds[0]

            conversation = await Conversation.findOne({
                type: 'direct',
                "participant.userId": { $all: [userId, participantId] }
            })

            if (!conversation) {
                conversation = new Conversation({
                    type: 'direct',
                    participant: [{ userId }, { userId: participantId }],
                    lastMessageAt: new Date()
                })
                await conversation.save()
            }

        }

        if (type === "group") {
            conversation = new Conversation({
                type: "group",
                participant: [
                    { userId },
                    ...memberIds.map((id) => ({ userId: id }))
                ],
                group: {
                    name,
                    createdBy: userId

                },
                lastMessageAt: new Date()
            });
            await conversation.save()
        }

        if (!conversation) {
            return res.status(400).json({ message: "Conversation type k hop le" })
        }
        await conversation.populate([
            { path: 'participant.userId', select: "displayName avatarURL" },
            { path: "seenBy", select: 'displayName avatarURL' }, {
                path: 'lastMessage.senderId', select: "displayName avatarURL"
            }
        ])
        const participants = (conversation.participant || []).map((p) => ({
            _id: p.userId?._id,
            displayName: p.userId?.displayName,
            avatarURL: p.userId?.avatarURL ?? null,
            joinedAt: p.joinedAt,
        }));
        const formatted = { ...conversation.toObject(), participants };

        if (type === 'group') {
            memberIds.forEach((userId) => {
                io.to(userId).emit('new-group',formatted)
            })
        }
        return res.status(201).json({ conversation: formatted })
    } catch (error) {
        console.log("loi khi tao conversation", error);
        return res.status(500).json({ message: "Loi he thong " })


    }
}
export const getConversation = async (req, res) => {

    try {
        const userId = req.user._id
        const conversation = await Conversation.find({
            'participant.userId': userId
        }).sort({ lastMessageAt: -1, updatedAt: -1 })
            .populate([{
                path: 'participant.userId', select: "displayName avatarURL"
            }, {
                path: 'lastMessage.senderId', select: "displayName avatarURL"

            }, {
                path: 'seenBy', select: "displayName avatarURL"

            }])


        const formatted = conversation.map((convo) => {
            const participants = (convo.participant || []).map((p) => ({
                _id: p.userId?._id,
                displayName: p.userId?.displayName,
                avatarURL: p.userId?.avatarURL ?? null,
                joinedAt: p.joinedAt
            }))

            return {
                ...convo.toObject(),//chuyen mongoodocs thanh js
                unreadCounts: convo.unreadCounts || {},
                participants
            }
        })
        return res.status(200).json({ conversation: formatted })
    } catch (error) {
        console.log("Loi xay ra khi lay danh sach cuoc tro chuyen", error);
        return res.status(500).json({ message: "loi he thong" })

    }
}
export const getMessages = async (req, res) => {
    try {

        const { conversationId } = req.params;
        const { limit = 50, cursor } = req.query

        if (!conversationId) {
            return res.status(400).json({ message: "Thieu conversationId" })
        }

        const query = { conversationId }
        // const query = {
        //     conversationId: new mongoose.Types.ObjectId(conversationId)
        // };


        if (cursor) {
            query.createdAt = { $lt: new Date(cursor) }
        }

        let messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit) + 1)

        let nextCursor = null

        if (messages.length > Number(limit)) {
            const nextMessage = messages[messages.length - 1]
            nextCursor = nextMessage.createdAt.toISOString();
            messages.pop()
        }

        messages = messages.reverse()

        return res.status(200).json({ messages, nextCursor })

    } catch (error) {
        console.log("loi khi lay message", error);
        return res.status(500).json({ message: "Loi he thong " })

    }
}

export const getUserConversationsForSocketIO = async (userId) => {
    try {
        const conversations = await Conversation.find({
            "participant.userId":userId
        }, {
            _id:1
        })
        return conversations.map((c)=>c._id.toString())
    } catch (error) {
        console.log("Loi khi fetch conversation",error);
        return []
        
    }
    
}
export const markAsSeen = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id.toString();

        const conversation = await Conversation.findById(conversationId).lean();

        if (!conversation) {
            return res.status(404).json({ message: "Conversation không tồn tại" });
        }

        const last = conversation.lastMessage;

        if (!last) {
            return res.status(200).json({ message: "Không có tin nhắn để mark as seen" });
        }

        if (last.senderId.toString() === userId) {
            return res.status(200).json({ message: "Sender không cần mark as seen" });
        }

        const updated = await Conversation.findByIdAndUpdate(
            conversationId,
            {
                $addToSet: { seenBy: userId },
                $set: { [`unreadCounts.${userId}`]: 0 },
            },
            {
                new: true,
            },
        );

        io.to(conversationId).emit("read-message", {
            conversation: updated,
            lastMessage: {
                _id: updated?.lastMessage._id,
                content: updated?.lastMessage.content,
                createdAt: updated?.lastMessage.createdAt,
                sender: {
                    _id: updated?.lastMessage.senderId,
                },
            },
        });

        return res.status(200).json({
            message: "Marked as seen",
            seenBy: updated?.sennBy || [],
            myUnreadCount: updated?.unreadCounts[userId] || 0,
        });
    } catch (error) {
        console.error("Lỗi khi mark as seen", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const renameGroup = async (req, res) => {
    try {
        const { conversationId } = req.params
        const { name } = req.body
        const userId = req.user._id

        if (!name?.trim()) {
            return res.status(400).json({ message: "Ten nhom khong duoc bo trong" })
        }

        const { conversation, error } = await getGroupForMember(conversationId, userId)
        if (error) return res.status(error.status).json({ message: error.message })

        if (!isGroupOwner(conversation, userId)) {
            return res.status(403).json({ message: "Chi truong nhom moi duoc doi ten nhom" })
        }

        conversation.group.name = name.trim()
        await conversation.save()

        const formatted = await populateConversation(conversation)
        emitGroupUpdated(conversation, formatted)

        return res.status(200).json({ conversation: formatted })
    } catch (error) {
        console.log("Loi khi doi ten nhom", error);
        return res.status(500).json({ message: "Loi he thong" })
    }
}

export const addGroupMembers = async (req, res) => {
    try {
        const { conversationId } = req.params
        const { memberIds = [] } = req.body
        const userId = req.user._id

        if (!Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ message: "Can chon thanh vien de them vao nhom" })
        }

        const { conversation, error } = await getGroupForMember(conversationId, userId)
        if (error) return res.status(error.status).json({ message: error.message })

        if (!isGroupOwner(conversation, userId)) {
            return res.status(403).json({ message: "Chi truong nhom moi duoc them thanh vien" })
        }

        const currentMemberIds = new Set(
            conversation.participant.map((p) => p.userId.toString())
        )
        const uniqueMemberIds = [...new Set(memberIds.map((id) => id.toString()))]
            .filter((id) => !currentMemberIds.has(id))

        if (uniqueMemberIds.length === 0) {
            return res.status(400).json({ message: "Tat ca thanh vien da co trong nhom" })
        }

        const friendChecks = await Promise.all(uniqueMemberIds.map(async (memberId) => {
            const [userA, userB] = pair(userId.toString(), memberId)
            const friend = await Friend.findOne({ userA, userB })
            return friend ? null : memberId
        }))
        const notFriend = friendChecks.filter(Boolean)

        if (notFriend.length > 0) {
            return res.status(403).json({ message: "Chi co the them ban be vao nhom", notFriend })
        }

        uniqueMemberIds.forEach((memberId) => {
            conversation.participant.push({ userId: memberId, joinedAt: new Date() })
            conversation.unreadCounts.set(memberId, 0)
        })

        await conversation.save()

        const formatted = await populateConversation(conversation)
        emitGroupUpdated(conversation, formatted)

        return res.status(200).json({ conversation: formatted })
    } catch (error) {
        console.log("Loi khi them thanh vien nhom", error);
        return res.status(500).json({ message: "Loi he thong" })
    }
}

export const removeGroupMember = async (req, res) => {
    try {
        const { conversationId, memberId } = req.params
        const userId = req.user._id

        const { conversation, error } = await getGroupForMember(conversationId, userId)
        if (error) return res.status(error.status).json({ message: error.message })

        if (!isGroupOwner(conversation, userId)) {
            return res.status(403).json({ message: "Chi truong nhom moi duoc xoa thanh vien" })
        }

        if (memberId.toString() === userId.toString()) {
            return res.status(400).json({ message: "Truong nhom hay dung chuc nang roi nhom" })
        }

        const before = conversation.participant.length
        conversation.participant = conversation.participant.filter(
            (p) => p.userId.toString() !== memberId.toString()
        )

        if (conversation.participant.length === before) {
            return res.status(404).json({ message: "Thanh vien khong nam trong nhom" })
        }

        const [removedUser, actor] = await Promise.all([
            User.findById(memberId).select("displayName username").lean(),
            User.findById(userId).select("displayName username").lean()
        ])
        const removedName = removedUser?.displayName || removedUser?.username || "Mot thanh vien"
        const actorName = actor?.displayName || actor?.username || "Truong nhom"

        conversation.unreadCounts.delete(memberId.toString())
        const systemMessage = await appendSystemMessage(
            conversation,
            userId,
            `${removedName} duoc ${actorName} xoa khoi nhom`,
            "member_removed"
        )

        const formatted = await populateConversation(conversation)
        emitGroupUpdated(conversation, formatted)
        emitNewMessage(io, conversation, systemMessage)
        io.to(memberId.toString()).emit("group-removed", { conversationId })

        return res.status(200).json({ conversation: formatted })
    } catch (error) {
        console.log("Loi khi xoa thanh vien nhom", error);
        return res.status(500).json({ message: "Loi he thong" })
    }
}

export const transferGroupOwner = async (req, res) => {
    try {
        const { conversationId } = req.params
        const { newOwnerId } = req.body
        const userId = req.user._id

        if (!newOwnerId) {
            return res.status(400).json({ message: "Can chon truong nhom moi" })
        }

        const { conversation, error } = await getGroupForMember(conversationId, userId)
        if (error) return res.status(error.status).json({ message: error.message })

        if (!isGroupOwner(conversation, userId)) {
            return res.status(403).json({ message: "Chi truong nhom moi duoc chuyen quyen" })
        }

        const isNewOwnerMember = conversation.participant.some(
            (p) => p.userId.toString() === newOwnerId.toString()
        )

        if (!isNewOwnerMember) {
            return res.status(400).json({ message: "Truong nhom moi phai la thanh vien trong nhom" })
        }

        conversation.group.createdBy = newOwnerId
        await conversation.save()

        const formatted = await populateConversation(conversation)
        emitGroupUpdated(conversation, formatted)

        return res.status(200).json({ conversation: formatted })
    } catch (error) {
        console.log("Loi khi chuyen truong nhom", error);
        return res.status(500).json({ message: "Loi he thong" })
    }
}

export const leaveGroup = async (req, res) => {
    try {
        const { conversationId } = req.params
        const { newOwnerId } = req.body
        const userId = req.user._id

        const { conversation, error } = await getGroupForMember(conversationId, userId)
        if (error) return res.status(error.status).json({ message: error.message })

        const remainingMembers = conversation.participant.filter(
            (p) => p.userId.toString() !== userId.toString()
        )

        if (remainingMembers.length === 0) {
            await Conversation.findByIdAndDelete(conversationId)
            io.to(userId.toString()).emit("group-removed", { conversationId })
            return res.status(200).json({ message: "Da roi nhom" })
        }

        if (isGroupOwner(conversation, userId)) {
            if (!newOwnerId) {
                return res.status(400).json({ message: "Hay chon truong nhom moi truoc khi roi" })
            }

            const isNewOwnerRemainingMember = remainingMembers.some(
                (p) => p.userId.toString() === newOwnerId.toString()
            )

            if (!isNewOwnerRemainingMember) {
                return res.status(400).json({ message: "Truong nhom moi phai la thanh vien con lai" })
            }

            conversation.group.createdBy = newOwnerId
        }

        const leavingName = req.user.displayName || req.user.username || "Mot thanh vien"
        conversation.participant = remainingMembers
        conversation.unreadCounts.delete(userId.toString())
        const systemMessage = await appendSystemMessage(
            conversation,
            userId,
            `${leavingName} da roi khoi nhom`,
            "member_left"
        )

        const formatted = await populateConversation(conversation)
        emitGroupUpdated(conversation, formatted)
        emitNewMessage(io, conversation, systemMessage)
        io.to(userId.toString()).emit("group-removed", { conversationId })

        return res.status(200).json({ conversation: formatted, message: "Da roi nhom" })
    } catch (error) {
        console.log("Loi khi roi nhom", error);
        return res.status(500).json({ message: "Loi he thong" })
    }
}
