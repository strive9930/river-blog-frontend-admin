/**
 * 认证相关工具函数
 */

// Token相关
export const getToken = (): string | null => {
  return localStorage.getItem('access_token')
}

export const setToken = (token: string): void => {
  localStorage.setItem('access_token', token)
}

export const removeToken = (): void => {
  localStorage.removeItem('access_token')
}

// 用户信息相关
export const getUserInfo = (): any => {
  return {
    userId: localStorage.getItem('user_id'),
    username: localStorage.getItem('username'),
    nickName: localStorage.getItem('nickname'),
    avatar: localStorage.getItem('avatar'),
    roles: JSON.parse(localStorage.getItem('roles') || '[]'),
    permissions: JSON.parse(localStorage.getItem('permissions') || '[]')
  }
}

export const setUserInfo = (userInfo: any): void => {
  localStorage.setItem('user_id', userInfo.userId)
  localStorage.setItem('username', userInfo.username)
  localStorage.setItem('nickname', userInfo.nickName)
  localStorage.setItem('avatar', userInfo.avatar || '')
  localStorage.setItem('roles', JSON.stringify(userInfo.roles || []))
  localStorage.setItem('permissions', JSON.stringify(userInfo.permissions || []))
}

export const removeUserInfo = (): void => {
  localStorage.removeItem('user_id')
  localStorage.removeItem('username')
  localStorage.removeItem('nickname')
  localStorage.removeItem('avatar')
  localStorage.removeItem('roles')
  localStorage.removeItem('permissions')
}

// 路由相关
export const getRoutes = (): any[] => {
  const routesStr = localStorage.getItem('routes')
  if (!routesStr || routesStr === 'undefined') return []
  try {
    return JSON.parse(routesStr)
  } catch (e) {
    console.warn('解析路由失败:', e)
    return []
  }
}

export const setRoutes = (routes: any[]): void => {
  localStorage.setItem('routes', JSON.stringify(routes))
}

export const removeRoutes = (): void => {
  localStorage.removeItem('routes')
}

// 清除所有认证信息
export const clearAuth = (): void => {
  removeToken()
  removeUserInfo()
  removeRoutes()
}

// 检查是否已登录
export const isAuthenticated = (): boolean => {
  return !!getToken()
}

// 获取认证头
export const getAuthHeader = (): Record<string, string> => {
  const token = getToken()
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}