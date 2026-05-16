import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { permissionApi, permissionAssignmentApi } from '@/api/permission'
import type { Permission } from '@/types/permission'

// 权限管理组合式API
export const usePermissionManagement = () => {
  // 响应式数据
  const permissions = ref<Permission[]>([])
  const permissionGroups = ref<{[key: string]: Permission[]}>({})
  const loading = ref(false)
  const searchKeyword = ref('')

  // 计算属性
  const filteredPermissions = computed(() => {
    if (!searchKeyword.value) return permissions.value
    
    const keyword = searchKeyword.value.toLowerCase()
    return permissions.value.filter(perm => 
      perm.name.toLowerCase().includes(keyword) ||
      perm.code.toLowerCase().includes(keyword) ||
      perm.description?.toLowerCase().includes(keyword)
    )
  })

  const groupedPermissions = computed(() => {
    const groups: {[key: string]: Permission[]} = {}
    
    filteredPermissions.value.forEach(perm => {
      const group = perm.group || '未分组'
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(perm)
    })
    
    return groups
  })

  // 方法
  const loadPermissions = async () => {
    loading.value = true
    try {
      const response = await permissionApi.getList()
      if (response.success) {
        permissions.value = response.data
        organizePermissions()
      } else {
        ElMessage.error(response.message || '加载权限失败')
      }
    } catch (error) {
      ElMessage.error('加载权限失败')
    } finally {
      loading.value = false
    }
  }

  const organizePermissions = () => {
    const groups: {[key: string]: Permission[]} = {}
    permissions.value.forEach(perm => {
      const group = perm.group || '未分组'
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(perm)
    })
    permissionGroups.value = groups
  }

  const addPermission = async (permissionData: Omit<Permission, 'id' | 'createTime'>) => {
    try {
      const response = await permissionApi.create(permissionData)
      if (response.success) {
        ElMessage.success('权限创建成功')
        await loadPermissions()
        return response.data
      } else {
        ElMessage.error(response.message || '权限创建失败')
        return null
      }
    } catch (error) {
      ElMessage.error('权限创建失败')
      return null
    }
  }

  const updatePermission = async (id: string, permissionData: Partial<Permission>) => {
    try {
      const response = await permissionApi.update(id, permissionData)
      if (response.success) {
        ElMessage.success('权限更新成功')
        await loadPermissions()
        return true
      } else {
        ElMessage.error(response.message || '权限更新失败')
        return false
      }
    } catch (error) {
      ElMessage.error('权限更新失败')
      return false
    }
  }

  const deletePermission = async (id: string) => {
    try {
      const response = await permissionApi.delete(id)
      if (response.success) {
        ElMessage.success('权限删除成功')
        await loadPermissions()
        return true
      } else {
        ElMessage.error(response.message || '权限删除失败')
        return false
      }
    } catch (error) {
      ElMessage.error('权限删除失败')
      return false
    }
  }

  const searchPermissions = (keyword: string) => {
    searchKeyword.value = keyword
  }

  const clearSearch = () => {
    searchKeyword.value = ''
  }

  return {
    // 数据
    permissions,
    permissionGroups,
    loading,
    searchKeyword,
    
    // 计算属性
    filteredPermissions,
    groupedPermissions,
    
    // 方法
    loadPermissions,
    addPermission,
    updatePermission,
    deletePermission,
    searchPermissions,
    clearSearch
  }
}

// 权限分配组合式API
export const usePermissionAssignment = () => {
  const assignedPermissions = ref<Permission[]>([])
  const assigning = ref(false)
  const clearing = ref(false)

  const assignPermissions = async (
    targetId: string, 
    targetType: 'role' | 'user', 
    permissionIds: string[]
  ) => {
    assigning.value = true
    try {
      const response = await permissionAssignmentApi.assignPermissions(
        targetId,
        targetType,
        permissionIds
      )
      
      if (response.success) {
        ElMessage.success('权限分配成功')
        await loadAssignedPermissions(targetId, targetType)
        return true
      } else {
        ElMessage.error(response.message || '权限分配失败')
        return false
      }
    } catch (error) {
      ElMessage.error('权限分配失败')
      return false
    } finally {
      assigning.value = false
    }
  }

  const clearPermissions = async (targetId: string, targetType: 'role' | 'user') => {
    clearing.value = true
    try {
      const response = await permissionAssignmentApi.clearPermissions(targetId, targetType)
      
      if (response.success) {
        ElMessage.success('权限清空成功')
        assignedPermissions.value = []
        return true
      } else {
        ElMessage.error(response.message || '权限清空失败')
        return false
      }
    } catch (error) {
      ElMessage.error('权限清空失败')
      return false
    } finally {
      clearing.value = false
    }
  }

  const loadAssignedPermissions = async (targetId: string, targetType: 'role' | 'user') => {
    try {
      const response = await permissionAssignmentApi.getAssignedPermissions(targetId, targetType)
      
      if (response.success) {
        assignedPermissions.value = response.data
      } else {
        ElMessage.error(response.message || '加载已分配权限失败')
      }
    } catch (error) {
      ElMessage.error('加载已分配权限失败')
    }
  }

  const isPermissionAssigned = (permissionId: string) => {
    return assignedPermissions.value.some(p => p.id === permissionId)
  }

  return {
    // 数据
    assignedPermissions,
    assigning,
    clearing,
    
    // 方法
    assignPermissions,
    clearPermissions,
    loadAssignedPermissions,
    isPermissionAssigned
  }
}

// 权限检查组合式API
export const usePermissionCheck = () => {
  const checkPermission = (requiredPermission: string): boolean => {
    // 这里应该从用户存储中获取用户的权限列表
    // 暂时返回true用于演示
    return true
  }

  const checkPermissions = (requiredPermissions: string[], operator: 'AND' | 'OR' = 'AND'): boolean => {
    if (operator === 'AND') {
      return requiredPermissions.every(checkPermission)
    } else {
      return requiredPermissions.some(checkPermission)
    }
  }

  return {
    checkPermission,
    checkPermissions
  }
}