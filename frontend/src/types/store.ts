import type { User } from "./User";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  clearState: () => void;

  signUp: (
    username: string,
    password: string,
    email: string,
    lastName: string,
    firstName: string,
  ) => Promise<void>;

  signIn: (username: string, password: string) => Promise<void>;

  signOut: () => Promise<void>;
  fetchMe: ()=>Promise<void>
}
