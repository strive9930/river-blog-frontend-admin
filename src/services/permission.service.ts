/**
 * 权限管理服务
 * 提供权限相关的API调用封装
 */

import { http } from '@/utils'
import type { ApiResponse } from '@/types'

export class PermissionService {
  /**
   * 获取权限列表
   */
  static async getList(params?: {
    page?: number
    pageSize?: number
    keyword?: string
  }): Promise<ApiResponse<any>> {
    try {
      const response = await http.get('/permissions', { params })
      return response
    } catch (error: any) {
      console.error('获取权限列表失败:', error)
      return {
        success: false,
        message: error.response?.message || '获取权限列表失败',
        data: null  
      }
    }
  }

  /**
   * 获取权限详情
   */
  static async getById(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await http.get(`/permissions/${id}`)
      return response.data
    } catch (error: any) {
      console.error('获取权限详情失败:', error)
      return {
        success: false,
        message: error.response?.data?.message || '获取权限详情失败',
        data: null
      }
    }
  }

  /**
   * 创建权限
   */
  static async create(data: any): Promise<ApiResponse<any>> {
    try {
      const response = await http.post('/permissions', data)
      return response.data
    } catch (error: any) {
      console.error('创建权限失败:', error)
      return {
        success: false,
        message: error.response?.data?.message || '创建权限失败',
        data: null
      }
    }
  }

  /**
   * 更新权限
   */
  static async update(id: string, data: any): Promise<ApiResponse<any>> {
    try {
      const response = await http.put(`/permissions/${id}`, data)
      return response.data
    } catch (error: any) {
      console.error('更新权限失败:', error)
      return {
        success: false,
        message: error.response?.data?.message || '更新权限失败',
        data: null
      }
    }
  }

  /**
   * 删除权限
   */
  static async delete(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await http.delete(`/permissions/${id}`)
      return response.data
    } catch (error: any) {
      console.error('删除权限失败:', error)
      return {
        success: false,
        message: error.response?.data?.message || '删除权限失败',
        data: null
      }
    }
  }

  /**
   * 搜索权限
   */
  static async search(keyword: string, pageSize: number = 20): Promise<ApiResponse<any>> {
    try {
      const params = { keyword, pageSize }
      const response = await http.get('/permissions/search', { params })
      return response.data
    } catch (error: any) {
      console.error('搜索权限失败:', error)
      return {
        success: false,
        message: error.response?.data?.message || '搜索权限失败',
        data: null
      }
    }
  }

  /**
   * 获取权限统计信息
   */
  static async getStatistics(): Promise<ApiResponse<any>> {
    try {
      const response = await http.get('/permission/statistics')
      return response.data
    } catch (error: any) {
      console.error('获取权限统计信息失败:', error)
      return {
        success: false,
        message: error.response?.data?.message || '获取权限统计信息失败',
        data: null
      }
    }
  }

  /**
   * 获取分组权限数据
   */
  static async getGroupedPermissions(searchKeyword?: string): Promise<ApiResponse<any>> {
    try {
      const params = searchKeyword ? { searchKeyword } : {}
      const response = await http.get('/permissions/grouped', { params })
      return response.data
    } catch (error: any) {
      console.error('获取分组权限数据失败:', error)
      return {
        success: false,
        message: error.response?.data?.message || '获取分组权限数据失败',
        data: null
      }
    }
  }

  /**
   * 获取角色权限状态
   */
  static async getRolePermissionStatus(roleId: string): Promise<ApiResponse<any>> {
    try {
      const response = await http.get(`/permissions/roles/${roleId}/permission-status`)
      return response
    } catch (error: any) {
      console.error('获取角色权限状态失败:', error)
      return {
        success: false,
        message: error.response?.message || '获取角色权限状态失败',
        data: null
      }
    }
  }

  /**
   * 批量分配权限给角色
   */
  static async batchAssignPermissions(
    roleId: string,
    addPermissionIds: string[],
    removePermissionIds: string[]
  ): Promise<ApiResponse<any>> {
    try {
      const requestData = {
        addPermissionIds,
        removePermissionIds
      }
      const response = await http.post(
        `/permissions/roles/${roleId}/permissions/batch`,
        requestData
      )
      return response
    } catch (error: any) {
      console.error('批量分配权限失败:', error)
      return {
        success: false,
        message: error.response?.message || '批量分配权限失败',
        data: null
      }
    }
  }
}