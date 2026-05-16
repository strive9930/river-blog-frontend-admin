/**
 * localStorage清理工具
 * 清理无效的JSON数据，防止解析错误
 */

export const cleanInvalidStorage = (): void => {
  const keysToCheck = [
    'user_info',
    'routes',
    'roles',
    'permissions',
    'menus',
    'menuTree'
  ]

  console.log('🔍 开始检查localStorage数据有效性...')

  keysToCheck.forEach(key => {
    const value = localStorage.getItem(key)
    
    if (value) {
      // 检查是否为"undefined"字符串
      if (value === 'undefined') {
        console.warn(`发现无效数据 "${key}": "undefined"，已清理`)
        localStorage.removeItem(key)
        return
      }
      
      // 检查JSON有效性
      try {
        JSON.parse(value)
        console.log(`✅ "${key}" 数据有效`)
      } catch (e) {
        console.warn(`发现无效JSON数据 "${key}":`, value, '已清理')
        localStorage.removeItem(key)
      }
    } else {
      console.log(`ℹ️ "${key}" 不存在或为空`)
    }
  })

  console.log('✅ localStorage检查完成')
}

// 在应用启动时自动清理
export const setupStorageCleanup = (): void => {
  try {
    cleanInvalidStorage()
  } catch (error) {
    console.error('localStorage清理失败:', error)
  }
}