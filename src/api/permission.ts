// 权限分配相关的API接口
import request from '../utils/request'
import type { 
  Permission
} from '@/types/permission'

// 权限分配API服务
export const permissionAssignmentApi = {
  // 获取权限分配列表
  getList: () => {
    return request<PermissionAssignment[]>({
      url: '/permissions',
      method: 'GET'
    })
  },

  // 搜索分配目标（用户、角色、部门）
  searchTargets: (keyword: string) => {
    return request<AssignmentTarget[]>({
      url: '/permissions/targets/search',
      method: 'GET',
      params: { keyword }
    })
  },

  // 获取所有权限列表
  getPermissions: () => {
    return request<Permission[]>({
      url: '/permissions',
      method: 'GET'
    })
  },

  // 为目标分配权限
  assignPermissions: (data: AssignPermissionRequest) => {
    return request<boolean>({
      url: '/permissions/assign',
      method: 'POST',
      data
    })
  },

  // 清空目标权限
  clearPermissions: (targetId: string, targetType: string) => {
    return request<boolean>({
      url: '/permissions/clear',
      method: 'DELETE',
      params: { targetId, targetType }
    })
  },

  // 获取目标已分配的权限
  getAssignedPermissions: (targetId: string, targetType: string) => {
    return request<Permission[]>({
      url: '/permissions/assigned',
      method: 'GET',
      params: { targetId, targetType }
    })
  }
}

// 角色权限API服务
export const rolePermissionApi = {
  // 获取角色权限列表
  getList: () => {
    return request<any[]>({
      url: '/roles/permissions',
      method: 'GET'
    })
  },

  // 为角色分配权限
  assignPermissions: (roleId: string, permissionIds: string[]) => {
    return request<boolean>({
      url: `/roles/${roleId}/permissions`,
      method: 'POST',
      data: { permissionIds }
    })
  },

  // 清空角色权限
  clearPermissions: (roleId: string) => {
    return request<boolean>({
      url: `/roles/${roleId}/permissions`,
      method: 'DELETE'
    })
  },

  // 获取角色已分配权限
  getRolePermissions: (roleId: string) => {
    return request<Permission[]>({
      url: `/roles/${roleId}/permissions`,
      method: 'GET'
    })
  }
}

// 用户权限API服务
export const userPermissionApi = {
  // 获取用户权限列表
  getList: () => {
    return request<any[]>({
      url: '/users/permissions',
      method: 'GET'
    })
  },

  // 为用户分配权限
  assignPermissions: (userId: string, permissionIds: string[]) => {
    return request<boolean>({
      url: `/users/${userId}/permissions`,
      method: 'POST',
      data: { permissionIds }
    })
  },

  // 清空用户权限
  clearPermissions: (userId: string) => {
    return request<boolean>({
      url: `/users/${userId}/permissions`,
      method: 'DELETE'
    })
  },

  // 获取用户已分配权限
  getUserPermissions: (userId: string) => {
    return request<Permission[]>({
      url: `/users/${userId}/permissions`,
      method: 'GET'
    })
  }
}

// 部门权限API服务
export const departmentPermissionApi = {
  // 获取部门权限列表
  getList: () => {
    return request<any[]>({
      url: '/departments/permissions',
      method: 'GET'
    })
  },

  // 为部门分配权限
  assignPermissions: (departmentId: string, permissionIds: string[]) => {
    return request<boolean>({
      url: `/departments/${departmentId}/permissions`,
      method: 'POST',
      data: { permissionIds }
    })
  },

  // 清空部门权限
  clearPermissions: (departmentId: string) => {
    return request<boolean>({
      url: `/departments/${departmentId}/permissions`,
      method: 'DELETE'
    })
  }
}

// 基础权限API服务
export const permissionApi = {
  // 获取权限列表
  getList: () => {
    return request<Permission[]>({
      url: '/permissions',
      method: 'GET'
    })
  },

  // 创建权限
  create: (permission: Omit<Permission, 'id' | 'createTime'>) => {
    return request<Permission>({
      url: '/permissions',
      method: 'POST',
      data: permission
    })
  },

  // 更新权限
  update: (id: string, permission: Partial<Permission>) => {
    return request<Permission>({
      url: `/permissions/${id}`,
      method: 'PUT',
      data: permission
    })
  },

  // 删除权限
  delete: (id: string) => {
    return request<boolean>({
      url: `/permissions/${id}`,
      method: 'DELETE'
    })
  },

  // 获取分组权限
  getGrouped: (searchKeyword?: string) => {
    return request<any[]>({
      url: '/permissions/grouped',
      method: 'GET',
      params: { searchKeyword }
    })
  },

  // 搜索权限
  search: (keyword: string, pageSize: number = 20) => {
    return request<Permission[]>({
      url: '/permissions/search',
      method: 'GET',
      params: { keyword, pageSize }
    })
  }
}