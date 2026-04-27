import type { Conversation, Message } from "./chat";
import type { User } from "./User";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  clearState: () => void;
setAccessToken:(accessToken:string)=>void
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
  isDarK: boolean,
  toggleTheme: () => void,
  setTheme : (dark : boolean)=>void
}


export interface ChatState {
  conversations: Conversation[];
  messages: Record<string, {
    items: Message[], // mang cac tin nhan
    hasMore: boolean, // co de ktra con tn chua load k
    nextCursor?: string | null,
  
  }>
  activeConversationId: string | null, // id cuoc tro chuyen dang mo
  loading: boolean,
  reset: () => void;
  setActionConversation: (id: string | null ) => void
}