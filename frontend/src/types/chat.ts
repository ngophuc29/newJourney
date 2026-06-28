export interface Participant {
  _id: string;
  displayName: string;
  avatarURL?: string | null;
  joinedAt: string;
}

export interface SeenUser {
  _id: string;
  displayName?: string;
  avatarURL?: string | null;
}

export interface Group {
  name: string;
  createdBy: string;
}

export interface LastMessage {
  _id: string;
  content: string;
  createdAt: string;
  sender: {
    _id: string;
    displayName: string;
    avatarURL?: string | null;
  };
}

export interface ReplyTo {
  _id: string;
  content: string | null;
  senderId: string;
  senderName?: string | null;
  mediaType?: "image" | "video" | null;
}

export interface PinnedMessage {
  messageId: string;
  pinnedBy: string;
  pinnedAt: string;
  message?: Message | null;
}

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  group: Group;
  participants: Participant[];
  lastMessageAt: string;
  seenBy: SeenUser[];
  lastMessage: LastMessage | null;
  unreadCounts: Record<string, number>; // key = userId, value = unread count
  pinnedMessages?: PinnedMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationResponse {
  conversations: Conversation[];
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  imgUrl?: string | null;
  imageUrl?: string | null;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | null;
  mediaPublicId?: string | null;
  type?: "user" | "system";
  systemType?: string | null;
  reactions?: MessageReaction[];
  replyTo?: ReplyTo | null;
  isEdited?: boolean;
  editedAt?: string | null;
  isRevoked?: boolean;
  revokedAt?: string | null;
  updatedAt?: string | null;
  createdAt: string;
  isOwn?: boolean;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  _id?: string;
}
