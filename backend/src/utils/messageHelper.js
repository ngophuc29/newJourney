export const updateConversationAfterCreateMessage = (conversation, message, senderId) => {

    // khi 1 tin nhan da gui di ta can Cap nhat seenBy va cap nhat LastMessage
    conversation.set({
        seenBy: [],
        lastMessageAt: message.createdAt,
        lastMessage: {
            _id: message._id,
            content: message.content,
            senderId,
            createdAt: message.createdAt
        }
    })


    // xu ly so tin nhan chua doc cua moi nguoi :
    // reset so tin nhan cua nguoi gui ve lai =0 
    // con nguoi nhan thi tang len 1

    conversation.participant.forEach((p) => {
        const memberId = p.userId.toString()
        const isSender = memberId === senderId.toString()
        // lay so tin nhan chua doc t member
        const preCount = conversation.unreadCounts.get(memberId) || 0
        conversation.unreadCounts.set(memberId, isSender ? 0 : preCount + 1)
    })
}

export const emitNewMessage = (io, conversation, message) => {
    io.to(conversation._id.toString()).emit("new-message", {
        message,
        conversation: {
            _id: conversation._id,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt,
        },
        unreadCounts: conversation.unreadCounts,
    });
};