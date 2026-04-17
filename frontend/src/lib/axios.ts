import { useAuthStore } from "@/stores/useAuthStore";
import axios from "axios"

const api = axios.create({
  baseURL: (import.meta.env.MODE === "development"
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


// tự động gọi refresh api khi access token hết hạn

api.interceptors.response.use((res)=> res ,async (error) => {
  const originalRequest = error.config ;


  if (
  originalRequest.url?.includes("/auth/signin") ||
  originalRequest.url?.includes("/auth/signup") ||
  originalRequest.url?.includes("/auth/refresh")
) {
  return Promise.reject(error);
}
originalRequest._retryCount =originalRequest._retryCount || 0

  if(error.response?.status===403 && originalRequest._retryCount <4){
    originalRequest._retryCount += 1
    try { 
      const res = await api.post('/auth/refresh',{},{withCredentials:true})
      const newAccessToken = res.data.accessToken

      useAuthStore.getState().setAccessToken(newAccessToken)
      originalRequest.headers = originalRequest.headers || {};
originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest)
    } catch (refreshError) {
      useAuthStore.getState().clearState()
      return Promise.reject(refreshError)
    }
  }
  return Promise.reject(error)
})
export default api