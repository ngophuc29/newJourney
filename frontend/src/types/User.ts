export interface User {
    _id: string,
    username: string,
    email: string,
    display: string,
    avatarUrl?: string,
    bio?: string,
    phone?: string,
    createdAt?: string,
    updatedAt ?:String
    
}

export interface Friend {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface FriendRequest {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}
