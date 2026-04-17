import { useAuthStore } from "@/stores/useAuthStore";
import axios from "axios"

const api = axios.create({
  baseURL: (import.meta.env.MODE = "development"
    ? "http://localhost:5001/api"
    : "/api"),
  withCredentials: true,
});

// gắn access token vào req header
// mỗi lần có request gửi đi nó sẽ chạy qua hàm này trước
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  //hàm getState() sẽ giúp cho lấy giá trị của biến AccessToken tại thời
  // điểm mà dòng code này chạy dù cho biến dc cập nhật 
  //  *còn KHÔNG CÓ thì nó sẽ tự động cập nhật theo thay đổi*
  
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config
  
})
export default api