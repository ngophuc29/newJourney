import type { Socket } from "socket.io-client";
import type { Conversation, Message } from "./chat";
import type { FriendRequest, User } from "./User";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

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

export interface ChatState {
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
  reset: () => void;
  setActionConversation: (id: string | null) => void;
  fetchConversation: () => Promise<void>;
  fetchMessages: (conversationId?: string) => Promise<void>;
  sendDirectMessage: (
    recipientId: string,
    content: string,
    imgURL?: string,
    conversationId?: string,
  ) => Promise<void>;
  sendGroupMessage: (
    conversationId: string,
    content: string,
    imgURL?: string,
  ) => Promise<void>;
  // add message
  addMessage: (message: Message) => Promise<void>;
  // update convo
  updateConversation: (conversation: unknown) => void;
  markAsSeen : ()=>Promise<void>
}

export interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
}

 
export interface FriendState {
  loading: boolean;
  receivedList: FriendRequest[];
  sentList: FriendRequest[];
  searchByUsername: (username: string) => Promise<User | null>;
  addFriend: (to: string, message?: string) => Promise<string>;
  getAllFriendRequests: () => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
}