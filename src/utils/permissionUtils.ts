// 权限相关工具函数

import type { Permission, PermissionGroup } from '@/types/permission'

/**
 * 将权限数组按分组组织
 * @param permissions 权限数组
 * @returns 分组后的权限对象
 */
export const groupPermissions = (permissions: Permission[]): Record<string, Permission[]> => {
  const groups: Record<string, Permission[]> = {}
  
  permissions.forEach(permission => {
    const groupName = permission.group || '未分组'
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(permission)
  })
  
  // 对每个分组内的权限按名称排序
  Object.keys(groups).forEach(groupName => {
    groups[groupName].sort((a, b) => a.name.localeCompare(b.name))
  })
  
  return groups
}

/**
 * 将权限数组转换为分组数组格式
 * @param permissions 权限数组
 * @returns 分组数组
 */
export const groupPermissionsToArray = (permissions: Permission[]): PermissionGroup[] => {
  const grouped = groupPermissions(permissions)
  return Object.entries(grouped).map(([groupName, perms]) => ({
    groupName,
    permissions: perms
  }))
}

/**
 * 搜索权限
 * @param permissions 权限数组
 * @param keyword 搜索关键词
 * @returns 匹配的权限数组
 */
export const searchPermissions = (permissions: Permission[], keyword: string): Permission[] => {
  if (!keyword.trim()) return permissions
  
  const lowerKeyword = keyword.toLowerCase()
  return permissions.filter(permission => 
    permission.name.toLowerCase().includes(lowerKeyword) ||
    permission.code.toLowerCase().includes(lowerKeyword) ||
    (permission.description && permission.description.toLowerCase().includes(lowerKeyword)) ||
    permission.group.toLowerCase().includes(lowerKeyword)
  )
}

/**
 * 过滤权限
 * @param permissions 权限数组
 * @param filter 过滤条件
 * @returns 过滤后的权限数组
 */
export const filterPermissions = (
  permissions: Permission[], 
  filter: {
    group?: string
    assignedOnly?: boolean
    unassignedOnly?: boolean
  }
): Permission[] => {
  let result = [...permissions]
  
  // 按分组过滤
  if (filter.group) {
    result = result.filter(p => p.group === filter.group)
  }
  
  // 按分配状态过滤（需要传入已分配权限ID数组）
  // 这里的逻辑需要根据实际情况调整
  
  return result
}

/**
 * 检查权限是否匹配
 * @param userPermissions 用户拥有的权限数组
 * @param requiredPermission 要求的权限
 * @returns 是否有权限
 */
export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  // 超级管理员拥有所有权限
  if (userPermissions.includes('admin') || userPermissions.includes('*')) {
    return true
  }
  
  return userPermissions.includes(requiredPermission)
}

/**
 * 检查多个权限（AND/OR逻辑）
 * @param userPermissions 用户拥有的权限数组
 * @param requiredPermissions 要求的权限数组
 * @param operator 逻辑操作符 ('AND' | 'OR')
 * @returns 是否满足权限要求
 */
export const hasPermissions = (
  userPermissions: string[], 
  requiredPermissions: string[], 
  operator: 'AND' | 'OR' = 'AND'
): boolean => {
  if (operator === 'AND') {
    return requiredPermissions.every(perm => hasPermission(userPermissions, perm))
  } else {
    return requiredPermissions.some(perm => hasPermission(userPermissions, perm))
  }
}

/**
 * 生成权限树结构
 * @param permissions 权限数组
 * @returns 权限树
 */
export const buildPermissionTree = (permissions: Permission[]): any[] => {
  // 这里可以实现权限树的构建逻辑
  // 根据权限code的层级关系构建树形结构
  return []
}

/**
 * 扁平化权限树
 * @param tree 权限树
 * @returns 扁平化的权限数组
 */
export const flattenPermissionTree = (tree: any[]): Permission[] => {
  const result: Permission[] = []
  
  const traverse = (nodes: any[]) => {
    nodes.forEach(node => {
      if (node.permission) {
        result.push(node.permission)
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }
  
  traverse(tree)
  return result
}

/**
 * 权限去重
 * @param permissions 权限数组
 * @returns 去重后的权限数组
 */
export const deduplicatePermissions = (permissions: Permission[]): Permission[] => {
  const seen = new Set<string>()
  return permissions.filter(permission => {
    if (seen.has(permission.code)) {
      return false
    }
    seen.add(permission.code)
    return true
  })
}

/**
 * 权限合并
 * @param permissions1 权限数组1
 * @param permissions2 权限数组2
 * @returns 合并后的权限数组
 */
export const mergePermissions = (permissions1: Permission[], permissions2: Permission[]): Permission[] => {
  const merged = [...permissions1, ...permissions2]
  return deduplicatePermissions(merged)
}

/**
 * 计算权限差异
 * @param oldPermissions 旧权限数组
 * @param newPermissions 新权限数组
 * @returns 差异对象 { added, removed, unchanged }
 */
export const calculatePermissionDiff = (
  oldPermissions: Permission[], 
  newPermissions: Permission[]
): { added: Permission[]; removed: Permission[]; unchanged: Permission[] } => {
  const oldCodes = new Set(oldPermissions.map(p => p.code))
  const newCodes = new Set(newPermissions.map(p => p.code))
  
  const added = newPermissions.filter(p => !oldCodes.has(p.code))
  const removed = oldPermissions.filter(p => !newCodes.has(p.code))
  const unchanged = oldPermissions.filter(p => newCodes.has(p.code))
  
  return { added, removed, unchanged }
}

/**
 * 验证权限编码格式
 * @param code 权限编码
 * @returns 是否有效
 */
export const validatePermissionCode = (code: string): boolean => {
  // 权限编码应该符合特定格式，例如：module:action
  const pattern = /^[a-zA-Z][a-zA-Z0-9]*:[a-zA-Z][a-zA-Z0-9]*$/
  return pattern.test(code)
}

/**
 * 格式化权限编码
 * @param code 原始编码
 * @returns 格式化后的编码
 */
export const formatPermissionCode = (code: string): string => {
  return code.toLowerCase().replace(/\s+/g, ':')
}

/**
 * 权限编码转换为显示名称
 * @param code 权限编码
 * @returns 显示名称
 */
export const permissionCodeToName = (code: string): string => {
  return code
    .split(':')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default {
  groupPermissions,
  groupPermissionsToArray,
  searchPermissions,
  filterPermissions,
  hasPermission,
  hasPermissions,
  buildPermissionTree,
  flattenPermissionTree,
  deduplicatePermissions,
  mergePermissions,
  calculatePermissionDiff,
  validatePermissionCode,
  formatPermissionCode,
  permissionCodeToName
}