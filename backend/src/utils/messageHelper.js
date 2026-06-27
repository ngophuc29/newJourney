const toPlainUnreadCounts = (unreadCounts) => {
    if (!unreadCounts) return {};
    if (unreadCounts instanceof Map) return Object.fromEntries(unreadCounts);
    return unreadCounts;
};

export const formatConversationForClient = (conversation) => {
    const plain = conversation.toObject ? conversation.toObject() : conversation;
    const participants = (conversation.participant || []).map((p) => ({
        _id: p.userId?._id ?? p.userId,
        displayName: p.userId?.displayName,
        avatarURL: p.userId?.avatarURL ?? null,
        joinedAt: p.joinedAt,
    }));

    return {
        ...plain,
        unreadCounts: toPlainUnreadCounts(conversation.unreadCounts),
        participants,
    };
};

export const updateConversationAfterCreateMessage = (conversation, message, senderId) => {
    const fallbackContent =
        message.mediaType === "image"
            ? "[Image]"
            : message.mediaType === "video"
              ? "[Video]"
              : "";

    // khi 1 tin nhan da gui di ta can Cap nhat seenBy va cap nhat LastMessage
    conversation.set({
        seenBy: [],
        lastMessageAt: message.createdAt,
        lastMessage: {
            _id: message._id,
            content: message.content || fallbackContent,
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
    const formattedConversation = formatConversationForClient(conversation);
    const participantRooms = (conversation.participant || []).map((p) =>
        (p.userId?._id ?? p.userId).toString()
    );
    const rooms = [conversation._id.toString(), ...participantRooms];

    io.to(rooms).emit("new-message", {
        message,
        conversation: formattedConversation,
        unreadCounts: formattedConversation.unreadCounts,
    });
};
