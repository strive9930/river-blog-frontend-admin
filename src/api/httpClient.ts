import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { loadingService } from '@/services/loadingService'
import { errorHandlingService } from '@/services/errorHandlingService'

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // 自动生成加载消息
    const loadingMessage = generateLoadingMessage(config)
    loadingService.show(loadingMessage)
    
    // 添加认证token
    const token = localStorage.getItem('accessToken')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error: AxiosError) => {
    loadingService.hide()
    errorHandlingService.handleError(error, '请求配置错误')
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    loadingService.hide()
    
    // 统一处理成功响应
    if (response.data && response.data.success === false) {
      errorHandlingService.handleApiError(response.data, 'API操作')
      return Promise.reject(new Error(response.data.message || '操作失败'))
    }
    
    return response
  },
  (error: AxiosError) => {
    loadingService.hide()
    
    // 统一错误处理
    if (error.response) {
      // 服务器响应错误
      handleServerErrors(error.response)
    } else if (error.request) {
      // 网络错误
      errorHandlingService.handleError('网络连接失败，请检查网络设置', '网络错误')
    } else {
      // 其他错误
      errorHandlingService.handleError(error, '请求处理错误')
    }
    
    return Promise.reject(error)
  }
)

// 处理服务器错误响应
function handleServerErrors(response: AxiosResponse) {
  const { status, data } = response
  const errorMessage = data?.message || data?.error || '未知错误'
  
  switch (status) {
    case 400:
      errorHandlingService.handleApiError(data, '请求参数错误')
      break
    case 401:
      errorHandlingService.showWarning('登录已过期，请重新登录')
      // 可以在这里触发登出逻辑
      localStorage.removeItem('accessToken')
      window.location.href = '/login'
      break
    case 403:
      errorHandlingService.showWarning('权限不足，无法执行此操作')
      break
    case 404:
      errorHandlingService.handleApiError(data, '请求的资源不存在')
      break
    case 500:
      errorHandlingService.handleApiError(data, '服务器内部错误')
      break
    default:
      errorHandlingService.handleApiError(data, `HTTP ${status} 错误`)
  }
}

// 生成加载消息
function generateLoadingMessage(config: AxiosRequestConfig): string {
  const url = config.url || ''
  const method = config.method?.toUpperCase() || ''
  
  // 根据URL和方法生成友好的加载消息
  if (url.includes('/permissions')) {
    switch (method) {
      case 'GET': return '正在获取权限信息...'
      case 'POST': return '正在创建权限...'
      case 'PUT': return '正在更新权限...'
      case 'DELETE': return '正在删除权限...'
      default: return '正在处理权限操作...'
    }
  }
  
  if (url.includes('/roles')) {
    switch (method) {
      case 'GET': return '正在获取角色信息...'
      case 'POST': return '正在创建角色...'
      case 'PUT': return '正在更新角色...'
      case 'DELETE': return '正在删除角色...'
      default: return '正在处理角色操作...'
    }
  }
  
  if (url.includes('/users')) {
    switch (method) {
      case 'GET': return '正在获取用户信息...'
      case 'POST': return '正在创建用户...'
      case 'PUT': return '正在更新用户...'
      case 'DELETE': return '正在删除用户...'
      default: return '正在处理用户操作...'
    }
  }
  
  // 默认消息
  return '正在处理请求...'
}

// API请求方法
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.get<T>(url, config),
  
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.post<T>(url, data, config),
  
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.put<T>(url, data, config),
  
  delete: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.delete<T>(url, config),
  
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.patch<T>(url, data, config)
}

// 带加载状态的请求包装器
export const apiWithLoading = {
  get: <T>(url: string, loadingMessage: string, config?: AxiosRequestConfig) => {
    loadingService.show(loadingMessage)
    return apiClient.get<T>(url, config)
      .finally(() => loadingService.hide())
  },
  
  post: <T>(url: string, data: any, loadingMessage: string, config?: AxiosRequestConfig) => {
    loadingService.show(loadingMessage)
    return apiClient.post<T>(url, data, config)
      .finally(() => loadingService.hide())
  },
  
  put: <T>(url: string, data: any, loadingMessage: string, config?: AxiosRequestConfig) => {
    loadingService.show(loadingMessage)
    return apiClient.put<T>(url, data, config)
      .finally(() => loadingService.hide())
  },
  
  delete: <T>(url: string, loadingMessage: string, config?: AxiosRequestConfig) => {
    loadingService.show(loadingMessage)
    return apiClient.delete<T>(url, config)
      .finally(() => loadingService.hide())
  }
}

export default apiClient