# 💻 NewJourney Frontend

This is the frontend client for **NewJourney**, a modern, real-time full-stack chat application. Built with **React 19**, **TypeScript**, **Vite 8**, **TailwindCSS 4**, and **Zustand 5**.

For the complete project overview and backend documentation, please refer to the [Root README](file:///d:/newJourney/README.md).

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env.development` file in this directory:
   ```env
   VITE_API_URL=http://localhost:5001/api
   VITE_SOCKET_URL=http://localhost:5001
   ```

4. Start the local development server:
   ```bash
   npm run dev
   ```
   The application will be available at [http://localhost:5173](http://localhost:5173).

5. Build for production:
   ```bash
   npm run build
   ```

---

## ✨ Core Frontend Features

### 📸 Instagram-style Stories (Khoảnh khắc)
- **Story Tray**: Located at the top of the chat panel, displaying active stories from friends with indicator rings for unread stories.
- **Interactive Story Viewer**:
  - Auto-playing story slides with 5-second progress bars.
  - Manual navigation (left/right clicking or tapping).
  - Pause on mouse hold or long touch.
  - Real-time view count and viewers list.

### 🎙️ Voice Messages (Tin nhắn thoại)
- In-chat voice recording and playback.
- Custom **AudioPlayer** component displaying duration, playback progress, and play/pause controls.

### 🔔 Real-time Notification Center
- Dropdown notification bell in the header displaying unread notification counts.
- Real-time updates via Socket.IO for friend requests, group invites, and mentions.
- Inline actions: Mark as read, accept/decline friend requests, or delete notifications directly from the dropdown.

### 📱 Progressive Web App (PWA)
- Installable on Desktop and Mobile devices.
- Native-like touch gestures, standalone window mode, and custom install prompt banner (`PwaInstallPrompt`).

---

## 🛠️ Technology Stack & Libraries

- **React 19** & **TypeScript**: Component-based UI development with strict type-safety.
- **Vite 8**: Next-generation frontend tooling for fast hot module replacement (HMR) and builds.
- **Zustand 5**: Light, fast, and opinionated state management (with selective `localStorage` persistence).
- **TailwindCSS 4** & **shadcn/ui**: Modern styling and accessible, customizable components.
- **Socket.IO Client**: Real-time WebSocket connection for instant message delivery and status updates.
- **Axios**: HTTP client with request/response interceptors for silent token refreshing.
- **React Router DOM 7**: Client-side declarative routing with route guarding.
- **React Hook Form** & **Zod**: Form state management and schema validation.
- **Sonner**: Sleek toast notifications.

---

## 📁 Key Directory Structure

```
frontend/
├── public/                 # Static assets (logos, placeholders)
├── src/
│   ├── components/
│   │   ├── auth/           # Login, registration, and route guards
│   │   ├── chat/           # Chat window, sidebar, and AudioPlayer
│   │   ├── story/          # StoryTray and StoryViewer components
│   │   ├── notification/   # NotificationBell component
│   │   └── ui/             # shadcn/ui base components & PwaInstallPrompt
│   ├── hooks/              # Custom React hooks
│   ├── lib/
│   │   ├── axios.ts        # Axios configuration + JWT refresh interceptors
│   │   └── utils.ts        # Shared helper functions
│   ├── pages/              # Main application pages (SignIn, SignUp, ChatApp)
│   ├── stores/             # Zustand state stores
│   │   ├── useAuthStore.ts
│   │   ├── useChatStore.ts
│   │   ├── useFriendStore.ts
│   │   ├── useNotificationStore.ts
│   │   ├── useStoryStore.ts
│   │   └── useSocketStore.ts
│   ├── types/              # TypeScript type declarations
│   ├── App.tsx             # Root component and router
│   ├── main.tsx            # React entry point
│   └── index.css           # Global styles & Tailwind directives
├── vite.config.ts          # Vite configuration
└── package.json
```

---

## 🔒 Security Practices

1. **In-Memory Access Tokens**: JWT access tokens are stored strictly in-memory (inside the Zustand store) to protect against XSS attacks.
2. **HttpOnly Cookies**: Refresh tokens are stored in `httpOnly`, `Secure`, and `SameSite=Strict` cookies, completely inaccessible to client-side JavaScript.
3. **Silent Refresh Interceptor**: An Axios response interceptor intercepts `403 Forbidden` responses (due to expired access tokens) and automatically requests a new access token via `/auth/refresh` before retrying the failed request transparently.
