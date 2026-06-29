import type { Socket } from "socket.io-client";
import type { Conversation, Message, MessageReaction } from "./chat";
import type { Friend, FriendRequest, SuggestedFriend, User } from "./User";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;
  setUser: (user: User) => void;
  clearState: () => void;
  setAccessToken: (accessToken: string) => void;
  signUp: (
    username: string,
    password: string,
    email: string,
    lastName: string,
    firstName: string,
  ) => Promise<void>;

  signIn: (username: string, password: string) => Promise<void>;

  signOut: () => Promise<void>;
  fetchMe: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export interface ThemeStore {
  isDarK: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

export interface TypingUser {
  userId: string;
  displayName: string;
}

export interface ChatState {
  loading: boolean;
  conversations: Conversation[];
  messages: Record<
    string,
    {
      items: Message[]; // mang cac tin nhan
      hasMore: boolean; // co de ktra con tn chua load k
      nextCursor?: string | null;
    }
  >;
  activeConversationId: string | null; // id cuoc tro chuyen dang mo
  convoLoading: boolean;
  messasgeLoading: boolean;

  // Reply & Edit state
  replyingTo: Message | null;
  editingMessage: Message | null;

  // Typing indicator state
  typingUsers: Record<string, TypingUser[]>;

  reset: () => void;
  setActionConversation: (id: string | null) => void;
  fetchConversation: () => Promise<void>;
  fetchMessages: (conversationId?: string) => Promise<void>;
  sendDirectMessage: (
    recipientId: string,
    content: string,
    mediaFile?: File,
    mentions?: string[],
    mediaUrl?: string,
    mediaType?: string,
  ) => Promise<void>;
  sendGroupMessage: (
    conversationId: string,
    content: string,
    mediaFile?: File,
    mentions?: string[],
    mediaUrl?: string,
    mediaType?: string,
  ) => Promise<void>;
  // add message
  addMessage: (message: Message) => Promise<void>;
  toggleMessageReaction: (messageId: string, emoji: string) => Promise<void>;
  revokeMessage: (messageId: string) => Promise<void>;
  markMessageRevoked: (
    conversationId: string,
    messageId: string,
    revokedAt?: string | null,
  ) => void;
  updateMessageReactions: (
    conversationId: string,
    messageId: string,
    reactions: MessageReaction[],
  ) => void;
  // update convo
  updateConversation: (conversation: Conversation) => void;
  removeConversation: (conversationId: string) => void;
  markAsSeen: () => Promise<void>;
  addConvo: (convo: Conversation) => void;
  createConversation: (
    type: "direct" | "group",
    name: string,
    memberIds: string[],
  ) => Promise<void>;
  openDirectConversation: (friendId: string) => Promise<void>;
  renameGroup: (conversationId: string, name: string) => Promise<void>;
  addGroupMembers: (
    conversationId: string,
    memberIds: string[],
  ) => Promise<void>;
  removeGroupMember: (
    conversationId: string,
    memberId: string,
  ) => Promise<void>;
  transferGroupOwner: (
    conversationId: string,
    newOwnerId: string,
  ) => Promise<void>;
  leaveGroup: (conversationId: string, newOwnerId?: string) => Promise<void>;

  // Reply & Edit actions
  setReplyingTo: (message: Message | null) => void;
  setEditingMessage: (message: Message | null) => void;
  editMessage: (messageId: string, content: string) => Promise<void>;
  updateEditedMessage: (conversationId: string, messageId: string, content: string, editedAt: string) => void;

  // Pin actions
  pinMessage: (conversationId: string, messageId: string) => Promise<void>;
  unpinMessage: (conversationId: string, messageId: string) => Promise<void>;
  addPinnedMessage: (conversationId: string, pin: { messageId: string; pinnedBy: string; pinnedAt: string; message?: Message }) => void;
  removePinnedMessage: (conversationId: string, messageId: string) => void;

  // Search
  searchMessages: (conversationId: string, query: string) => Promise<Message[]>;

  // Forward & Media Gallery
  forwardMessage: (messageId: string, targetConversationIds: string[]) => Promise<void>;
  getConversationMedia: (conversationId: string) => Promise<Message[]>;

  // Typing
  setTypingUser: (conversationId: string, user: TypingUser) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;

  // Read Receipts
  updateMessageReadBy: (conversationId: string, userId: string, readAt: string) => void;
}

export interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export interface FriendState {
  friends: Friend[];
  loading: boolean;
  receivedList: FriendRequest[];
  sentList: FriendRequest[];
  suggestedUsers: SuggestedFriend[];
  searchByUsername: (username: string) => Promise<User | null>;
  addFriend: (to: string, message?: string) => Promise<string>;
  getAllFriendRequests: () => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  getFriends: () => Promise<void>;
  removeFriend: (friendId: string) => Promise<string>;
  getSuggestedFriends: () => Promise<void>;
  addReceivedRequest: (request: FriendRequest) => void;
  addSentRequest: (request: FriendRequest) => void;
  removeRequest: (requestId: string) => void;
  addFriendToList: (friend: Friend) => void;
  updateSuggestionStatus: (
    userId: string,
    status: "sent" | "received" | null,
  ) => void;
  removeSuggestedUser: (userId: string) => void;
  removeFriendFromList: (friendId: string) => void;
}

export interface UserState {
  updateAvatarUrl: (formData: FormData) => Promise<void>;
}
