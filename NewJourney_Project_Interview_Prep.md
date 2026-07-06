# Hướng dẫn mô tả dự án **NewJourney** khi đi phỏng vấn

Tài liệu này được biên soạn chi tiết nhằm giúp bạn chuẩn bị tốt nhất cho buổi phỏng vấn ngày mai. Dự án **NewJourney** của bạn là một ứng dụng Full-stack Social Network (lấy cảm hứng từ Facebook & Instagram) rất chất lượng với nhiều giải pháp kỹ thuật thực tế và tối ưu.

---

## 📌 1. Giới thiệu tổng quan (Elevator Pitch - 1 phút)
> *"Dự án gần đây nhất em phát triển là **NewJourney**, một ứng dụng mạng xã hội full-stack kết hợp những trải nghiệm tốt nhất từ Facebook và Instagram. Ứng dụng hỗ trợ bảng tin cá nhân hóa (News Feed), đăng bài viết đa phương tiện, tính năng Khoảnh khắc (Stories) tự động biến mất sau 24h, hệ thống theo dõi (Follow) và nhắn tin thời gian thực (Real-time Chat) cả cá nhân lẫn nhóm."*

---

## 🛠️ 2. Chi tiết về Tech Stack & Lý do lựa chọn

Trong buổi phỏng vấn, nhà tuyển dụng rất thích nghe **lý do tại sao bạn chọn công nghệ này** thay vì chỉ liệt kê chúng.

### Frontend
*   **React 19 & TypeScript**:
    *   *Lý do*: Tận dụng khả năng render UI dạng thành phần (Component-based), tối ưu hóa hiệu năng và quản lý kiểu dữ liệu chặt chẽ từ TypeScript giúp hạn chế tối đa lỗi runtime trong quá trình phát triển.
*   **Vite**:
    *   *Lý do*: Build tool thế hệ mới thay thế CRA (Create React App), mang lại tốc độ khởi chạy server dev và hot reload (HMR) cực nhanh, tối ưu hóa quá trình làm việc (DX - Developer Experience).
*   **Zustand 5**:
    *   *Lý do*: Lựa chọn thay thế gọn nhẹ cho Redux Toolkit. Zustand quản lý state toàn cục bằng các hook đơn giản, giảm thiểu boilerplate code (không cần nhiều file action/reducer phức tạp) và tối ưu hóa việc re-render nhờ cơ chế selector. Bạn chia nhỏ thành nhiều store độc lập (`useAuthStore`, `useChatStore`, `useNotificationStore`...) để dễ quản lý.
*   **TailwindCSS 4 & shadcn/ui**:
    *   *Lý do*: Xây dựng giao diện nhanh chóng với Tailwind utility classes, kết hợp bộ thư viện component có sẵn, dễ tiếp cận và tùy biến của shadcn/ui.
*   **Axios (với Interceptors)**:
    *   *Lý do*: Cung cấp cơ chế can thiệp trước khi gửi request (Request Interceptor) và sau khi nhận phản hồi (Response Interceptor) để xử lý tự động đính kèm token hoặc làm mới token (Silent Token Refresh).

### Backend & Database
*   **Node.js & Express 5**:
    *   *Lý do*: Express 5 xử lý routing nhanh chóng, hỗ trợ bất đồng bộ (async/await) tốt hơn các phiên bản cũ và chạy trên runtime Node.js non-blocking I/O hiệu năng cao.
*   **Socket.IO**:
    *   *Lý do*: Hỗ trợ truyền tải dữ liệu hai chiều thời gian thực (bi-directional real-time communication) một cách đáng tin cậy. Socket.IO có cơ chế tự động kết nối lại (auto-reconnect) và fallback sang HTTP long-polling nếu WebSockets bị chặn.
*   **MongoDB Atlas & Mongoose 9.3**:
    *   *Lý do*: Cơ sở dữ liệu NoSQL dạng Document rất phù hợp cho cấu trúc dữ liệu có độ linh hoạt cao của mạng xã hội (ví dụ: các bài viết có định dạng media khác nhau hoặc cấu trúc bình luận lồng nhau). Mongoose hỗ trợ định nghĩa schema rõ ràng và cung cấp các middleware hook mạnh mẽ.
*   **Cloudinary CDN**:
    *   *Lý do*: Lưu trữ tập tin đa phương tiện (avatar, ảnh bài viết, video story, file chat) và tự động tối ưu hóa dung lượng hình ảnh/video trước khi phân phối tới người dùng cuối.

---

## 🔄 3. Kiến trúc hệ thống & Các luồng xử lý chính (Core Flows)

Đây là phần ghi điểm cực mạnh nếu bạn vẽ hoặc giải thích được mạch lạc cách các luồng dữ liệu chạy.

### A. Luồng Đăng nhập & Bảo mật (JWT Hybrid Session Flow)
Để đảm bảo an toàn tối đa trước các lỗ hổng bảo mật phổ biến như XSS (Cross-Site Scripting) và CSRF (Cross-Site Request Forgery), bạn đã thiết kế hệ thống xác thực kết hợp:

```
[Đăng nhập] ──► POST /api/auth/signin
                     │
         ┌───────────▼───────────┐
         │ Kiểm tra thông tin    │
         │ Tạo Access Token      │
         │ Tạo Refresh Token     │
         │ Lưu Session ở DB      │
         └───────────┬───────────┘
                     │
       ┌─────────────┴─────────────┐
       ▼                           ▼
Access Token (JWT)          Refresh Token (Crypto string)
- Trả về JSON Body          - Trả về qua httpOnly Cookie
- Lưu trong memory          - Không cho phép JavaScript đọc
- Hạn dùng ngắn (30m)        - Hạn dùng dài (14 ngày)
```

1.  **Silent Refresh Token Flow**:
    *   Khi **Access Token** hết hạn (Server trả về mã lỗi `403`), **Axios Response Interceptor** trên Frontend sẽ tự động can thiệp.
    *   Nó sẽ tạm dừng các API request khác và thực hiện một request ngầm gửi lên `/api/auth/refresh` (cookie Refresh Token tự động đính kèm nhờ cấu hình `withCredentials: true`).
    *   Nếu Refresh Token hợp lệ và khớp với bản ghi trong collection `Session` của MongoDB, Backend trả về Access Token mới.
    *   Frontend cập nhật Access Token vào Zustand store và tự động **gửi lại các request cũ bị lỗi ban đầu** tối đa 4 lần mà người dùng không hề nhận ra sự gián đoạn nào (Zero UX interruption).
2.  **Stateful Session Management**:
    *   Refresh Token được quản lý qua một bảng `Session` trong Database. Khi người dùng bấm đăng xuất (Sign out), server sẽ xóa document Session tương ứng.
    *   Điều này giúp khắc phục nhược điểm lớn nhất của JWT thông thường là **không thể thu hồi token trước hạn** (token revocation).

### B. Luồng Real-time Communication (Socket.IO)
1.  **Xác thực WebSocket**: Bạn không kết nối socket vô điều kiện. Bạn viết một middleware `socketAuthMiddleware` ở Backend. Khi client khởi tạo kết nối socket, nó truyền JWT Access Token qua tham số `auth.token`. Server giải mã và xác thực token này trước khi cho phép kết nối.
2.  **Cơ chế Phân phòng (Rooms)**:
    *   **Room Hội thoại**: Khi user đăng nhập thành công, socket server tự động lấy danh sách các Conversation mà user đó tham gia và cho socket của họ join vào các Room tương ứng (ID của cuộc trò chuyện). Khi gửi tin nhắn mới, client chỉ cần emit và server gửi tin nhắn đến đúng Room đó thông qua `socket.to(conversationId).emit()`.
    *   **Room Cá nhân**: Mỗi user cũng join vào một Room có tên là chính `userId` của họ. Đây là kênh riêng tư để server gửi trực tiếp các thông báo hệ thống như: có lượt thích mới, bình luận mới hay yêu cầu kết bạn mà không làm ảnh hưởng đến các người dùng khác.
3.  **Trạng thái hoạt động (Online/Offline)**:
    *   Khi kết nối socket mở ra, server lưu cặp khóa `userId -> socketId` vào một `Map` toàn cục (`onlineUsers`) và phát sự kiện `online-users` đến toàn bộ client.
    *   Khi người dùng ngắt kết nối (disconnect), socket ID tương ứng bị xóa khỏi `Map`, và server phát lại sự kiện để cập nhật trạng thái chấm xanh trên UI.
4.  **Chỉ báo gõ phím (Typing Indicator)**:
    *   Sử dụng sự kiện `typing` và `stop-typing` truyền qua Room cuộc hội thoại để cập nhật trạng thái *"Phúc đang nhập tin nhắn..."* theo thời gian thực.

---

## 🌟 4. Các tính năng nổi bật & Giải pháp kỹ thuật ấn tượng

Khi nhà tuyển dụng hỏi: *"Trong dự án này, em tự hào nhất về tính năng nào hoặc có khó khăn kỹ thuật nào em đã giải quyết?"*, hãy chọn 1 trong 3 giải pháp sau:

### 1. Tính năng Stories (Khoảnh khắc) tự hủy sau 24 giờ
*   **Vấn đề**: Thông thường, để xóa các câu chuyện sau 24h, lập trình viên hay nghĩ đến việc viết một cron-job chạy ngầm mỗi giờ quét database và xóa bản ghi cũ. Điều này gây tốn tài nguyên server và độ trễ cao.
*   **Giải pháp**: Bạn đã sử dụng tính năng **Native TTL (Time-To-Live) Index** của MongoDB.
    *   Trong schema `Story`, trường `createdAt` được cấu hình thuộc tính `expires: 86400` (24 giờ tính bằng giây).
    *   MongoDB tự động quản lý một luồng ngầm có độ ưu tiên thấp để tự động tìm kiếm và xóa vĩnh viễn các document câu chuyện đã quá hạn. Điều này giúp tối ưu hóa hiệu năng ghi/đọc của database và giữ dung lượng lưu trữ luôn gọn nhẹ.
*   **UX ấn tượng**: Thiết kế Story Viewer tự động chạy sau 5s, có thanh tiến trình (progress bar), hỗ trợ dừng (smart pause) khi người dùng click/giữ chuột hoặc tập trung gõ phản hồi tin nhắn trực tiếp qua story.

### 2. Tối ưu hóa truy vấn Bình luận lồng nhau (Nested Comments - Giải quyết N+1 Query)
*   **Vấn đề**: Hiển thị bình luận dạng cây (bình luận cha và các phản hồi con). Nếu thực hiện truy vấn đệ quy hoặc query DB cho mỗi bình luận cha để tìm bình luận con, hệ thống sẽ gặp lỗi **N+1 Query** nghiêm trọng, làm chậm phản hồi API khi bài viết có nhiều bình luận.
*   **Giải pháp**:
    *   Cấu hình Schema sử dụng mô hình danh sách kề (Adjacency List): Mỗi comment lưu một trường `parentId` trỏ về comment cha.
    *   Đánh chỉ mục (Index) hiệu quả trên `{ postId: 1, createdAt: 1 }` và chỉ mục trên `parentId`.
    *   **Kỹ thuật lấy dữ liệu**:
        1.  Query 1: Lấy tất cả các comment cấp 1 (top-level) có `parentId: null` của bài viết đó.
        2.  Thu thập danh sách ID của các comment cấp 1 này.
        3.  Query 2: Chỉ chạy **một truy vấn duy nhất** sử dụng toán tử `$in` để lấy tất cả các comment phản hồi (replies) có `parentId` nằm trong danh sách ID vừa thu thập.
        4.  Ánh xạ (mapping) và nhóm các replies này vào comment cha tương ứng trực tiếp trong bộ nhớ (In-memory mapping) trước khi trả về client.
    *   *Kết quả*: Chỉ tốn **đúng 2 câu truy vấn database** để render toàn bộ cây bình luận hai cấp độ, cải thiện tốc độ tải trang Feed và Post Detail đáng kể.

### 3. Tối ưu hóa các truy vấn đồng thời (Parallel Query Optimization)
*   Tại trang cá nhân, khi cần lấy các thông số xã hội (Social Stats) bao gồm: số bài viết, số người theo dõi, số người đang theo dõi và trạng thái theo dõi hiện tại của người dùng xem trang.
*   **Giải pháp**: Thay vì dùng chuỗi các câu lệnh `await` tuần tự gây chặn luồng (blocking) và kéo dài thời gian phản hồi:
    ```javascript
    // Không nên:
    const posts = await Post.count(...);
    const followers = await Follow.count(...);
    ```
    Bạn sử dụng **`Promise.all`** để kích hoạt đồng thời cả 4 truy vấn này chạy song song:
    ```javascript
    const [postCount, followersCount, followingCount, isFollowing] = await Promise.all([
        Post.countDocuments({ userId: user._id }),
        Follow.countDocuments({ followingId: user._id }),
        Follow.countDocuments({ followerId: user._id }),
        Follow.findOne({ followerId: currentUserId, followingId: user._id })
    ]);
    ```
    Cơ chế này tận dụng khả năng xử lý bất đồng bộ của Node.js Event Loop và cơ chế truy vấn đồng thời của MongoDB Atlas, giảm 70% tổng thời gian phản hồi của API này.

### 4. Xử lý độ trễ khởi động của Cloud Hosting Free Tier (Render Sleep Mode)
*   **Vấn đề**: Do triển khai hệ thống trên Render Free Tier, server backend sẽ tự động đi ngủ (spin down) sau 15 phút không có lưu lượng truy cập. Khi có người dùng truy cập lại, server mất từ 30s đến 1 phút để khởi động lại (cold start). Điều này dẫn tới việc client gửi request và nhận lỗi timeout hoặc màn hình trắng không phản hồi, tạo trải nghiệm người dùng rất tệ.
*   **Giải pháp**:
    *   Thiết kế một API endpoint gọn nhẹ `/api/health` chuyên dụng để kiểm tra trạng thái hoạt động của server.
    *   Tại `App.tsx` của Frontend, khi ứng dụng vừa load, hệ thống sẽ chạy một cơ chế **Polling với khoảng thời gian 3 giây** ngầm ping lên endpoint `/api/health`.
    *   Đồng thời hiển thị một màn hình chờ chuyên nghiệp được thiết kế tỉ mỉ ("Đang khởi động server... Server đang thức dậy, vui lòng đợi vài giây ☕") với các hiệu ứng shimmer động, tạo cảm giác dễ chịu cho người dùng.
    *   Khi Backend thức dậy thành công và trả lời với status `200 OK`, ứng dụng sẽ tự động chuyển trạng thái `serverReady` thành `true`, mở khóa giao diện đăng nhập/bảng tin.

---

## 🎯 5. Cách cấu trúc câu trả lời theo STAR Method (Ví dụ thực tế)

Khi phỏng vấn, hãy trả lời theo cấu trúc **STAR** (Situation - Tình huống, Task - Nhiệm vụ, Action - Hành động, Result - Kết quả) để tăng tính thuyết phục:

*   **S (Situation)**: *"Khi phát triển tính năng nhắn tin thời gian thực cho ứng dụng NewJourney..."*
*   **T (Task)**: *"...em cần giải quyết vấn đề xác thực bảo mật cho kết nối WebSocket và đảm bảo tin nhắn được truyền đi nhanh chóng, đúng người nhận, cũng như quản lý được trạng thái online/offline của bạn bè."*
*   **A (Action)**: *"Em đã thiết kế một middleware xác thực sử dụng JWT Access Token được truyền qua cổng bắt tay (handshake) của Socket.IO trước khi kết nối được duyệt. Trên server, em tổ chức quản lý danh sách client online bằng cấu trúc dữ liệu `Map` và chia phòng (Rooms) theo ID cuộc trò chuyện. Em cũng áp dụng các sự kiện `typing`/`stop-typing` để hiển thị trạng thái đang soạn tin nhắn."*
*   **R (Result)**: *"Kết quả là tính năng nhắn tin chạy thời gian thực rất mượt mà, thời gian trễ dưới 100ms. Kết nối socket hoàn toàn được bảo mật, ngăn chặn các truy cập trái phép vào phòng chat, và giao diện người dùng luôn hiển thị chính xác danh sách bạn bè đang trực tuyến."*

---

## 💡 6. Bộ câu hỏi phỏng vấn chuyên sâu & Hướng dẫn trả lời chi tiết

Dưới đây là ngân hàng câu hỏi phỏng vấn được chia theo các chủ đề chính, bám sát kiến trúc thực tế của **NewJourney** để giúp bạn trả lời trôi chảy, chứng tỏ tư duy của một kỹ sư có kinh nghiệm.

---

### 🔒 CHỦ ĐỀ 1: XÁC THỰC & BẢO MẬT (Authentication & Security)

#### Q1: Tại sao em lại chọn lưu Access Token trong memory (Zustand state) thay vì LocalStorage?
*   **Câu trả lời chuẩn**:
    > *"Nếu lưu Access Token ở `LocalStorage` hoặc `SessionStorage`, ứng dụng sẽ dễ bị tấn công qua lỗ hổng **XSS (Cross-Site Scripting)**. Khi hacker chèn được một đoạn mã độc Javascript vào trang (qua bình luận, bio của user khác...), đoạn mã đó có thể dễ dàng gọi `localStorage.getItem('token')` và gửi về server của hacker.
    >
    > Để ngăn chặn điều này, em chọn lưu Access Token trong **Memory (Zustand store)**. Khi lưu trong bộ nhớ Javascript, không có cách nào từ bên ngoài truy cập được trực tiếp giá trị của nó. Hạn chế của cách này là khi người dùng nhấn F5 refresh trang, bộ nhớ RAM bị xóa và token sẽ mất. Khi đó, em sử dụng cơ chế **Silent Token Refresh** gọi ngầm lên Backend để lấy lại Access Token mới bằng Refresh Token lưu trong `httpOnly` cookie."*

#### Q2: Cơ chế Silent Token Refresh của em hoạt động thế nào để tránh tình trạng "Request Race Condition" khi Token hết hạn?
*   **Câu trả lời chuẩn**:
    > *"Trong Axios instance (`axios.ts`), em sử dụng `api.interceptors.response.use` để bắt các response lỗi. Khi Access Token hết hạn, server trả về mã lỗi `403`. 
    >
    > Điểm mấu chốt cần xử lý ở đây là **Tránh gửi trùng lặp nhiều request refresh cùng một lúc** nếu trên trang đang chạy đồng thời nhiều API. 
    >
    > Ở dự án này, em thiết lập một biến cờ hiệu `isRefreshing` và một hàng đợi các request bị lỗi `failedQueue`. Khi request đầu tiên phát hiện lỗi `403`, nó sẽ gán `isRefreshing = true` và bắt đầu gọi API `/auth/refresh` bằng Refresh Token lưu trong cookie. Các request lỗi tiếp theo phát sinh trong khoảng thời gian này sẽ không gọi refresh nữa, mà được đưa vào một mảng hàng đợi `failedQueue` dưới dạng các Promise chờ đợi. 
    >
    > Khi API `/auth/refresh` trả về Access Token mới thành công, em cập nhật token mới vào Zustand store, thực hiện resolve toàn bộ các request đang chờ trong `failedQueue` với token mới này, sau đó reset lại cờ `isRefreshing` về `false` và xóa sạch hàng đợi. Nếu quá trình refresh thất bại, toàn bộ hàng đợi bị reject và hệ thống tự động gọi hàm đăng xuất xóa sạch state."*

#### Q3: Tại sao em không dùng JWT cho cả Refresh Token mà lại tạo một chuỗi ngẫu nhiên lưu vào Database (Stateful Session)?
*   **Câu trả lời chuẩn**:
    > *"Bản chất của JWT là **stateless** (không trạng thái) - một khi đã phát hành, token đó sẽ có hiệu lực cho đến khi hết hạn và server không thể chủ động thu hồi nó một cách dễ dàng trừ khi dùng danh sách đen (Blacklist) lưu trong Redis.
    >
    > Với Refresh Token có thời hạn dài (14 ngày), nếu nó là JWT stateless và hacker vô tình lấy được, họ có thể liên tục lấy Access Token mới mà ta không có cách nào ngăn chặn được từ phía máy chủ. 
    >
    > Vì vậy, em thiết kế hệ thống theo mô hình **Hybrid (Lai)**: Access Token là JWT stateless để truy cập tài nguyên cực nhanh không cần truy vấn database, còn Refresh Token là một chuỗi ký tự ngẫu nhiên, an toàn cao, được lưu trữ có trạng thái (**Stateful**) trong collection `Session` ở MongoDB. Khi người dùng bấm 'Đăng xuất' hoặc đổi mật khẩu, server chỉ cần chạy lệnh `deleteOne` xóa record Session tương ứng trong DB và xóa cookie. Kể từ lúc đó, Refresh Token đó chính thức bị vô hiệu hóa, mang lại khả năng quản lý phiên làm việc tối ưu và an toàn tuyệt đối."*

#### Q4: Em thiết lập các thuộc tính bảo mật nào cho Refresh Token Cookie?
*   **Câu trả lời chuẩn**:
    > *"Ở phía backend (`authController.js`), khi ghi Refresh Token vào Cookie, em cấu hình các cờ bảo mật nghiêm ngặt:
    > 1.  `httpOnly: true`: Ngăn chặn hoàn toàn việc script phía client (Javascript) đọc cookie này, chống tấn công XSS.
    > 2.  `secure: process.env.NODE_ENV === 'production'`: Chỉ cho phép gửi cookie qua giao thức HTTPS đã được mã hóa ở môi trường production.
    > 3.  `sameSite: 'lax'` (ở local) hoặc `'none'` (ở production có cấu hình CORS): Giúp hạn chế tối đa nguy cơ bị tấn công **CSRF (Cross-Site Request Forgery)** bằng cách ngăn cookie tự động đính kèm vào các cross-site requests bất hợp pháp."*

---

### 🗄️ CHỦ ĐỀ 2: TỐI ƯU HÓA DATABASE (Database & Query Optimization)

#### Q1: Làm thế nào em giải quyết vấn đề N+1 Query khi lấy danh sách Bình luận lồng nhau (Nested Comments)?
*   **Câu trả lời chuẩn**:
    > *"Khi một bài viết có nhiều bình luận (cha) và mỗi bình luận lại có nhiều phản hồi (replies/con), nếu em dùng vòng lặp để truy vấn các bình luận con cho từng bình luận cha trong database, số lượng câu truy vấn gửi tới DB sẽ tăng theo cấp số nhân (gọi là lỗi N+1 Query).
    >
    > Để tối ưu hóa, trong `postController.js` ở hàm `getPostComments`, em thực hiện giải pháp **In-memory Mapping** qua đúng 2 câu truy vấn duy nhất:
    > 1.  **Truy vấn 1**: Lấy toàn bộ các bình luận gốc có `parentId: null` của bài viết đó.
    > 2.  **Truy vấn 2**: Gom tất cả các ID của bình luận gốc vừa lấy được thành một mảng `commentIds`. Sau đó thực hiện truy vấn các bình luận con có trường `parentId` nằm trong mảng `commentIds` này bằng toán tử `$in` của MongoDB.
    > 3.  **Xử lý ở RAM**: Sau khi có dữ liệu từ 2 câu truy vấn trên, em dùng Javascript để duyệt qua và ánh xạ các bình luận con vào mảng `replies` của bình luận cha tương ứng rồi trả về Client. 
    > 
    > Cách này giúp số lượng câu truy vấn luôn cố định là **2** bất kể bài viết có bao nhiêu trăm bình luận đi chăng nữa, giảm tải đáng kể cho database."*

#### Q2: Em đã đánh chỉ mục (Index) như thế nào trong MongoDB để tối ưu tốc độ tìm kiếm?
*   **Câu trả lời chuẩn**:
    > *"Em đã phân tích kỹ hành vi đọc dữ liệu của ứng dụng để thiết lập các Index phù hợp trong Mongoose:
    > 1.  **Single Index**: Trên trường `username` và `email` của bảng `User` được thiết lập chỉ mục `unique` để tăng tốc độ tìm kiếm người dùng và kiểm tra trùng lặp khi đăng ký.
    > 2.  **Compound Index (Chỉ mục kép)**: Trong bảng `Follow`, em đánh chỉ mục kép `{ followerId: 1, followingId: 1 }`. Việc này tối ưu hóa cho câu truy vấn kiểm tra xem User A có đang theo dõi User B hay không, đồng thời thiết lập ràng buộc duy nhất để ngăn lỗi logic ghi lặp quan hệ theo dõi.
    > 3.  **Compound Index** trong bảng `Comment`: Em đánh chỉ mục `{ postId: 1, createdAt: 1 }` để tối ưu hóa việc lấy danh sách bình luận của bài viết được sắp xếp theo thời gian tăng dần.
    > 4.  **TTL Index (Time-To-Live)**: Trong bảng `Story` và bảng `Session`, em sử dụng chỉ mục tự hủy để database tự động dọn dẹp các dữ liệu hết hạn (24h đối với Story và theo thời hạn của Session), giúp giải phóng dung lượng đĩa tự động."*

#### Q3: Sự khác biệt giữa Offset-based Pagination và Cursor-based Pagination là gì? Em áp dụng loại nào trong dự án NewJourney?
*   **Câu trả lời chuẩn**:
    > *"Trong dự án NewJourney, ở phần lấy tin nhắn lịch sử và tin đăng trên News Feed, em ưu tiên sử dụng **Cursor-based Pagination** (dựa vào mốc thời gian `createdAt` hoặc ID của bản ghi cuối cùng của trang trước làm mốc).
    >
    > Sự khác biệt cốt lõi:
    > *   **Offset-based (`skip` và `limit`)**: Khi trang càng sâu (ví dụ cần bỏ qua 10.000 bản ghi để lấy 10 bản ghi tiếp theo), database vẫn phải quét và load qua toàn bộ 10.000 dòng trước đó rồi mới cắt lấy 10 dòng, dẫn đến hiệu năng giảm sút nghiêm trọng. Ngoài ra, trong ứng dụng real-time, nếu có bài viết mới được thêm vào đầu trang trong lúc người dùng đang cuộn, việc dùng `skip` sẽ khiến dữ liệu trang sau bị trùng lặp phần tử của trang trước.
    > *   **Cursor-based**: Database chỉ cần sử dụng index để nhảy thẳng đến bản ghi có khóa lớn hơn/nhỏ hơn giá trị Cursor (ví dụ: `createdAt < cursorTime`), sau đó lấy số lượng bản ghi chỉ định bằng `limit`. Cách này có thời gian phản hồi hằng số $O(log N)$ bất kể dữ liệu lớn thế nào và hoàn toàn không bị trùng lặp dữ liệu khi có cập nhật thời gian thực."*

#### Q4: Em tối ưu hóa việc đếm số lượng người theo dõi (Followers) và bài đăng (Posts) như thế nào để tránh quá tải database khi xem trang cá nhân?
*   **Câu trả lời chuẩn**:
    > *"Khi một người dùng xem trang cá nhân của người khác, ứng dụng cần lấy ra 4 thông tin: Số lượng bài đăng, số Followers, số người đang Follow, và trạng thái Follow hiện tại giữa hai người.
    >
    > Thay vì chạy 4 lệnh `await` tuần tự gây lãng phí thời gian chặn luồng, em đã sử dụng **`Promise.all`** trong Node.js để phát cùng lúc 4 câu truy vấn `countDocuments` và `findOne` xuống cơ sở dữ liệu MongoDB Atlas. MongoDB Atlas là hệ thống phân tán hỗ trợ thực thi truy vấn song song rất tốt. Bằng cách này, thời gian chờ phản hồi của API giảm từ tổng thời gian của 4 câu truy vấn xuống chỉ bằng thời gian của câu truy vấn chậm nhất."*

---

### 🔌 CHỦ ĐỀ 3: REAL-TIME & WEBSOCKETS (Socket.IO)

#### Q1: Làm thế nào để đảm bảo hệ thống Socket.IO được bảo mật và không bị spam kết nối từ người dùng chưa đăng nhập?
*   **Câu trả lời chuẩn**:
    > *"Em sử dụng cơ chế **Socket Middleware** xác thực ở Backend (`socketMiddleware.js`). Khi client kết nối Socket, họ bắt buộc phải truyền JWT Access Token thông qua cấu hình `auth: { token: '...' }` ở client-side.
    >
    > Server trước khi chấp nhận kết nối (connection) sẽ chạy qua hàm middleware này để giải mã JWT bằng secret key. Nếu token không hợp lệ, đã hết hạn hoặc user không tồn tại trong DB, server sẽ từ chối kết nối ngay lập tức bằng cách gọi `next(new Error("Unauthorized"))`. Thiết lập này giúp bảo vệ server khỏi việc bị giả mạo socket client hoặc spam tài nguyên kết nối mở."*

#### Q2: Em quản lý danh sách người dùng Online/Offline như thế nào? Giải pháp này có ưu/nhược điểm gì?
*   **Câu trả lời chuẩn**:
    > *"Ở phía backend (`socket/index.js`), em dùng một đối tượng `onlineUsers` kiểu `Map()` lưu trữ cặp khóa-giá trị: `userId -> socketId`.
    > *   Khi một kết nối thành công, em thêm ID người dùng và ID kết nối socket của họ vào `Map`, sau đó phát sự kiện `online-users` chứa danh sách tất cả các Key (danh sách ID online) đến toàn bộ các client đang kết nối.
    > *   Khi socket ngắt kết nối (sự kiện `disconnect`), em xóa ID người dùng ra khỏi `Map` và phát lại danh sách cập nhật.
    >
    > **Ưu điểm**: Triển khai nhanh, lưu trực tiếp trên bộ nhớ RAM giúp việc tìm kiếm và đính kèm trạng thái online cực kỳ nhanh.
    > **Nhược điểm**: Giải pháp này chỉ hoạt động khi ứng dụng chạy trên **đơn máy chủ (Single Server)**. Nếu sau này dự án scale up lên nhiều server backend chạy song song sau một Load Balancer, các server khác nhau sẽ không chia sẻ được bộ nhớ `Map` này. **Hướng khắc phục**: Khi dự án phát triển lớn hơn, em sẽ thay thế `Map` trong RAM bằng việc lưu trữ danh sách online tập trung trên **Redis** (dùng cấu trúc dữ liệu Set hoặc Hash) kết hợp với **Socket.IO Redis Adapter** để đồng bộ trạng thái giữa tất cả các node server."*

#### Q3: Khi người dùng gửi tin nhắn trong nhóm chat, làm sao để phát tín hiệu đúng đến những người trong nhóm mà không bị rò rỉ dữ liệu sang nhóm khác?
*   **Câu trả lời chuẩn**:
    > *"Em tận dụng cơ chế **Rooms (Phòng)** có sẵn của Socket.IO:
    > *   Mỗi khi cuộc hội thoại (Conversation) được tạo, nó có một ID duy nhất. ID này tương đương với một Room trên socket server.
    > *   Khi user mở ứng dụng và thiết lập kết nối socket thành công, backend sẽ truy vấn tất cả các cuộc hội thoại mà user đó tham gia từ database, sau đó lặp qua danh sách ID và gọi hàm `socket.join(conversationId)` để đăng ký socket đó vào các phòng tương ứng.
    > *   Khi một thành viên gửi tin nhắn mới lên endpoint `/api/message/group` (hoặc qua socket), backend lưu tin nhắn vào DB, sau đó dùng lệnh `io.to(conversationId).emit('new-message', message)` để phát tin nhắn. Socket.IO sẽ tự động chuyển tiếp gói tin đến đúng các socket đang kết nối nằm trong Room đó, bảo mật hoàn toàn dữ liệu với các phòng khác."*

#### Q4: Em xử lý thế năng nào để đồng bộ trạng thái tin nhắn chưa đọc (Unread Count) thời gian thực?
*   **Câu trả lời chuẩn**:
    > *"Trong Schema `Conversation`, em lưu trữ một trường `unreadCounts` kiểu `Map` (ánh xạ `userId -> number`). 
    > *   Mỗi khi có tin nhắn mới được gửi vào phòng chat, backend sẽ cập nhật database, tăng trị số đếm chưa đọc của tất cả thành viên trong nhóm (trừ người gửi) lên 1 đơn vị. Đồng thời phát tin nhắn mới kèm metadata conversation cập nhật qua socket.
    > *   Khi một user nhấp chuột mở hộp thoại chat đó, frontend sẽ gửi request PATCH lên `/api/conversation/:conversationId/seen`. Tại đây backend sẽ reset `unreadCounts[userId] = 0` và emit một sự kiện `update-conversation` để báo cho các client khác hoặc chính client đó cập nhật lại số badge thông báo tin nhắn chưa đọc về số 0."*

---

### 🎨 CHỦ ĐỀ 4: QUẢN LÝ STATE & TRẢI NGHIỆM FRONTEND (React, Zustand & UX)

#### Q1: Tại sao em lại chọn Zustand thay vì Redux Toolkit cho dự án mạng xã hội này?
*   **Câu trả lời chuẩn**:
    > *"Mặc dù Redux Toolkit là thư viện quản lý state rất mạnh mẽ cho các dự án lớn, nhưng nó đi kèm rất nhiều boilerplate code (phải cấu hình store, slices, actions, thunks phức tạp).
    >
    > Với NewJourney, em chọn **Zustand** vì các lý do sau:
    > 1.  **Cực kỳ gọn nhẹ và dễ học**: Zustand sử dụng mô hình Hook của React, định nghĩa store chỉ bằng một hàm `create`.
    > 2.  **Không cần Provider**: Zustand không bao bọc ứng dụng của mình trong một React Context Provider, giúp hạn chế tối đa việc re-render toàn bộ cây component không mong muốn khi state thay đổi.
    > 3.  **Chia tách store dễ dàng**: Em dễ dàng tạo nhiều store độc lập cho từng tính năng (`useAuthStore`, `useChatStore`, `useNotificationStore`...) tương tự như cơ chế Micro-services trên frontend, giữ cho codebase sạch sẽ và dễ bảo trì."*

#### Q2: Làm thế nào em tối ưu hiệu năng để giao diện chat không bị giật lag khi danh sách tin nhắn quá dài?
*   **Câu trả lời chuẩn**:
    > *"Để tối ưu hóa giao diện chat, em áp dụng các kỹ thuật sau:
    > 1.  **Phân trang tin nhắn (Pagination)**: Em chỉ load trước 20 tin nhắn gần nhất. Khi người dùng cuộn lên trên cùng của hộp chat, em mới kích hoạt hàm load tiếp 20 tin nhắn cũ hơn từ API và nối tiếp vào state.
    > 2.  **Ghi nhớ Component (React.memo)**: Em bọc các component hiển thị tin nhắn đơn lẻ (`MessageItem`) bằng `React.memo` để tránh việc React render lại tất cả các tin nhắn cũ mỗi khi có tin nhắn mới được thêm vào cuối danh sách.
    > 3.  **Tách biệt logic nhập liệu**: Ô input gõ tin nhắn được quản lý bằng local state hoặc thư viện form độc lập để hành động gõ phím liên tục của người dùng không kích hoạt re-render toàn bộ danh sách tin nhắn hiển thị."*

#### Q3: Khi bấm vào thông báo (Notification) của một lượt Thích bài viết, hệ thống của em xử lý thế nào để tối ưu trải nghiệm người dùng?
*   **Câu trả lời chuẩn**:
    > *"Ở đây em thiết kế trải nghiệm điều hướng thông minh (Smart Navigation):
    > *   Khi người dùng click vào thông báo của một Post Like hoặc Post Comment, hệ thống kiểm tra route hiện tại. Nếu người dùng đang ở trang khác, ứng dụng dùng React Router điều hướng họ đến trang chi tiết bài viết `/post/:postId`.
    > *   Nếu người dùng **đã và đang đứng sẵn ở trang chi tiết của chính bài viết đó**, thay vì bắt trình duyệt reload lại toàn bộ trang gây nhấp nháy màn hình và tốn băng thông, em kích hoạt một **silent data refresh** (chỉ gọi API fetch lại thông tin của riêng bài viết đó ngầm và cập nhật state của bài viết), giúp số lượng like và comment hiển thị thay đổi ngay lập tức một cách mượt mà."*

---

### 🎙️ CHỦ ĐỀ 5: XỬ LÝ MEDIA & LỖI HỆ THỐNG (Media, Cloudinary & System Design)

#### Q1: Em xử lý việc tải lên nhiều ảnh (tối đa 10 ảnh cho bài viết) hoặc video lên Cloudinary như thế nào để không bị nghẽn server Node.js?
*   **Câu trả lời chuẩn**:
    > *"Tại backend (`postController.js`), em sử dụng middleware **Multer** cấu hình `memoryStorage`. Tức là dữ liệu file tải lên sẽ được giữ tạm thời trong bộ đệm RAM dưới dạng Buffer thay vì ghi tạm xuống ổ cứng server, giúp tốc độ đọc ghi nhanh hơn và tránh làm rác ổ đĩa server.
    >
    > Để xử lý upload nhiều file lên Cloudinary mà không bị nghẽn (blocking) luồng xử lý đơn nhân của Node.js, em gom toàn bộ quá trình upload của từng file thành các Promise và thực thi chúng song song bằng **`Promise.all`**. 
    >
    > Khi tất cả các file được tải lên Cloudinary thành công và trả về URL CDN cùng Public ID, em mới tiến hành lưu thông tin bài viết vào MongoDB. Em cũng cài đặt giới hạn dung lượng upload tối đa là 10MB cho mỗi file và kiểm tra định dạng file (chỉ cho phép các MIME type dạng hình ảnh/video hợp lệ) ở tầng middleware để bảo vệ hệ thống."*

#### Q2: Tính năng tin nhắn thoại (Audio Message) hoạt động như thế nào trong dự án của em?
*   **Câu trả lời chuẩn**:
    > *"Quy trình xử lý âm thanh ghi âm hoạt động qua các bước:
    > 1.  **Frontend**: Em sử dụng HTML5 **MediaRecorder API** để ghi âm trực tiếp giọng nói từ micro của người dùng, nén dữ liệu dưới dạng các khối âm thanh (blobs) định dạng `audio/webm` hoặc `audio/ogg`.
    > 2.  **Tải lên**: Khối blob âm thanh được đóng gói vào đối tượng `FormData` và gửi lên API chat của Backend.
    > 3.  **Backend**: Nhận file audio qua Multer, đẩy lên Cloudinary với tài nguyên dạng `video` hoặc `raw`. Cloudinary tự động chuyển đổi định dạng tương thích và trả về URL file nhạc đã tối ưu.
    > 4.  **Phát lại**: Ở Frontend, em thiết kế một component **AudioPlayer** tự tạo. Component này sử dụng đối tượng `Audio` của Javascript để phát nhạc từ URL CDN, hiển thị thanh tiến trình tùy biến, nút play/pause và thời lượng ghi âm."*

#### Q3: Gặp sự cố kết nối Internet (mất mạng) ở phía client, làm sao ứng dụng của em phát hiện và phục hồi kết nối mượt mà?
*   **Câu trả lời chuẩn**:
    > *"Em kết hợp giữa sự kiện hệ thống trình duyệt và tính năng tự phục hồi của Socket.IO:
    > 1.  Em lắng nghe sự kiện `online` và `offline` của đối tượng `window` để hiển thị một thông báo Toast (bằng thư viện `sonner`) nhắc nhở người dùng: *"Kết nối internet bị gián đoạn, tin nhắn gửi đi có thể bị chậm"*.
    > 2.  Ở tầng Socket.IO Client, cấu hình mặc định có cơ chế tự động kết nối lại (auto-reconnect) sau một khoảng thời gian chờ tăng dần (exponential backoff). Khi phát hiện sự kiện `reconnect`, frontend sẽ tự động gọi lại hàm `connectSocket` để thiết lập lại bắt tay JWT và tự động join lại các Room hội thoại cũ để đảm bảo không bị bỏ sót các tin nhắn được gửi trong thời gian mất kết nối."*

---

### 📱 CHỦ ĐỀ 6: PWAs & TRẢI NGHIỆM DI ĐỘNG (PWAs & Mobile Integration)

#### Q1: Tại sao em lại cấu hình NewJourney dưới dạng PWA (Progressive Web App)? Trải nghiệm này mang lại lợi ích gì cho người dùng di động?
*   **Câu trả lời chuẩn**:
    > *"Biến ứng dụng thành PWA giúp mang lại trải nghiệm tương đương một ứng dụng di động bản địa (Native App) mà không đòi hỏi người dùng phải tải về thông qua các chợ ứng dụng như App Store hay Google Play. 
    > 
    > Người dùng có thể dễ dàng bấm nút 'Cài đặt' trực tiếp từ trình duyệt để tạo biểu tượng ứng dụng trên màn hình chính (Home Screen). Khi khởi chạy dưới dạng PWA, ứng dụng sẽ mở ra trong một cửa sổ riêng tư không có thanh địa chỉ trình duyệt (standalone mode), kết hợp với giao diện responsive và thanh Bottom Navigation tối ưu cho trải nghiệm vuốt chạm trên thiết bị di động."*

#### Q2: Em xử lý thế nào để hiển thị nút gợi ý cài đặt ứng dụng (PWA Install Prompt) tự thiết kế thay vì dùng banner mặc định của trình duyệt?
*   **Câu trả lời chuẩn**:
    > *"Để chủ động kiểm soát trải nghiệm người dùng, trong component `PwaInstallPrompt.tsx`, em viết logic để tự hiển thị banner cài đặt:
    > 1.  Lắng nghe sự kiện hệ thống `beforeinstallprompt` của trình duyệt. Sự kiện này được kích hoạt khi trình duyệt kiểm tra thấy ứng dụng có file manifest và Service Worker hợp lệ.
    > 2.  Khi sự kiện nổ ra, em gọi `e.preventDefault()` để chặn không cho trình duyệt tự động hiện banner cài đặt thô sơ của nó.
    > 3.  Em lưu đối tượng sự kiện đó vào một state cục bộ và hiển thị một banner/nút bấm tùy chỉnh với style đồng bộ với thiết kế của ứng dụng.
    > 4.  Khi người dùng click vào nút 'Cài đặt' trên giao diện của em, em sẽ kích hoạt hàm `.prompt()` trên đối tượng sự kiện đã lưu trước đó và lắng nghe lựa chọn của người dùng qua Promise trả về để cập nhật lại UI ẩn banner đi."*

---

### 🤝 CHỦ ĐỀ 7: QUẢN LÝ NHÓM & PHÂN QUYỀN (Group Chat & Authorization)

#### Q1: Làm sao em phân quyền (Authorization) trong nhóm chat ở Backend để đảm bảo thành viên bình thường không thể tự ý đổi tên nhóm hoặc kích người khác?
*   **Câu trả lời chuẩn**:
    > *"Em phân quyền chặt chẽ thông qua Middleware xác thực kết hợp với kiểm tra logic trực tiếp ở tầng Controller:
    > 1.  **Tầng Middleware**: Em viết middleware `checkGroupMembership` để xác thực người gọi API bắt buộc phải là thành viên nằm trong mảng `participants` của cuộc hội thoại đó trước khi cho phép đọc hay gửi tin nhắn.
    > 2.  **Tầng Controller**: Đối với các hành động nhạy cảm như đổi tên nhóm (`renameGroup`), thêm thành viên (`addMembers`), hoặc xóa thành viên (`removeMember`), server luôn thực hiện truy vấn document Conversation lên và so khớp: `conversation.group.createdBy.toString() === req.user._id.toString()`. Chỉ khi người gọi API chính là người tạo nhóm (Owner), nghiệp vụ mới được tiếp tục xử lý, ngược lại server lập tức chặn và trả về mã lỗi `403 Forbidden`."*

#### Q2: Khi chủ nhóm (Group Owner) muốn rời nhóm, em xử lý chuyển giao quyền sở hữu như thế nào để nhóm không bị lỗi logic?
*   **Câu trả lời chuẩn**:
    > *"Trong nghiệp vụ rời nhóm (`leaveGroup`), em kiểm tra xem thành viên yêu cầu rời đi có phải là chủ nhóm hiện tại (`createdBy`) hay không. 
    > *   Nếu là thành viên thường, server chỉ cần xóa ID của họ ra khỏi mảng `participants`.
    > *   Nếu người rời đi là Owner và nhóm vẫn còn những thành viên khác, API yêu cầu client phải gửi lên ID của thành viên sẽ nhận quyền sở hữu mới (`newOwnerId`). Server tiến hành cập nhật trường `createdBy` thành `newOwnerId` trước, ghi nhận một tin nhắn hệ thống thông báo chuyển giao quyền sở hữu, sau đó mới xóa ID của Owner cũ khỏi nhóm.
    > *   Trường hợp đặc biệt nếu Owner rời đi và nhóm không còn ai, server sẽ thực hiện xóa vĩnh viễn cuộc hội thoại đó khỏi DB để tránh rác dữ liệu."*

---

### 📝 CHỦ ĐỀ 8: XÁC THỰC FORM & TYPE SAFETY (Zod, React Hook Form & TypeScript)

#### Q1: Sự kết hợp giữa React Hook Form và Zod ở Frontend mang lại ưu thế gì so với cách validate form truyền thống?
*   **Câu trả lời chuẩn**:
    > *"Cách validate truyền thống thường yêu cầu lắng nghe sự kiện `onChange` trên từng input, lưu giá trị lỗi vào các state riêng biệt và kiểm tra bằng hàng loạt câu điều kiện `if-else` rất cồng kềnh, khiến component bị re-render liên tục khi người dùng gõ phím.
    >
    > Việc kết hợp **React Hook Form** và **Zod** giúp giải quyết triệt để vấn đề này:
    > 1.  **Hiệu năng tốt**: React Hook Form hoạt động theo cơ chế uncontrolled component mặc định, giảm số lần re-render component xuống tối thiểu trong quá trình nhập liệu.
    > 2.  **Định nghĩa validation tập trung**: Thay vì viết code validate rải rác, em định nghĩa một schema tập trung bằng Zod (ví dụ: quy định email hợp lệ, độ dài mật khẩu, so khớp trường xác nhận mật khẩu...). Schema này được liên kết trực tiếp vào React Hook Form thông qua `@hookform/resolvers/zod`.
    > 3.  **Type Safety tuyệt đối**: Em dùng `z.infer<typeof schema>` để tự động suy luận ra kiểu dữ liệu TypeScript từ schema Zod, đảm bảo tính an toàn dữ liệu từ giao diện nhập liệu đến khi truyền tham số vào API service."*

#### Q2: Schema Validation ở Frontend (Zod) và Backend được đồng bộ như thế nào? Tại sao cần cả hai tầng?
*   **Câu trả lời chuẩn**:
    > *"Dù đã validate rất kỹ ở Frontend bằng Zod, em vẫn luôn viết code kiểm tra dữ liệu đầu vào nghiêm ngặt tại Backend.
    > *   **Validate ở Frontend** nhằm tối ưu hóa trải nghiệm người dùng (UX), giúp phát hiện lỗi sai định dạng ngay lập tức mà không mất thời gian gửi request lên server (phản hồi thời gian thực).
    > *   **Validate ở Backend** là bắt buộc vì mục đích bảo mật (Security). Kẻ tấn công hoặc hacker có thể dễ dàng vượt qua tầng validate client-side bằng cách chỉnh sửa code JS trong trình duyệt hoặc sử dụng các công cụ gửi HTTP request trực tiếp như Postman/curl. 
    > *   Do đó, các quy tắc kiểm tra (như độ dài tối thiểu của username là 3 ký tự, password là 8 ký tự, regex kiểm tra định dạng email...) luôn được em đồng bộ thống nhất giữa định nghĩa Zod Schema ở Client và logic kiểm tra trong Controller ở Server."*

---

### 🌍 CHỦ ĐỀ 9: TRIỂN KHAI & DEPLOYMENT (Production Deployment)

#### Q1: Em đã xử lý lỗi 404 khi người dùng tải lại trang (Page Refresh) ở các route phụ như `/chat` hay `/profile` khi deploy SPA lên Vercel/Render như thế nào?
*   **Câu trả lời chuẩn**:
    > *"Đây là một lỗi rất phổ biến khi deploy ứng dụng Single Page Application (SPA) có sử dụng Client-side routing (React Router). 
    >
    > Khi người dùng đứng ở route `/chat` và nhấn refresh, trình duyệt sẽ gửi một request HTTP GET trực tiếp lên web server của nhà cung cấp hosting (Vercel hoặc Render) để tìm file vật lý nằm ở đường dẫn `/chat/index.html`. Do dự án React sau khi build chỉ có duy nhất một file `index.html` ở thư mục gốc, web server sẽ không tìm thấy file vật lý này và trả về lỗi 404.
    >
    > Để giải quyết lỗi này:
    > *   Đối với **Vercel**: Em tạo file `vercel.json` cấu hình rewrite rules: `"rewrites": [{ "source": "/(.*)", "destination": "/" }]`. Cấu hình này chỉ thị cho web server của Vercel chuyển tiếp tất cả các request ở bất kỳ URL nào về file `index.html` ở thư mục gốc. 
    > *   Đối với **Render**: Em cấu hình luật redirect tương tự trong bảng điều khiển Static Site.
    > *   Sau khi trình duyệt nhận được file `index.html` gốc, tệp Javascript của React Router sẽ tự động khởi chạy, đọc URL hiện tại trên trình duyệt và render chính xác component tương ứng, khắc phục hoàn toàn lỗi 404."*

#### Q2: Làm thế nào em cấu hình CORS giữa Frontend và Backend khi deploy thực tế để cookie Refresh Token vẫn hoạt động?
*   **Câu trả lời chuẩn**:
    > *"Khi chạy thực tế, Frontend và Backend thường chạy trên hai domain (hoặc subdomain) khác nhau. Do cơ chế bảo mật CORS (Cross-Origin Resource Sharing) của trình duyệt, việc truyền cookie giữa hai domain khác nhau mặc định sẽ bị chặn. 
    > Em đã xử lý cấu hình đồng bộ ở cả hai đầu:
    > 1.  **Ở Backend**: Trong middleware `cors`, em không được phép sử dụng wildcard `origin: '*'` (vì trình duyệt cấm gửi credentials/cookie kèm wildcard origin). Em phải khai báo đường dẫn domain cụ thể của Frontend vào phần cấu hình `origin`, đồng thời bật thuộc tính `credentials: true`.
    > 2.  **Ở Frontend**: Khi khởi tạo đối tượng Axios (`axios.ts`), em bật cấu hình `withCredentials: true`. Điều này báo cho trình duyệt biết luôn đính kèm cookie Refresh Token tự động trong mọi request gửi chéo domain đến Backend."*

---

## 🌐 7. Lý thuyết nền tảng về WebSockets & Socket.IO (Luyện phỏng vấn)

Nhà tuyển dụng rất thường xuyên kiểm tra kiến trúc mạng và giao thức truyền thông bằng cách hỏi sâu về lý thuyết WebSockets. Dưới đây là các kiến thức cốt lõi giúp bạn ghi điểm:

### A. WebSockets là gì và Cơ chế hoạt động (Handshake)?
*   **Định nghĩa**: **WebSocket** là một giao thức truyền thông máy tính (Computer Communication Protocol), cung cấp kênh truyền thông song song toàn phần (**Full-duplex**) qua một kết nối TCP duy nhất. Nó cho phép cả Client và Server gửi dữ liệu cho nhau bất kỳ lúc nào mà không cần bên kia yêu cầu trước.
*   **Cơ chế Bắt tay (Handshake - Protocol Upgrade)**:
    1.  **Bước 1**: Kết nối bắt đầu từ phía Client bằng một request **HTTP GET** thông thường gửi tới Server.
    2.  **Bước 2**: Trong header của request này, Client đính kèm các trường đặc biệt để yêu cầu nâng cấp giao thức:
        *   `Connection: Upgrade`
        *   `Upgrade: websocket`
        *   `Sec-WebSocket-Key: <một chuỗi mã hóa base64 ngẫu nhiên>`
    3.  **Bước 3**: Server nhận được request, kiểm tra cấu hình. Nếu chấp nhận, nó sẽ gửi lại một phản hồi HTTP status **`101 Switching Protocols`** kèm theo header phản hồi:
        *   `Connection: Upgrade`
        *   `Upgrade: websocket`
        *   `Sec-WebSocket-Accept: <chuỗi ký tự được hash từ Sec-WebSocket-Key>`
    4.  **Bước 4**: Từ thời điểm này, kết nối HTTP bị đóng lại. Kết nối TCP bên dưới vẫn được giữ mở (**Persistent connection**) và chuyển sang giao thức WebSocket (`ws://` hoặc `wss://`). Dữ liệu sẽ được truyền đi dưới dạng các **Message Frames** siêu nhẹ.

---

### B. So sánh chi tiết: HTTP vs. WebSockets

| Tiêu chí | HTTP (REST API) | WebSockets |
| :--- | :--- | :--- |
| **Giao thức** | `http://` / `https://` | `ws://` / `wss://` |
| **Loại kết nối** | **Short-lived / Stateless**: Mở kết nối -> Gửi yêu cầu -> Nhận phản hồi -> Đóng kết nối. | **Persistent / Stateful**: Kết nối được giữ mở liên tục giữa Client và Server. |
| **Chiều truyền thông** | **Half-duplex**: Chỉ Client mới có thể chủ động bắt đầu request. Server không tự gửi dữ liệu được. | **Full-duplex**: Cả hai bên gửi dữ liệu đồng thời bất cứ lúc nào (Bi-directional). |
| **Dung lượng header** | Rất lớn (chứa User-Agent, Cookies, Host... từ 500B đến vài KB cho mỗi request). | Rất nhẹ (sau khi handshake, các frame truyền đi chỉ mất khoảng 2 đến 14 Bytes phần header). |
| **Trường hợp áp dụng** | Tải dữ liệu tĩnh, CRUD tài nguyên, các thao tác không cần cập nhật tức thì. | Ứng dụng chat, game trực tuyến, bảng giá chứng khoán, thông báo real-time. |

---

### C. So sánh Native WebSockets vs. Socket.IO (Tại sao chọn Socket.IO?)
*Nhiều ứng viên nhầm tưởng Socket.IO chính là WebSockets, thực tế Socket.IO là một thư viện được xây dựng dựa trên WebSockets và cung cấp thêm nhiều giải pháp chống lỗi.*

1.  **Giao thức truyền tải thay thế (Fallback Transport)**:
    *   *Native WebSockets*: Nếu trình duyệt cũ hoặc thiết bị mạng (firewall, proxy) của người dùng chặn cổng WebSockets, kết nối sẽ thất bại hoàn toàn.
    *   *Socket.IO*: Bắt đầu kết nối bằng **HTTP Long-polling** trước để đảm bảo luôn kết nối thành công, sau đó mới ngầm nâng cấp (upgrade) lên WebSockets nếu môi trường hỗ trợ.
2.  **Tự động kết nối lại (Auto-reconnection)**:
    *   *Native WebSockets*: Nếu mất mạng, lập trình viên phải tự viết code đo đạc, dùng `setInterval` để cố gắng kết nối lại thủ công.
    *   *Socket.IO*: Tự động kết nối lại khi mất mạng với thuật toán thông minh (tăng dần thời gian chờ - exponential backoff).
3.  **Khái niệm phòng chat (Rooms & Namespaces)**:
    *   *Native WebSockets*: Không hỗ trợ sẵn. Bạn phải tự quản lý danh sách socket, tự phân luồng JSON gửi đi để tự phân chia phòng.
    *   *Socket.IO*: Cung cấp sẵn cơ chế `socket.join(room)` và `io.to(room).emit()`, giúp phân luồng và gửi tin nhắn nhóm cực kỳ đơn giản ở tầng ứng dụng.
4.  **Packet Buffering**: Nếu client mất kết nối tạm thời, Socket.IO sẽ giữ tạm các tin nhắn được gửi trong thời gian đó và tự động gửi lại ngay khi client kết nối lại.

---

### D. Các khái niệm cốt lõi trong Socket.IO cần nhớ

1.  **Socket**: Đại diện cho một kết nối đơn lẻ từ một trình duyệt client đến server. Mỗi socket có một ID duy nhất (`socket.id`).
2.  **Room**: Một kênh phân luồng logic trên server. Một socket có thể tham gia vào nhiều room cùng lúc (`socket.join('roomName')`). Room hoàn toàn là khái niệm ở Backend, Client không biết mình nằm trong Room nào mà chỉ nhận được tin nhắn server phát vào Room đó.
3.  **Namespace**: Cho phép chia nhỏ một Socket.IO server thành các kênh kết nối tách biệt hoàn toàn (ví dụ: Namespace `/chat` và Namespace `/notifications`), mỗi kênh có các kết nối, rooms và middleware xác thực riêng.
4.  **Các kiểu gửi tin nhắn (Emitting Events)**:
    *   `socket.emit('event', data)`: Gửi tin nhắn đến **chính client** đang kết nối hiện tại.
    *   `socket.broadcast.emit('event', data)`: Gửi tin nhắn đến **tất cả mọi người ngoại trừ** client đang gửi hiện tại.
    *   `io.emit('event', data)`: Gửi tin nhắn đến **tất cả mọi người** đang kết nối vào server.
    *   `io.to(roomName).emit('event', data)`: Gửi tin nhắn đến **tất cả mọi người nằm trong Room** chỉ định.

---

### E. So sánh WebSockets vs. HTTP Polling vs. Server-Sent Events (SSE)
*Nhà tuyển dụng rất thích hỏi câu này để xem bạn có hiểu rộng về các giải pháp real-time hay không.*

1.  **HTTP Polling (Short Polling)**:
    *   *Cách hoạt động*: Cứ mỗi $X$ giây, Client tự động gửi request HTTP lên Server để hỏi *"Có dữ liệu mới không?"*.
    *   *Nhược điểm*: Gây lãng phí tài nguyên server khủng khiếp (99% request trả về trống rỗng nhưng server vẫn phải mở/đóng kết nối, phân tích HTTP header).
2.  **HTTP Long Polling**:
    *   *Cách hoạt động*: Client gửi request HTTP lên Server. Server không trả lời ngay mà giữ request đó mở (block) cho đến khi có dữ liệu mới hoặc hết thời gian timeout. Khi nhận được dữ liệu, client nhận phản hồi và lập tức gửi tiếp một request mới để tiếp tục chờ.
    *   *Nhược điểm*: Mất thời gian thiết lập lại kết nối HTTP liên tục khi có dữ liệu dồn dập, độ trễ cao hơn WebSocket.
3.  **Server-Sent Events (SSE)**:
    *   *Cách hoạt động*: Kết nối một chiều (One-way / Uni-directional) sử dụng giao thức HTTP truyền thống. Client mở kết nối persistent và Server liên tục đẩy dữ liệu xuống client dưới dạng stream văn bản (`text/event-stream`).
    *   *Ưu điểm*: Chạy trên giao thức HTTP thông thường (dễ qua tường lửa), tự động kết nối lại, rất phù hợp cho các tính năng chỉ cần nhận dữ liệu từ server (ví dụ: bảng tin chứng khoán, feed thông báo, AI Chat streaming chữ như ChatGPT).
    *   *Nhược điểm*: Chỉ truyền một chiều. Nếu client muốn gửi tin nhắn lên server, client bắt buộc phải gửi một request HTTP POST riêng biệt.
4.  **WebSockets**:
    *   *Cách hoạt động*: Kết nối hai chiều (Bi-directional) song song toàn phần qua giao thức độc lập.
    *   *Ưu điểm*: Độ trễ cực thấp (gần như tức thì), tối ưu băng thông khi trao đổi liên tục cả hai chiều (như trò chơi trực tuyến, ứng dụng nhắn tin).

---

Chúc bạn có một buổi phỏng vấn thật thành công vào ngày mai! Hãy tự tin trình bày những giải pháp kỹ thuật trên, nhà tuyển dụng chắc chắn sẽ đánh giá cao tư duy giải quyết vấn đề thực tế của bạn. 🔥
