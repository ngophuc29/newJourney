<h1 align="center">
  <br>
  🌐 NewJourney
  <br>
</h1>

<p align="center">
  <img src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHBrYjBteDAybzh6ZW41MTZhZzdycGliZXFnMDlqdWx3bDhtNnQwcCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/2IudUHdI075HL02Pkk/giphy.gif" alt="NewJourney Social App" width="320" />
</p>

<h4 align="center">A modern full-stack social network application — inspired by Facebook & Instagram — built with React, Node.js, Socket.IO & MongoDB.</h4>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-environment-variables">Environment Variables</a> •
  <a href="#-deployment">Deployment</a>
</p>

---

## 🌐 Live Demo

| Service  | URL |
|----------|-----|
| Frontend | [https://newjourney-hy30.onrender.com](https://newjourney-hy30.onrender.com) |
| Backend API | [https://newjourney-hy30.onrender.com/api](https://newjourney-hy30.onrender.com/api) |

> ⚠️ The backend is hosted on Render's free tier — it may take **30–60 seconds** to spin up on first visit.

---

## ✨ Features

### 🔐 Authentication & Security
- **JWT Access Token** (short-lived, 30 minutes) stored in memory
- **Refresh Token** (long-lived, 14 days) stored in an `httpOnly` cookie for XSS protection
- **Silent token refresh** — automatically renews access tokens via the `/auth/refresh` endpoint using the Axios response interceptor
- **Session management** via a dedicated `Session` MongoDB collection with TTL index for automatic expiry
- **Password hashing** with `bcrypt` (salt rounds = 10)
- **Protected routes** on both frontend (React Router) and backend (JWT middleware)

### 📰 News Feed & Posts (Facebook-style)
- **Personalised News Feed** (`/`) — shows posts from people you follow plus public trending posts
- **Create posts** with text, multiple images, and/or videos (uploaded to Cloudinary)
- **Image/Video Carousel** — swipe through multiple media items on a single post
- **Like posts** — toggleable reaction with live counter update
- **Nested comments & replies** — full multi-level comment thread on each post
- **Quick post box** — click "Bạn đang nghĩ gì thế?" or the photo/video shortcuts to open the Create Post dialog instantly
- **Post detail page** (`/post/:postId`) — dedicated page for each post, accessible from notifications
- **Delete posts** — post owners can remove their own posts; the feed updates immediately
- **Share link** — copy the direct URL to any post to the clipboard

### 📸 Stories / Khoảnh khắc (Instagram-style)
- **Đăng tải Khoảnh khắc**: Upload image or short video Stories
- **Auto-expiry**: Stories disappear automatically after **24 hours** via MongoDB TTL index
- **Story Tray**: Horizontally scrollable strip at the top of the feed showing active friends' Stories
- **Story Viewer**:
  - Beautiful full-screen viewer with automatic progress bar (5 seconds per story)
  - Navigate forward/backward between stories of the same user or switch to another friend
  - Auto-marks stories as viewed on display; shows viewer count & list
  - **Smart pause** — progress pauses automatically while typing a reply
  - **Quick emoji reactions** (❤️ 🙌 🔥 👏 😂 😢) — tap to react to a story
  - **Reply via DM** — replies are sent directly to the story author's inbox

### 👤 User Profile (Instagram-style)
- **Cover photo + Avatar** — full-width banner with overlapping circular avatar
- **Edit profile** — change display name, bio, phone number directly from the profile page
- **Upload avatar & cover photo** — images are stored on Cloudinary and updated in real time
- **Social stats** — Bài viết / Người theo dõi / Đang theo dõi — click each to see the full list
- **Post grid** (`/profile/:username`) — Instagram-style square grid of all user posts; click any post to open a quick preview modal with full like/comment support
- **Message shortcut** — "Nhắn tin" button on any other user's profile creates or opens a direct conversation and redirects to `/chat`

### 🤝 Follow System
- **Follow / Unfollow** users from the Feed suggestions or their profile page
- **Followers & Following lists** — viewable as a modal from the profile stats
- **Suggested users** panel on the feed right-hand column

### 💬 Real-time Messaging (Chat)
- **Direct (1-on-1) messaging** — preserved as a dedicated full-screen interface at `/chat`
- **Group chat** with full group management (rename, add/remove members, transfer ownership, leave)
- **Socket.IO** powered real-time delivery — no page refresh needed
- **Media sharing** — send images, videos, and files in conversations (via Cloudinary)
- **🎙️ Audio messages** — record and play voice notes with a custom AudioPlayer
- **Emoji reactions** — react to any message with any emoji
- **Message revocation** — unsend your own messages (cleared for all participants)
- **Infinite scroll / pagination** for message history (cursor-based)
- **Unread message counters** per conversation
- **Mark as seen** — conversations are marked read when opened
- **Online presence indicators** — see which friends are currently online
- **Back to Feed button** — prominent button in the chat sidebar to return to the News Feed

### 🔔 Notification Centre
- **Badge counter** — bell icon in the sidebar shows the live count of unread notifications
- **Supported notification types**:
  - `post_like` — someone liked your post
  - `post_comment` — someone commented on your post
  - `follow` — someone started following you
  - `friend_request` — someone sent you a friend request
  - `group_invite` — you were invited to a group
- **Smart navigation on click**:
  - Like / Comment notifications → navigate to the exact post at `/post/:postId`
  - If you are **already viewing that post**, the notification click triggers a **silent data refresh** (no page reload) so the like/comment count updates instantly
  - Follow notifications → navigate to the sender's profile
- **Mark as read / delete** — per-notification actions directly from the dialog

### 🗂️ Group Chat Management
- Create group conversations (name + multiple members)
- **Rename group**, **Add / Remove members**
- **Transfer group ownership** to another member
- **Leave group** (with optional owner handover)
- System messages emitted for membership events

### 📱 Progressive Web App (PWA)
- **Install on home screen** — supported on both desktop and mobile browsers
- **Install prompt banner** (`PwaInstallPrompt`) shown on compatible browsers
- Mobile-optimised UI with bottom navigation bar

### 🎨 UI / UX
- **Responsive layout** — dual-column desktop layout, bottom-tab mobile layout
- **Dark / Light mode** toggle (persisted via Zustand + localStorage)
- **MainLayout** — shared sidebar (desktop) + bottom nav (mobile) wrapping all social pages; Chat stays isolated to preserve its original full-screen experience
- Skeleton loading states for conversations, messages, and feeds
- Emoji picker powered by `@emoji-mart/react`
- Toast notifications via `sonner`

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19 | UI framework |
| **TypeScript** | 5.9 | Type safety |
| **Vite** | 8 | Build tool & dev server |
| **React Router DOM** | 7 | Client-side routing |
| **Zustand** | 5 | Global state management |
| **Axios** | 1.13 | HTTP client with interceptors |
| **Socket.IO Client** | 4.8 | Real-time WebSocket communication |
| **React Hook Form** | 7.72 | Form management |
| **Zod** | 4 | Schema validation |
| **TailwindCSS** | 4 | Utility-first CSS framework |
| **shadcn/ui** | 4 | Accessible component library |
| **Sonner** | 2 | Toast notification system |
| **@emoji-mart/react** | 1.1 | Emoji picker component |
| **Lucide React** | 1 | Icon library |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | ≥18 | JavaScript runtime |
| **Express** | 5 | HTTP web framework |
| **Socket.IO** | 4.8 | Real-time bi-directional communication |
| **MongoDB** | Cloud (Atlas) | Primary database |
| **Mongoose** | 9.3 | MongoDB ODM |
| **JSON Web Token** | 9 | Access token generation & verification |
| **bcrypt** | 6 | Password hashing |
| **Cloudinary** | 2 | Media (image/video) upload & hosting |
| **Multer** | 2 | Multipart file parsing |
| **cookie-parser** | 1.4 | Cookie handling for Refresh Token |
| **cors** | 2.8 | Cross-Origin Resource Sharing |
| **dotenv** | 17 | Environment variable loading |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                        │
│                                                              │
│   React + TypeScript + Vite                                 │
│   ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│   │    Pages     │  │  Components  │  │      Stores       │ │
│   │ FeedPage     │  │ PostCard     │  │ useAuthStore      │ │
│   │ ProfilePage  │  │ StoryTray    │  │ useChatStore      │ │
│   │ PostDetail   │  │ MainLayout   │  │ useNotification   │ │
│   │ ChatApp      │  │ Notification │  │ useStoryStore     │ │
│   │ ExplorePage  │  │ CreatePost   │  │ useFriendStore    │ │
│   └──────┬───────┘  └──────┬───────┘  └────────┬──────────┘ │
│          └─────────────────┴───────────────────┘            │
│                             │                               │
│                ┌────────────┴──────────────┐                │
│                │  HTTP (Axios) + WS (Socket.IO)             │
└────────────────┼───────────────────────────┼────────────────┘
                 │                           │
                 ▼                           ▼
┌──────────────────────────────────────────────────────────────┐
│                  SERVER (Node.js / Express)                   │
│                                                              │
│   ┌──────────────────────┐  ┌──────────────────────────┐    │
│   │      REST API        │  │    Socket.IO Server       │    │
│   │  /api/auth           │  │                          │    │
│   │  /api/users          │  │  - online-users           │    │
│   │  /api/friend         │  │  - new-message            │    │
│   │  /api/message        │  │  - message-reaction       │    │
│   │  /api/conversation   │  │  - message-revoked        │    │
│   │  /api/posts          │  │  - new-notification       │    │
│   │  /api/social         │  │                          │    │
│   │  /api/stories        │  └──────────────────────────┘    │
│   │  /api/notifications  │                                   │
│   └──────────┬───────────┘                                   │
│              │                                               │
│   ┌──────────▼────────────────────────────────────────────┐  │
│   │                  Middleware Layer                      │  │
│   │  authMiddleware • friendMiddleware                     │  │
│   │  socketAuthMiddleware • uploadMiddleware               │  │
│   └──────────┬────────────────────────────────────────────┘  │
│              │                                               │
│   ┌──────────▼────────────────────────────────────────────┐  │
│   │              MongoDB (Atlas)                           │  │
│   │  Users • Sessions • Friends • FriendRequests          │  │
│   │  Conversations • Messages • Notifications             │  │
│   │  Stories • Posts • Comments • Follows                 │  │
│   └──────────┬────────────────────────────────────────────┘  │
│              │                                               │
│   ┌──────────▼────────────────────────────────────────────┐  │
│   │                Cloudinary CDN                          │  │
│   │    (Avatar • Cover Photo • Post Media • Story Media)  │  │
│   └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
1. User signs in  ──►  POST /api/auth/signin
                         │
                    ┌────▼──────────────────────┐
                    │  Verify username/password  │
                    │  Create JWT access token   │
                    │  Create refresh token      │
                    │  Store session in MongoDB  │
                    └────┬──────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │ accessToken (JSON body)     │  refreshToken (httpOnly cookie)
          ▼                             ▼
   Stored in Zustand             Stored in browser
   (in-memory only)              (inaccessible to JS)

2. Every API request  ──►  Axios interceptor attaches Bearer token
3. 403 response       ──►  Axios interceptor calls POST /api/auth/refresh
                            ► Gets new access token
                            ► Retries original request (max 4 times)
```

---

## 📁 Project Structure

```
newJourney/
├── backend/
│   ├── src/
│   │   ├── controllers/          # Request handlers / business logic
│   │   │   ├── authController.js
│   │   │   ├── conversationController.js
│   │   │   ├── friendController.js
│   │   │   ├── messageController.js
│   │   │   ├── notificationController.js
│   │   │   ├── postController.js        # ✨ Posts, likes, comments
│   │   │   ├── socialController.js      # ✨ Follow/unfollow system
│   │   │   ├── storyController.js
│   │   │   └── userController.js        # ✨ Avatar + cover photo upload
│   │   ├── middlewares/          # Express middleware
│   │   │   ├── authMiddleware.js      # JWT verification
│   │   │   ├── friendMiddle.js        # Friend/group membership checks
│   │   │   ├── socketMiddleware.js    # Socket.IO auth
│   │   │   └── uploadMiddleware.js    # Multer + Cloudinary
│   │   ├── models/               # Mongoose schemas
│   │   │   ├── User.js                  # ✨ + coverPhotoURL, coverPhotoID
│   │   │   ├── Session.js
│   │   │   ├── Friend.js
│   │   │   ├── FriendRequest.js
│   │   │   ├── Conversation.js
│   │   │   ├── Message.js
│   │   │   ├── Notification.js          # ✨ + follow, post_like, post_comment types
│   │   │   ├── Story.js
│   │   │   ├── Post.js                  # ✨ NEW — post schema
│   │   │   ├── Comment.js               # ✨ NEW — nested comment schema
│   │   │   └── Follow.js                # ✨ NEW — follow relationship schema
│   │   ├── routes/               # Express route definitions
│   │   │   ├── authRoutes.js
│   │   │   ├── conversationRoutes.js
│   │   │   ├── friendRoute.js
│   │   │   ├── messageRoutes.js
│   │   │   ├── notificationRoutes.js
│   │   │   ├── postRoutes.js            # ✨ NEW
│   │   │   ├── socialRoute.js           # ✨ NEW
│   │   │   ├── storyRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── socket/
│   │   │   └── index.js          # Socket.IO server setup & events
│   │   ├── utils/
│   │   │   └── messageHelper.js  # Shared message utilities
│   │   └── server.js             # Application entry point
│   ├── .env                      # Environment variables (DO NOT COMMIT)
│   └── package.json
│
└── frontend/
    ├── public/
    │   ├── logo.svg
    │   ├── placeholder.png
    │   └── placeholderSignUp.png
    ├── src/
    │   ├── components/
    │   │   ├── auth/
    │   │   │   ├── signin-form.tsx    # Login form with Zod validation
    │   │   │   ├── signup-form.tsx    # Register form with Zod validation
    │   │   │   ├── ProtectedRoute.tsx # Guards authenticated pages
    │   │   │   └── Logout.tsx
    │   │   ├── chat/                  # Chat UI components (AudioPlayer, etc.)
    │   │   ├── layout/
    │   │   │   └── MainLayout.tsx     # ✨ NEW — shared sidebar + bottom nav
    │   │   ├── social/                # ✨ NEW
    │   │   │   ├── PostCard.tsx       # Post card with carousel, like, comment
    │   │   │   └── CreatePostDialog.tsx # Reusable post creation dialog
    │   │   ├── sidebar/               # Sidebar navigation (Chat)
    │   │   ├── profile/               # User profile components
    │   │   ├── friends/               # Friend list components
    │   │   ├── friendRequest/         # Friend request components
    │   │   ├── AddFriendModel/        # Add friend modal
    │   │   ├── createNewChat/         # New chat/group modal
    │   │   ├── newGroupChat/          # Group chat creation
    │   │   ├── story/                 # Story components (StoryTray, StoryViewer)
    │   │   ├── notification/          # NotificationBell & NotificationDialog
    │   │   └── ui/                    # shadcn/ui base components + PwaInstallPrompt
    │   ├── hooks/                     # Custom React hooks
    │   ├── lib/
    │   │   ├── axios.ts               # Axios instance + interceptors
    │   │   └── utils.ts               # Utility functions (cn, etc.)
    │   ├── pages/
    │   │   ├── SignInpage.tsx
    │   │   ├── SignUpPage.tsx
    │   │   ├── ChatApp.tsx            # Full-screen chat (isolated, no MainLayout)
    │   │   ├── FeedPage.tsx           # ✨ NEW — News feed homepage
    │   │   ├── ExplorePage.tsx        # ✨ NEW — Explore / Discover page
    │   │   ├── ProfilePage.tsx        # ✨ NEW — User profile page
    │   │   └── PostDetailPage.tsx     # ✨ NEW — Single post detail page
    │   ├── services/                  # API call functions
    │   │   ├── authService.ts
    │   │   └── chatService.ts
    │   ├── stores/                    # Zustand state stores
    │   │   ├── useAuthStore.ts
    │   │   ├── useChatStore.ts
    │   │   ├── useFriendStore.ts
    │   │   ├── useNotificationStore.ts
    │   │   ├── useStoryStore.ts
    │   │   ├── useSocketStore.ts
    │   │   ├── useThemeStore.ts
    │   │   └── useUserStore.ts
    │   ├── types/                     # TypeScript type definitions
    │   │   ├── store.ts
    │   │   ├── chat.ts
    │   │   └── User.ts
    │   ├── App.tsx                    # Root component + routing
    │   ├── main.tsx                   # React entry point
    │   └── index.css                  # Global styles
    ├── .env.development              # Dev environment variables
    ├── .env.production               # Prod environment variables
    ├── vite.config.ts
    ├── tailwind.config.ts
    └── package.json
```

---

## 📡 API Reference

> All routes (except `/api/auth`) require a valid `Authorization: Bearer <accessToken>` header.

### 🔐 Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/test` | ❌ | Health check for auth router |
| `POST` | `/signup` | ❌ | Register a new user |
| `POST` | `/signin` | ❌ | Login and get tokens |
| `POST` | `/signout` | ❌ | Logout and invalidate session |
| `POST` | `/refresh` | ❌ (cookie) | Refresh access token using refresh token cookie |

#### `POST /api/auth/signup` — Request Body
```json
{
  "username": "johndoe",       // min 3 characters
  "password": "mypassword",    // min 8 characters
  "email": "john@example.com", // valid email format
  "firstName": "John",
  "lastName": "Doe"
}
```

#### `POST /api/auth/signin` — Response
```json
{
  "message": "User John Doe đã login thành công",
  "accessToken": "<jwt_access_token>"
}
```
*`refreshToken` is set as an `httpOnly` cookie.*

---

### 👤 Users — `/api/users`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/me` | Get currently authenticated user's profile |
| `PATCH` | `/me/avatar` | Upload and update user avatar (multipart/form-data) |
| `PATCH` | `/me/cover` | ✨ Upload and update user cover photo |
| `PATCH` | `/me` | ✨ Update display name, bio, phone number |
| `GET` | `/:username/profile` | ✨ Get any user's public profile |

---

### 👫 Friends — `/api/friend`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/requests` | Send a friend request |
| `POST` | `/requests/:requestId/accept` | Accept a friend request |
| `POST` | `/requests/:requestId/decline` | Decline a friend request |
| `GET` | `/friends` | Get all friends of the current user |
| `DELETE` | `/friends/:friendId` | Remove a friend |
| `GET` | `/suggestions` | Get suggested users (non-friends) |
| `GET` | `/requests` | Get all incoming & outgoing friend requests |
| `GET` | `/search?username=` | Search users by username |

---

### 📝 Posts — `/api/posts` ✨ NEW

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Create a new post (supports up to 10 media files via `multipart/form-data`) |
| `GET` | `/feed` | Get paginated news feed posts (from followed users) |
| `GET` | `/explore` | Get public/trending posts for the Explore page |
| `GET` | `/user/:username` | Get all posts by a specific user |
| `GET` | `/:postId` | Get a single post by ID |
| `POST` | `/:postId/like` | Toggle like on a post |
| `POST` | `/:postId/comments` | Add a comment (or reply) to a post |
| `GET` | `/:postId/comments` | Get comments for a post |
| `DELETE` | `/:postId` | Delete a post (owner only) |

---

### 🤝 Social (Follow) — `/api/social` ✨ NEW

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/follow/:userId` | Follow or unfollow a user (toggle) |
| `GET` | `/followers/:userId` | Get a user's followers list |
| `GET` | `/following/:userId` | Get a user's following list |
| `GET` | `/suggestions` | Get suggested users to follow |

---

### 💬 Messages — `/api/message`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/direct` | Send a direct message (supports file upload) |
| `POST` | `/group` | Send a group message (supports file upload) |
| `PATCH` | `/:messageId/reactions` | Toggle an emoji reaction on a message |
| `PATCH` | `/:messageId/revoke` | Revoke (unsend) a message |

---

### 🗂️ Conversations — `/api/conversation`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Create a new direct or group conversation |
| `GET` | `/` | Get all conversations for the current user |
| `GET` | `/:conversationId/messages` | Fetch paginated messages for a conversation |
| `PATCH` | `/:conversationId/seen` | Mark a conversation as read |
| `PATCH` | `/:conversationId/group/name` | Rename a group |
| `POST` | `/:conversationId/group/members` | Add members to a group |
| `DELETE` | `/:conversationId/group/members/:memberId` | Remove a member from a group |
| `PATCH` | `/:conversationId/group/owner` | Transfer group ownership |
| `POST` | `/:conversationId/group/leave` | Leave a group conversation |

---

### 🔔 Notifications — `/api/notifications`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Get all notifications for the current user |
| `PATCH` | `/:notificationId/read` | Mark a notification as read |
| `DELETE` | `/:notificationId` | Delete a notification |

---

### 📸 Stories — `/api/stories`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Upload a new Story (image/video via `multipart/form-data`) |
| `GET` | `/` | Get active Stories from self and followed users (last 24 hours) |
| `PATCH` | `/:storyId/view` | Mark a Story as viewed |

---

## 🔌 Socket.IO Events

### Client → Server (Emit)

| Event | Payload | Description |
|-------|---------|-------------|
| `join-conversation` | `conversationId: string` | Join a specific conversation room |
| `leave-conversation` | `conversationId: string` | Leave a conversation room |

### Server → Client (Listen)

| Event | Payload | Description |
|-------|---------|-------------|
| `online-users` | `userIds: string[]` | List of all currently online user IDs |
| `new-message` | `{ message, conversation }` | A new message in one of your conversations |
| `update-conversation` | `conversation` | Updated conversation metadata |
| `message-reaction-updated` | `{ messageId, conversationId, reactions }` | Reactions changed on a message |
| `message-revoked` | `{ messageId, conversationId, isRevoked, revokedAt }` | A message was revoked |
| `new-notification` | `notification` | ✨ A new social notification (like, comment, follow) |

> Socket connections are **authenticated** via the `socketAuthMiddleware`, which verifies the `Authorization` header containing the JWT access token before allowing a socket to connect.

---

## 🗄️ Database Schema

### User
| Field | Type | Notes |
|-------|------|-------|
| `username` | String | Unique, lowercase, trimmed |
| `hashedPassword` | String | bcrypt hash |
| `email` | String | Unique, lowercase |
| `displayName` | String | `"Họ Tên"` format |
| `avatarURL` | String | Cloudinary URL |
| `avatarID` | String | Cloudinary public ID |
| `coverPhotoURL` | String | ✨ Cloudinary URL for cover photo |
| `coverPhotoID` | String | ✨ Cloudinary public ID for cover photo |
| `bio` | String | Max 500 characters |
| `phone` | String | Sparse (unique but nullable) |

### Post ✨ NEW
| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId (ref: User) | Post author |
| `content` | String | Text content |
| `media` | Array | `[{ url, type, publicId }]` — up to 10 items |
| `likes` | Array of ObjectIds | Users who liked the post |
| `commentsCount` | Number | Cached comment count |

### Comment ✨ NEW
| Field | Type | Notes |
|-------|------|-------|
| `postId` | ObjectId (ref: Post) | Indexed |
| `userId` | ObjectId (ref: User) | Comment author |
| `parentId` | ObjectId (ref: Comment) | `null` for top-level; set for replies |
| `content` | String | Comment text |

### Follow ✨ NEW
| Field | Type | Notes |
|-------|------|-------|
| `followerId` | ObjectId (ref: User) | The user who follows |
| `followingId` | ObjectId (ref: User) | The user being followed |
| — | — | Compound unique index on `{ followerId, followingId }` |

### Session
| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId (ref: User) | Indexed |
| `refreshToken` | String | Unique, 128 hex chars |
| `expiresAt` | Date | TTL index — auto deleted after expiry |

### Friend
| Field | Type | Notes |
|-------|------|-------|
| `userA` | ObjectId (ref: User) | Normalized (smaller ID always stored as `userA`) |
| `userB` | ObjectId (ref: User) | Compound unique index with `userA` |

### Conversation
| Field | Type | Notes |
|-------|------|-------|
| `type` | String | `"direct"` \| `"group"` |
| `participant` | Array | `{ userId, joinedAt }` — compound indexed |
| `group` | Object | `{ name, createdBy }` — only for group chats |
| `lastMessage` | Object | Snapshot of the most recent message |
| `lastMessageAt` | Date | For sorting conversations |
| `seenBy` | Array of ObjectIds | Users who have seen the latest message |
| `unreadCounts` | Map (String → Number) | Per-user unread counts |

### Message
| Field | Type | Notes |
|-------|------|-------|
| `conversationId` | ObjectId (ref: Conversation) | Indexed |
| `senderId` | ObjectId (ref: User) | |
| `content` | String | Trimmed |
| `mediaUrl` | String | Cloudinary URL |
| `mediaType` | String | `"image"` \| `"video"` \| `"file"` \| `"audio"` |
| `mediaPublicId` | String | Cloudinary public ID |
| `fileName` | String | Attachment file name |
| `fileSize` | Number | Attachment file size |
| `duration` | Number | Voice message duration (seconds) |
| `type` | String | `"user"` \| `"system"` |
| `reactions` | Array | `[{ userId, emoji }]` |
| `isRevoked` | Boolean | Default: `false` |
| `revokedAt` | Date | Set when message is revoked |

### Notification
| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId (ref: User) | Recipient (indexed) |
| `type` | String | `"friend_request"` \| `"mention"` \| `"group_invite"` \| `"follow"` \| `"post_like"` \| `"post_comment"` |
| `senderId` | ObjectId (ref: User) | Actor |
| `relatedId` | ObjectId | Related Post ID (for like/comment notifications) |
| `isRead` | Boolean | Default: `false` |

### Story
| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId (ref: User) | Story author |
| `mediaUrl` | String | Cloudinary URL |
| `mediaType` | String | `"image"` \| `"video"` |
| `viewers` | Array of ObjectIds (ref: User) | Users who have viewed this story |
| `createdAt` | Date | TTL index — auto deleted after **24 hours** |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **MongoDB Atlas** account (or local MongoDB ≥ 6.x)
- **Cloudinary** account (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/ngophuc29/newJourney.git
cd newJourney
```

### 2. Set up the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (see [Environment Variables](#-environment-variables)):

```bash
cp .env.example .env   # then fill in your values
```

Start the backend development server:

```bash
npm run dev
# Server running on http://localhost:5001
```

### 3. Set up the Frontend

```bash
cd ../frontend
npm install
```

Create a `.env.development` file in the `frontend/` directory:

```bash
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

Start the frontend development server:

```bash
npm run dev
# App running on http://localhost:5173
```

### 4. Open in Browser

Navigate to [http://localhost:5173](http://localhost:5173) and create an account to get started.

---

## 🔑 Environment Variables

### Backend — `backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | ❌ | Server port (default: `5001`) |
| `MONGODB_CONNECTION` | ✅ | MongoDB connection string |
| `ACCESS_TOKEN_SECRET` | ✅ | Secret key for signing JWT access tokens |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `NODE_ENV` | ❌ | `"production"` or `"development"` |

> ⚠️ **Security Warning:** Never commit your `.env` file. Add it to `.gitignore`.

### Frontend — `frontend/.env.development` / `.env.production`

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Base URL for REST API (e.g., `http://localhost:5001/api`) |
| `VITE_SOCKET_URL` | ✅ | Base URL for Socket.IO server (e.g., `http://localhost:5001`) |

---

## 🔒 Security Considerations

| Topic | Implementation |
|-------|---------------|
| **Password storage** | Bcrypt with salt rounds = 10 |
| **Access token** | Short-lived JWT (30 min), stored in-memory only |
| **Refresh token** | Long-lived (14 days), `httpOnly` + `Secure` + `SameSite` cookie |
| **XSS protection** | `httpOnly` cookie prevents JS from accessing refresh token |
| **Input validation** | Zod on frontend; manual validation in controller on backend |
| **Authorization** | Every protected route verifies JWT via `authMiddleware` |
| **Message ownership** | Revoke endpoint checks `senderId === currentUser._id` |
| **Post ownership** | Delete post endpoint checks `userId === currentUser._id` |
| **Group membership** | `checkGroupMembership` middleware validates before group operations |
| **Friendship check** | `checkFriendship` middleware prevents messaging non-friends |

---

## 🧩 State Management

The app uses **Zustand** with selective persistence via `localStorage`:

| Store | Persisted | Description |
|-------|-----------|-------------|
| `useAuthStore` | `user` only | Auth state, token management, sign-in/out actions |
| `useChatStore` | `conversations` only | Conversation list, messages, real-time updates |
| `useFriendStore` | ❌ | Friends, requests, suggestions |
| `useNotificationStore` | ❌ | Real-time notifications (like, comment, follow), unread count, read actions |
| `useStoryStore` | ❌ | Instagram-like stories, active viewer state, uploads |
| `useSocketStore` | ❌ | Socket.IO connection lifecycle |
| `useThemeStore` | `isDark` | Dark/Light mode preference |
| `useUserStore` | ❌ | Profile update actions |

> Access tokens are stored **only in memory** (Zustand store, not persisted to `localStorage`) for security. On page refresh, the `ProtectedRoute` component automatically attempts a silent token refresh using the `httpOnly` refresh token cookie.

---

## 📝 Validation Rules

Frontend (Zod) and Backend (controller) are kept in sync:

| Field | Rule | Message |
|-------|------|---------|
| `username` | min 3 chars | "Tên đăng nhập phải có ít nhất 3 ký tự" |
| `password` | min 8 chars | "Mật khẩu phải có ít nhất 8 ký tự" |
| `email` | valid format | "Email không hợp lệ" |
| `firstName` | min 1 char | "Tên bắt buộc phải có" |
| `lastName` | min 1 char | "Họ bắt buộc phải có" |

---

## 🌍 Deployment

The application is deployed on **Render** (free tier):

### Backend Deployment (Render Web Service)
- **Build command:** `npm install`
- **Start command:** `node src/server.js`
- **Environment variables:** Set all backend `.env` variables in Render dashboard

### Frontend Deployment (Render Static Site / Vercel)
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Environment variables:** Set `VITE_API_URL` and `VITE_SOCKET_URL` pointing to your deployed backend URL

A `vercel.json` is included in the frontend for SPA routing support:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

> 💡 **Tip:** On Render's free plan, the backend sleeps after 15 minutes of inactivity. The app implements a **health check polling mechanism** in `App.tsx` that pings `/api/health` every 3 seconds and displays a friendly "Đang khởi động server..." screen until the server wakes up.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/ngophuc29">ngophuc29</a>
</p>