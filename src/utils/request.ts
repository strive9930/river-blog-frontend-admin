import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router'; // 引入 Vue Router 进行无刷新跳转

const api = axios.create({
    baseURL: import.meta.env.VITE_APP_BASE_API || '',
  timeout: 15000
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.success === false) {
      ElMessage.error(res.message || '业务执行失败');
      return Promise.reject(new Error(res.message));
    }
    return res; // 正常返回解包后的数据
  },
  (error) => {
    const status = error.response?.status;
    
    if (status === 401) {
      // 🌟 核心升级 1：动态引入 Store，避免由于 Axios 和 Pinia 初始化时序问题导致的“循环依赖”报错
      import('@/store/modules/user').then(({ useUserStore }) => {
        const userStore = useUserStore();
        
        // 🌟 核心升级 2：呼叫大招，一波带走所有内存状态和硬盘缓存（Token、角色、权限、用户信息）
        userStore.resetToken();
        
        // 🌟 核心升级 3：优雅跳回登录页，并记下刚才的坐标。登录成功后 router 即可无缝导回此页！
        const currentPath = router.currentRoute.value.fullPath;
        // 防止用户已经在登录页还无限重定向
        if (!currentPath.startsWith('/login')) {
          router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        }
      });
      
      ElMessage.error('登录状态已过期或无效，请重新登录');
      
    } else if (status === 403) {
      // 🌟 核心升级 4：403 越权拦截！前端防线失效或强行发请求被后端识破时的兜底
      ElMessage.error('越权警告：您没有权限执行该操作！');
      
    } else {
      // 其他错误兜底（如 500、404 等）
      ElMessage.error(error.response?.data?.message || error.message || '网络请求异常');
    }
    
    return Promise.reject(error);
  }
);

export default api;

// 导出常用的 HTTP 方法，方便在 API 文件中直接使用
export const get = <T = any>(url: string, params?: any) => {
  return api.get<T>(url, { params });
};

export const post = <T = any>(url: string, data?: any) => {
  return api.post<T>(url, data);
};

export const put = <T = any>(url: string, data?: any) => {
  return api.put<T>(url, data);
};

export const del = <T = any>(url: string, params?: any) => {
  return api.delete<T>(url, { params });
};