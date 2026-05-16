import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import service from '@/utils/request'
import { ElMessage } from 'element-plus'

interface UserInfo {
  id: string
  email: string
  nickName: string
  avatar?: string
  roles: string[]
  permissions: string[]
}

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  success: boolean
  message?: string
  data?: {
    accessToken: string
    refreshToken: string
    userInfo: UserInfo
  }
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const accessToken = ref<string>(localStorage.getItem('access_token') || '')
  const refreshToken = ref<string>(localStorage.getItem('refresh_token') || '')
  const userInfo = ref<UserInfo | null>(
    (() => {
      const stored = localStorage.getItem('user_info')
      if (!stored || stored === 'undefined') return null
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.warn('用户信息JSON解析失败:', e)
        return null
      }
    })()
  )

  // 计算属性
  const isLoggedIn = computed(() => {
    const result = !!accessToken.value
    console.log('计算isLoggedIn:', result, 'token:', accessToken.value)
    return result
  })
  const email = computed(() => {
    const result = userInfo.value?.email || ''
    console.log('计算email:', result)
    return result
  })
  const nickName = computed(() => {
    const result = userInfo.value?.nickName || ''
    console.log('计算nickName:', result, 'userInfo:', userInfo.value)
    return result
  })
  const avatar = computed(() => {
    const result = userInfo.value?.avatar || ''
    console.log('计算avatar:', result)
    return result
  })
  const roles = computed(() => {
    const result = userInfo.value?.roles || []
    console.log('计算roles:', result)
    return result
  })
  const permissions = computed(() => {
    const result = userInfo.value?.permissions || []
    console.log('计算permissions:', result)
    return result
  })

  // Actions
  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    console.log('开始登录流程，凭据:', credentials);
    try {
      const response = await service.post('/auth/login', credentials);
      console.log('收到登录响应:', response);
      
      console.log('登录响应完整数据:', JSON.stringify(response, null, 2));
      console.log('登录响应data:', JSON.stringify(response.data, null, 2));
      console.log('response.data的所有键:', Object.keys(response.data));
      console.log('response.success类型:', typeof response.success);
      
      // 检查根级别的success字段
      if (response.success) {
        console.log('进入成功分支');
        // 处理后端返回的数据格式
        const loginData = response.data;
        console.log('loginData:', loginData);
        
        if (!loginData || !loginData.token) {
          console.error('登录数据格式错误:', loginData);
          return { success: false, message: '登录数据格式错误' };
        }
        
        const { token, userId, nickname } = loginData;
        
        console.log('解析的用户数据:', { token, userId, nickname });
        
        // 存储token和用户信息 - 使用标准字段名nickName
        accessToken.value = token;
        refreshToken.value = ''; // 后端暂未提供refresh token
        userInfo.value = {
          id: userId,
          email: credentials.email,
          nickName: nickname, // 统一使用驼峰命名
          roles: ['Admin'], // 默认角色
          permissions: ['admin'] // 给管理员默认权限
        };
        
        console.log('设置的userInfo:', userInfo.value);
        
        // 持久化到localStorage
        localStorage.setItem('access_token', accessToken.value);
        localStorage.setItem('refresh_token', refreshToken.value);
        localStorage.setItem('user_info', JSON.stringify(userInfo.value));
        
        console.log('localStorage设置完成');
        
        return { success: true };
      } else {
        console.log('进入失败分支');
        console.log('失败原因:', response.message);
        return { success: false, message: response.message || '登录失败' };
      }
    } catch (error: any) {
      console.error('登录失败:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || '登录失败，请检查网络连接' 
      }
    }
  }

  const logout = () => {
    // 清除所有用户相关数据
    accessToken.value = ''
    refreshToken.value = ''
    userInfo.value = null
    
    // 清除localStorage
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_info')
    localStorage.removeItem('routes')
    localStorage.removeItem('menus')
    localStorage.removeItem('menuTree')
    
    ElMessage.success('退出登录成功')
  }

  const getUserInfo = async (): Promise<boolean> => {
    try {
      const response = await service.get('/auth/user/info')
      
      if (response.data.success) {
        // 统一字段命名，确保与store中定义一致
        const apiUserInfo = response.data.data;
        userInfo.value = {
          id: apiUserInfo.id,
          email: apiUserInfo.email,
          nickName: apiUserInfo.nickName,
          avatar: apiUserInfo.avatar,
          roles: apiUserInfo.roles || [],
          permissions: apiUserInfo.permissions || []
        };
        localStorage.setItem('user_info', JSON.stringify(userInfo.value))
        return true
      }
      return false
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return false
    }
  }

  const refreshTokenFunc = async (): Promise<boolean> => {
    // 暂时禁用refresh token功能，因为后端还未实现
    console.warn('Refresh token功能暂未实现');
    return false;
    
    /*
    try {
      const response = await service.post('/auth/refresh', {
        refreshToken: refreshToken.value
      })
      
      if (response.data.success) {
        accessToken.value = response.data.data.accessToken
        refreshToken.value = response.data.data.refreshToken || refreshToken.value
        localStorage.setItem('access_token', accessToken.value)
        localStorage.setItem('refresh_token', refreshToken.value)
        return true
      }
      return false
    } catch (error: any) {
      console.error('刷新token失败:', error)
      logout()
      return false
    }
    */
  }

  const initUserState = async () => {
    console.log('=== 开始初始化用户状态 ===')
    // 从localStorage恢复用户状态
    const storedToken = localStorage.getItem('access_token')
    const storedUserInfo = localStorage.getItem('user_info')
    
    console.log('初始化用户状态:')
    console.log('- 存储的token:', storedToken)
    console.log('- 存储的用户信息:', storedUserInfo)
    console.log('- token是否存在:', !!storedToken)
    console.log('- user_info是否存在:', !!storedUserInfo)
    console.log('- user_info是否为undefined字符串:', storedUserInfo === 'undefined')
    
    if (storedToken && storedUserInfo && storedUserInfo !== 'undefined') {
      accessToken.value = storedToken
      try {
        const parsedUserInfo = JSON.parse(storedUserInfo)
        userInfo.value = parsedUserInfo
        console.log('解析后的用户信息:', userInfo.value)
        console.log('解析后的用户信息类型:', typeof userInfo.value)
        console.log('解析后的用户信息keys:', Object.keys(userInfo.value || {}))
      } catch (e) {
        console.warn('初始化用户状态时JSON解析失败:', e)
        console.warn('原始存储的用户信息:', storedUserInfo)
        logout()
        return
      }
      
      // 验证token有效性
      try {
        console.log('开始获取用户信息...')
        await getUserInfo()
        console.log('获取用户信息完成')
      } catch (error) {
        console.error('获取用户信息失败:', error)
        // 如果获取用户信息失败，清除状态
        logout()
        throw error
      }
    } else {
      console.log('没有找到存储的用户状态')
      console.log('存储检查结果:', {
        hasToken: !!storedToken,
        hasUserInfo: !!storedUserInfo,
        userInfoIsUndefined: storedUserInfo === 'undefined'
      })
    }
    console.log('=== 用户状态初始化完成 ===')
  }

  return {
    // 状态
    accessToken,
    refreshToken,
    userInfo,
    
    // 计算属性
    isLoggedIn,
    email,
    nickName,
    avatar,
    roles,
    permissions,
    
    // 方法
    login,
    logout,
    getUserInfo,
    doRefreshToken: refreshTokenFunc,
    initUserState
  }
})