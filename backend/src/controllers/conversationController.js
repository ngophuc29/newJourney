import Conversation from "../models/Conversation.js"
import Message from "../models/Message.js"
import { io} from "../socket/index.js"
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
            avatarUrl: p.userId?.avatarURL ?? null,
            joinedAt: p.joinedAt,
        }));
        const formatted = { ...conversation.toObject(), participants };
        return res.status(200).json({ conversation: formatted })
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