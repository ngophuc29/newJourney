<h1 align="center">
  <br>
  💬 NewJourney
  <br>
</h1>

<h4 align="center">A modern, real-time full-stack chat application built with React, Node.js, Socket.IO & MongoDB.</h4>

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

### 💬 Real-time Messaging
- **Direct (1-on-1) messaging** with friends
- **Group chat** with full group management
- **Socket.IO** powered real-time delivery — no page refresh needed
- **Media sharing** — send images and videos in conversations (via Cloudinary)
- **Emoji reactions** — react to any message with any emoji
- **Message revocation** — unsend your own messages; the message is cleared for all participants
- **Infinite scroll / pagination** for message history (cursor-based)
- **Unread message counters** per conversation
- **Mark as seen** — conversations are marked read when opened
- **Online presence indicators** — see which friends are currently online

### 👥 Social / Friend System
- **Send friend requests** with an optional message
- **Accept / Decline** incoming friend requests
- **Remove friends**
- **Suggested users** — discover people you may know
- **Search users** by username

### 🗂️ Group Chat Management
- Create group conversations (name + multiple members)
- **Rename group**
- **Add / Remove members**
- **Transfer group ownership** to another member
- **Leave group** (with optional owner handover)
- System messages are emitted for membership events

### 🎨 UI / UX
- Fully responsive layout
- Dark / Light mode toggle (persisted)
- Skeleton loading states for conversations and messages
- Emoji picker powered by `@emoji-mart/react`
- Toast notifications via `sonner`
- Avatar upload with Cloudinary CDN

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
┌─────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                │
│                                                     │
│   React + TypeScript + Vite                        │
│   ┌──────────┐  ┌────────────┐  ┌───────────────┐  │
│   │  Pages   │  │ Components │  │    Stores     │  │
│   │ SignIn   │  │ Auth Forms │  │ useAuthStore  │  │
│   │ SignUp   │  │ Chat UI    │  │ useChatStore  │  │
│   │ ChatApp  │  │ Sidebar    │  │ useFriendStore│  │
│   └────┬─────┘  └─────┬──────┘  └──────┬────────┘  │
│        │              │                │           │
│        └──────────────┴────────────────┘           │
│                        │                           │
│              ┌─────────┴──────────┐                │
│              │    HTTP (Axios)     │  WS (Socket.IO)│
└──────────────┼────────────────────┼────────────────┘
               │                    │
               ▼                    ▼
┌─────────────────────────────────────────────────────┐
│                  SERVER (Node.js / Express)          │
│                                                     │
│   ┌──────────────────┐  ┌──────────────────────┐   │
│   │   REST API       │  │   Socket.IO Server   │   │
│   │  /api/auth       │  │                      │   │
│   │  /api/users      │  │  - online-users      │   │
│   │  /api/friend     │  │  - new-message       │   │
│   │  /api/message    │  │  - message-reaction  │   │
│   │  /api/convo      │  │  - message-revoked   │   │
│   └────────┬─────────┘  └──────────┬───────────┘   │
│            │                       │               │
│   ┌────────▼───────────────────────▼───────────┐   │
│   │            Middleware Layer                 │   │
│   │  authMiddleware • friendMiddleware          │   │
│   │  socketAuthMiddleware • uploadMiddleware    │   │
│   └────────────────────┬────────────────────────┘  │
│                        │                           │
│   ┌────────────────────▼────────────────────────┐  │
│   │          MongoDB (Atlas)                     │  │
│   │  Users • Sessions • Friends • FriendRequests│  │
│   │  Conversations • Messages                   │  │
│   └─────────────────────────────────────────────┘  │
│                        │                           │
│   ┌────────────────────▼────────────────────────┐  │
│   │              Cloudinary CDN                  │  │
│   │         (Image & Video Storage)              │  │
│   └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
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
│   │   │   └── userController.js
│   │   ├── middlewares/          # Express middleware
│   │   │   ├── authMiddleware.js      # JWT verification
│   │   │   ├── friendMiddle.js        # Friend/group membership checks
│   │   │   ├── socketMiddleware.js    # Socket.IO auth
│   │   │   └── uploadMiddleware.js    # Multer + Cloudinary
│   │   ├── models/               # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Session.js
│   │   │   ├── Friend.js
│   │   │   ├── FriendRequest.js
│   │   │   ├── Conversation.js
│   │   │   └── Message.js
│   │   ├── routes/               # Express route definitions
│   │   │   ├── authRoutes.js
│   │   │   ├── conversationRoutes.js
│   │   │   ├── friendRoute.js
│   │   │   ├── messageRoutes.js
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
    │   │   ├── chat/                  # Chat UI components
    │   │   ├── sidebar/               # Sidebar navigation
    │   │   ├── profile/               # User profile components
    │   │   ├── friends/               # Friend list components
    │   │   ├── friendRequest/         # Friend request components
    │   │   ├── AddFriendModel/        # Add friend modal
    │   │   ├── createNewChat/         # New chat/group modal
    │   │   ├── newGroupChat/          # Group chat creation
    │   │   └── ui/                    # shadcn/ui base components
    │   ├── hooks/                     # Custom React hooks
    │   ├── lib/
    │   │   ├── axios.ts               # Axios instance + interceptors
    │   │   └── utils.ts               # Utility functions (cn, etc.)
    │   ├── pages/
    │   │   ├── SignInpage.tsx
    │   │   ├── SignUpPage.tsx
    │   │   └── ChatApp.tsx
    │   ├── services/                  # API call functions
    │   │   ├── authService.ts
    │   │   └── chatService.ts
    │   ├── stores/                    # Zustand state stores
    │   │   ├── useAuthStore.ts
    │   │   ├── useChatStore.ts
    │   │   ├── useFriendStore.ts
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

> All routes under `/api/users`, `/api/friend`, `/api/message`, `/api/conversation` require a valid `Authorization: Bearer <accessToken>` header.

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

#### `POST /api/auth/signin` — Request Body
```json
{
  "username": "johndoe",
  "password": "mypassword"
}
```
**Response:**
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

### 💬 Messages — `/api/message`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/direct` | Send a direct message (supports file upload) |
| `POST` | `/group` | Send a group message (supports file upload) |
| `PATCH` | `/:messageId/reactions` | Toggle an emoji reaction on a message |
| `PATCH` | `/:messageId/revoke` | Revoke (unsend) a message |

**Send Direct Message — Request (multipart/form-data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recipientId` | string | ✅* | Target user's MongoDB ObjectId |
| `content` | string | ✅* | Message text |
| `conversationId` | string | ❌ | Existing conversation ID (optional) |
| `file` | File | ❌ | Image or video attachment |

*Either `content` or `file` must be provided.*

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
| `bio` | String | Max 500 characters |
| `phone` | String | Sparse (unique but nullable) |

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

### FriendRequest
| Field | Type | Notes |
|-------|------|-------|
| `from` | ObjectId (ref: User) | Sender |
| `to` | ObjectId (ref: User) | Recipient |
| `status` | String | `"pending"` \| `"accepted"` \| `"declined"` |

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
| `mediaType` | String | `"image"` \| `"video"` |
| `mediaPublicId` | String | Cloudinary public ID |
| `type` | String | `"user"` \| `"system"` |
| `reactions` | Array | `[{ userId, emoji }]` |
| `isRevoked` | Boolean | Default: `false` |
| `revokedAt` | Date | Set when message is revoked |

*Compound index on `{ conversationId, createdAt: -1 }` for efficient cursor-based pagination.*

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
| **Group membership** | `checkGroupMembership` middleware validates before group operations |
| **Friendship check** | `checkFriendship` middleware prevents messaging non-friends |

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

## 🧩 State Management

The app uses **Zustand** with selective persistence via `localStorage`:

| Store | Persisted | Description |
|-------|-----------|-------------|
| `useAuthStore` | `user` only | Auth state, token management, sign-in/out actions |
| `useChatStore` | `conversations` only | Conversation list, messages, real-time updates |
| `useFriendStore` | ❌ | Friends, requests, suggestions |
| `useSocketStore` | ❌ | Socket.IO connection lifecycle |
| `useThemeStore` | `isDark` | Dark/Light mode preference |
| `useUserStore` | ❌ | Profile update actions |

> Access tokens are stored **only in memory** (Zustand store, not persisted to `localStorage`) for security. On page refresh, the `ProtectedRoute` component automatically attempts a silent token refresh using the `httpOnly` refresh token cookie.

---

## 📝 Validation Rules

Frontend (Zod) and Backend (controller) are kept in sync:

| Field | Rule | Frontend Message | Backend Message |
|-------|------|-----------------|-----------------|
| `username` | min 3 chars | "Tên đăng nhập phải có ít nhất 3 ký tự" | Same |
| `password` | min 8 chars | "Mật khẩu phải có ít nhất 8 ký tự" | Same |
| `email` | valid format | "Email không hợp lệ" | Same (regex) |
| `firstName` | min 1 char | "Tên bắt buộc phải có" | Same |
| `lastName` | min 1 char | "Họ bắt buộc phải có" | Same |

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