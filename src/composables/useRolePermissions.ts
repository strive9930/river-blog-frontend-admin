/**
 * 角色权限管理组合式API
 * 提供角色权限状态查看和批量分配功能
 */

import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { RoleService } from '@/services'
import { PermissionService } from '@/services/permission.service'
import type { Role } from '@/types'

// 权限树节点类型
export interface PermissionTreeNode {
  id: string
  name: string
  code: string
  description?: string
  parentId?: string
  children?: PermissionTreeNode[]
  checked?: boolean
  indeterminate?: boolean
}

// 角色权限状态类型
export interface RolePermissionStatus {
  roleId: string
  roleName: string
  assignedPermissions: string[]
  allPermissions: PermissionTreeNode[]
  groupedPermissions: Record<string, PermissionTreeNode[]>
}

interface GroupedPermission {
  groupName: string
  permissions: Array<{
    id: string
    name: string
    code: string
    description?: string
    group: string
    claimType?: string
    claimValue?: string
    isEnabled: boolean
    isAssigned: boolean
    createdTime: string
    updatedTime?: string
  }>
}

export function useRolePermissions() {
  // 响应式状态
  const loading = ref(false)
  const permissionTree = ref<PermissionTreeNode[]>([])
  const rolePermissionStatus = ref<RolePermissionStatus | null>(null)
  const expandedKeys = ref<string[]>([])
  
  // 计算属性
  const hasPermissionTree = computed(() => permissionTree.value.length > 0)
  
  /**
   * 加载权限树数据
   */
  const loadPermissionTree = async (): Promise<boolean> => {
    try {
      loading.value = true
      
      // 调用后端API获取分组权限数据
      const response = await PermissionService.getGroupedPermissions()
      
      // 根据最新的响应格式，API直接返回分组权限数组
      if (response && Array.isArray(response)) {
        // 将后端数据转换为树形结构
        permissionTree.value = transformToTreeStructure(response)
        initializeExpandedKeys();
        console.log('权限树数据:', permissionTree.value)
        return true
      } else {
        // 输出错误信息以调试
        console.log("API响应:", response);
        ElMessage.error('获取权限数据失败，响应格式不正确')
        return false
      }
    } catch (error: any) {
      console.error('加载权限树失败:', error)
      //ElMessage.error(error?.message || '加载权限数据失败')
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 获取角色权限状态
   */
  const getRolePermissionStatus = async (roleId: string): Promise<boolean> => {
    try {
      loading.value = true
      
      // 并行获取角色信息和权限状态
      const [roleResponse, statusResponse] = await Promise.all([
        RoleService.getById(roleId),
        PermissionService.getRolePermissionStatus(roleId)
      ])
      
      if (roleResponse.success && statusResponse.success) {
        const role = roleResponse.data as Role
        const permissionData = statusResponse.data
        
        rolePermissionStatus.value = {
          roleId,
          roleName: role.name,
          assignedPermissions: permissionData.assignedPermissionIds || [],
          allPermissions: transformToTreeStructure(permissionData.allPermissions || []),
          groupedPermissions: permissionData.groupedPermissions || {}
        }
        
        // 更新权限树的选中状态
        updatePermissionTreeCheckedState(rolePermissionStatus.value.assignedPermissions)
        return true
      } else {
        const errorMessage = roleResponse.message || statusResponse.message || '获取角色权限状态失败'
        ElMessage.error(errorMessage)
        return false
      }
    } catch (error) {
      console.error('获取角色权限状态失败:', error)
      ElMessage.error('获取角色权限状态失败')
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 批量分配权限给角色
   */
  const batchAssignPermissions = async (
    roleId: string,
    addPermissionIds: string[],
    removePermissionIds: string[]
  ): Promise<boolean> => {
    try {
      loading.value = true
      
      const response = await PermissionService.batchAssignPermissions(
        roleId,
        addPermissionIds,
        removePermissionIds
      )
      console.log('权限分配结果:', response)
      if (response.success) {
        ElMessage.success(response.message || '权限分配成功')
        return true
      } else {
        ElMessage.error(response.message || '权限分配失败')
        return false
      }
    } catch (error) {
      console.error('批量分配权限失败:', error)
      ElMessage.error('权限分配失败')
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 将分组数据转换为树形结构
   */
  const transformToTreeStructure = (groupedData: GroupedPermission[]): PermissionTreeNode[] => {
    const treeNodes: PermissionTreeNode[] = []
    
    // 遍历每个权限组
    groupedData.forEach(group => {
      // 创建一个组节点作为父节点
      const groupNode: PermissionTreeNode = {
        id: `group_${group.groupName}`,
        name: group.groupName,
        code: `group:${group.groupName}`,
        description: `权限组：${group.groupName}`,
        children: [],
        checked: false,
        indeterminate: false
      }
      
      // 将组内的权限添加为子节点
      if (group.permissions && group.permissions.length > 0) {
        const childNodes: PermissionTreeNode[] = group.permissions.map(permission => ({
          id: permission.id,
          name: permission.name,
          code: permission.code,
          description: permission.description || '',
          parentId: groupNode.id,
          checked: permission.isAssigned || false,
          indeterminate: false
        }))
        
        groupNode.children = childNodes
      }
      
      treeNodes.push(groupNode)
    })
    
    return treeNodes
  }
  
  /**
   * 初始化展开的节点
   */
  const initializeExpandedKeys = () => {
    const keys: string[] = []
    const traverse = (nodes: PermissionTreeNode[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          keys.push(node.id)
          traverse(node.children)
        }
      })
    }
    traverse(permissionTree.value)
    expandedKeys.value = keys
  }
  
  /**
   * 更新权限树的选中状态
   */
  const updatePermissionTreeCheckedState = (assignedPermissionIds: string[]) => {
    const assignedSet = new Set(assignedPermissionIds)
    
    const updateNode = (node: PermissionTreeNode) => {
      // 检查当前节点是否被选中
      node.checked = assignedSet.has(node.id)
      node.indeterminate = false
      
      if (node.children && node.children.length > 0) {
        // 递归更新子节点
        const childStates = node.children.map(updateNode)
        
        // 检查子节点的选中状态
        const checkedCount = childStates.filter(state => state === true).length
        const totalCount = childStates.length
        
        if (checkedCount === totalCount) {
          // 所有子节点都被选中
          node.checked = true
          node.indeterminate = false
        } else if (checkedCount > 0) {
          // 部分子节点被选中
          node.checked = false
          node.indeterminate = true
        } else {
          // 没有子节点被选中
          node.checked = false
          node.indeterminate = false
        }
        
        return node.checked || node.indeterminate
      }
      
      return node.checked
    }
    
    permissionTree.value.forEach(updateNode)
  }
  
  /**
   * 处理权限选择变化
   */
  const handlePermissionCheck = (checkedNodes: PermissionTreeNode[], checkedKeys: string[]) => {
    if (!rolePermissionStatus.value) return
    
    const newAssignedPermissions = new Set(checkedKeys)
    
    // 计算需要添加和移除的权限
    const currentAssigned = new Set(rolePermissionStatus.value.assignedPermissions)
    const addPermissionIds: string[] = []
    const removePermissionIds: string[] = []
    
    // 找出新增的权限
    checkedKeys.forEach(key => {
      if (!currentAssigned.has(key)) {
        addPermissionIds.push(key)
      }
    })
    
    // 找出被移除的权限
    rolePermissionStatus.value.assignedPermissions.forEach(id => {
      if (!newAssignedPermissions.has(id)) {
        removePermissionIds.push(id)
      }
    })
    
    return {
      addPermissionIds,
      removePermissionIds
    }
  }
  
  /**
   * 清除状态
   */
  const clearState = () => {
    permissionTree.value = []
    rolePermissionStatus.value = null
    expandedKeys.value = []
    loading.value = false
  }
  
  return {
    // 响应式数据
    loading,
    permissionTree,
    rolePermissionStatus,
    expandedKeys,
    hasPermissionTree,
    
    // 方法
    loadPermissionTree,
    getRolePermissionStatus,
    batchAssignPermissions,
    handlePermissionCheck,
    clearState
  }
}