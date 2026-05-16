import request from '../utils/request'
import type { ApiResponse, PageResponse } from './types'

// 权限相关的类型定义
export interface Permission {
  id: string
  name: string
  code: string
  description?: string
  group: string
  claimType?: string
  claimValue?: string
  isEnabled: boolean
  CreateTime: string
  UpdateTime?: string
}

export interface PermissionDetail extends Permission {
  assignedRoles: RoleInfo[]
  assignedUsers: UserInfo[]
}

export interface RoleInfo {
  id: string
  name: string
  description?: string
}

export interface UserInfo {
  id: string
  userName: string
  email?: string
}

export interface PermissionGroup {
  name: string
  code: string
  description?: string
  permissionCount: number
  CreateTime: string
}

export interface CreatePermissionRequest {
  name: string
  code: string
  description?: string
  group: string
  claimType?: string
  claimValue?: string
}

export interface UpdatePermissionRequest extends CreatePermissionRequest {
  id: string
}

export interface BatchPermissionOperation {
  permissionIds: string[]
  isEnabled: boolean
}

export interface ImportPermission {
  name: string
  code: string
  description?: string
  group: string
  claimType?: string
  claimValue?: string
}

export interface ImportPermissionsRequest {
  permissions: ImportPermission[]
}

export interface PermissionStatistics {
  totalPermissions: number
  totalRoles: number
  totalUsers: number
  permissionsByGroup: Record<string, number>
  rolesPermissionCount: Record<string, number>
  lastUpdated: string
}

export interface PermissionPageParams {
  pageIndex: number
  pageSize: number
  group?: string
  enabled?: boolean
  keyword?: string
}

// 权限服务类
export class PermissionService {
  private static readonly BASE_URL = '/permissions'

  /**
   * 获取权限列表
   */
  static async getList(params?: {
    group?: string
    enabled?: boolean
    keyword?: string
  }): Promise<ApiResponse<Permission[]>> {
    return request({
      url: this.BASE_URL,
      method: 'GET',
      params
    })
  }

  /**
   * 分页获取权限列表
   */
  static async getPagedList(params: PermissionPageParams): Promise<ApiResponse<PageResponse<Permission[]>>> {
    return request({
      url: `${this.BASE_URL}/paged`,
      method: 'GET',
      params
    })
  }

  /**
   * 根据ID获取权限详情
   */
  static async getById(id: string): Promise<ApiResponse<PermissionDetail>> {
    return request({
      url: `${this.BASE_URL}/${id}`,
      method: 'GET'
    })
  }

  /**
   * 创建权限
   */
  static async create(data: CreatePermissionRequest): Promise<ApiResponse<Permission>> {
    return request({
      url: this.BASE_URL,
      method: 'POST',
      data
    })
  }

  /**
   * 更新权限
   */
  static async update(id: string, data: UpdatePermissionRequest): Promise<ApiResponse<Permission>> {
    return request({
      url: `${this.BASE_URL}/${id}`,
      method: 'PUT',
      data
    })
  }

  /**
   * 删除权限
   */
  static async delete(id: string): Promise<ApiResponse<string>> {
    return request({
      url: `${this.BASE_URL}/${id}`,
      method: 'DELETE'
    })
  }

  /**
   * 批量更新权限状态
   */
  static async batchUpdateStatus(data: BatchPermissionOperation): Promise<ApiResponse<string>> {
    return request({
      url: `${this.BASE_URL}/batch/status`,
      method: 'PUT',
      data
    })
  }

  /**
   * 启用权限
   */
  static async enable(id: string): Promise<ApiResponse<string>> {
    return request({
      url: `${this.BASE_URL}/${id}/enable`,
      method: 'PUT'
    })
  }

  /**
   * 禁用权限
   */
  static async disable(id: string): Promise<ApiResponse<string>> {
    return request({
      url: `${this.BASE_URL}/${id}/disable`,
      method: 'PUT'
    })
  }

  /**
   * 获取权限分组
   */
  static async getGroups(): Promise<ApiResponse<PermissionGroup[]>> {
    return request({
      url: `${this.BASE_URL}/groups`,
      method: 'GET'
    })
  }

  /**
   * 创建权限分组
   */
  static async createGroup(data: {
    name: string
    code: string
    description?: string
  }): Promise<ApiResponse<PermissionGroup>> {
    return request({
      url: `${this.BASE_URL}/groups`,
      method: 'POST',
      data
    })
  }

  /**
   * 导出权限
   */
  static async export(group?: string): Promise<Blob> {
    const response = await fetch(`${this.BASE_URL}/export${group ? `?group=${group}` : ''}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    return response.blob()
  }

  /**
   * 导入权限
   */
  static async import(data: ImportPermissionsRequest): Promise<ApiResponse<string>> {
    return request({
      url: `${this.BASE_URL}/import`,
      method: 'POST',
      data
    })
  }

  /**
   * 搜索权限
   */
  static async search(keyword: string, pageSize: number = 20): Promise<ApiResponse<Permission[]>> {
    return request({
      url: `${this.BASE_URL}/search`,
      method: 'GET',
      params: { keyword, pageSize }
    })
  }

  /**
   * 获取权限统计信息
   */
  static async getStatistics(): Promise<ApiResponse<PermissionStatistics>> {
    return request({
      url: `${this.BASE_URL}/statistics`,
      method: 'GET'
    })
  }
}

// 角色相关的类型定义
export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  isEnabled: boolean;
  userCount: number;
  permissionCount: number;
  CreateTime: string;
  UpdateTime?: string;
}

export interface RolePageParams {
  pageIndex: number;
  pageSize: number;
  keyword?: string;
  status?: string;
}

// 角色API服务
export class RoleService {
  private static readonly BASE_URL = '/roles'

  /**
   * 获取角色列表
   */
  static async getList(): Promise<ApiResponse<any[]>> {
    return request({
      url: this.BASE_URL,
      method: 'GET'
    })
  }

  /**
   * 分页获取角色列表
   */
  static async getPagedList(params: RolePageParams): Promise<ApiResponse<PageResponse<Role[]>>> {
    return request({
      url: `${this.BASE_URL}/paged`,
      method: 'GET',
      params
    })
  }

  /**
   * 获取角色详情
   */
  static async getById(id: string): Promise<ApiResponse<any>> {
    return request({
      url: `${this.BASE_URL}/${id}`,
      method: 'GET'
    })
  }

  /**
   * 创建角色
   */
  static async create(data: any): Promise<ApiResponse<any>> {
    return request({
      url: this.BASE_URL,
      method: 'POST',
      data
    })
  }

  /**
   * 更新角色
   */
  static async update(id: string, data: any): Promise<ApiResponse<any>> {
    return request({
      url: `${this.BASE_URL}/${id}`,
      method: 'PUT',
      data
    })
  }

  /**
   * 删除角色
   */
  static async delete(id: string): Promise<ApiResponse<void>> {
    return request({
      url: `${this.BASE_URL}/${id}`,
      method: 'DELETE'
    })
  }

  /**
   * 为角色分配权限
   */
  static async assignPermissions(roleId: string, permissionIds: string[]): Promise<ApiResponse<boolean>> {
    return request({
      url: `${this.BASE_URL}/${roleId}/permissions`,
      method: 'POST',
      data: { permissionIds }
    })
  }

  /**
   * 清空角色权限
   */
  static async clearPermissions(roleId: string): Promise<ApiResponse<boolean>> {
    return request({
      url: `${this.BASE_URL}/${roleId}/permissions`,
      method: 'DELETE'
    })
  }
}

// 用户API服务
export class UserService {
  private static readonly BASE_URL = '/users'

  /**
   * 获取用户列表
   */
  static async getList(): Promise<ApiResponse<any[]>> {
    return request({
      url: this.BASE_URL,
      method: 'GET'
    })
  }

  /**
   * 分页获取用户列表
   */
  static async getPagedList(params: {
    pageIndex: number,
    pageSize: number,
    keyword?: string,
    status?: string
  }): Promise<ApiResponse<PageResponse<any[]>>> {
    return request({
      url: `${this.BASE_URL}/paged`,
      method: 'GET',
      params
    })
  }

  /**
   * 获取用户详情
   */
  static async getById(id: string): Promise<ApiResponse<any>> {
    return request({
      url: `${this.BASE_URL}/${id}`,
      method: 'GET'
    })
  }

  /**
   * 创建用户
   */
  static async create(data: any): Promise<ApiResponse<any>> {
    return request({
      url: this.BASE_URL,
      method: 'POST',
      data
    })
  }

  /**
   * 更新用户
   */
  static async update(id: string, data: any): Promise<ApiResponse<any>> {
    return request({
      url: `${this.BASE_URL}/${id}`,
      method: 'PUT',
      data
    })
  }

  /**
   * 删除用户
   */
  static async delete(id: string): Promise<ApiResponse<void>> {
    return request({
      url: `${this.BASE_URL}/${id}`,
      method: 'DELETE'
    })
  }

  /**
   * 为用户分配角色
   */
  static async assignRoles(userId: string, roleIds: string[]): Promise<ApiResponse<boolean>> {
    return request({
      url: `${this.BASE_URL}/${userId}/roles`,
      method: 'POST',
      data: { roleIds }
    })
  }

  /**
   * 获取用户角色
   */
  static async getUserRoles(userId: string): Promise<ApiResponse<any[]>> {
    return request({
      url: `${this.BASE_URL}/${userId}/roles`,
      method: 'GET'
    })
  }

  /**
   * 获取用户权限
   */
  static async getUserPermissions(userId: string): Promise<ApiResponse<Permission[]>> {
    return PermissionService.getUserPermissions(userId)
  }
}

// 导出默认实例
export default {
  permission: PermissionService,
  role: RoleService,
  user: UserService
}