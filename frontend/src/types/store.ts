import type { Socket } from "socket.io-client";
import type { Conversation, Message } from "./chat";
import type { User } from "./User";

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
}

export interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
}