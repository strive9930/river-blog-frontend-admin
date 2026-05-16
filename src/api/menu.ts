import request from '@/utils/request'
import type { ApiResponse } from './types'

// 菜单相关接口定义
export interface Menu {
  id: string
  name: string
  title: string
  path?: string
  icon?: string
  sort: number
  parentId?: string
  menuType: number
  menuGroupId?: string
  requiredPermission?: string
  description?: string
  isEnabled: boolean
  isVisible: boolean
  createTime: string
  updateTime?: string
  menuGroup?: {
    id: string
    name: string
    code: string
  }
  children?: Menu[]
}

export interface MenuGroup {
  id: string
  name: string
  code: string
  description?: string
  sort: number
  createTime: string
  updateTime?: string
}

export interface CreateMenuRequest {
  name: string
  title: string
  path?: string
  icon?: string
  sort: number
  parentId?: string
  menuType: number
  menuGroupId?: string
  requiredPermission?: string
  description?: string
  isEnabled: boolean
  isVisible: boolean
}

export interface UpdateMenuRequest extends Partial<CreateMenuRequest> {
  id: string
}

export interface UpdateMenuGroupRequest {
  name?: string;
  code?: string;
  description?: string;
  sort?: number;
  isEnabled?: boolean;
}

export interface MenuSearchParams {
  menuGroupId?: string
  menuType?: number
  isEnabled?: boolean
  isVisible?: boolean
  keyword?: string
}

export interface UpdateMenuSortRequest {
  menuIds: string[]
}

export interface BatchDeleteRequest {
  ids: string[]
}

export interface BatchUpdateStatusRequest {
  ids: string[]
  isEnabled: boolean
}

// 菜单管理 API 服务
export class MenuApiService {
  /**
   * 获取菜单列表
   */
  static async getMenus(params?: MenuSearchParams): Promise<ApiResponse<Menu[]>> {
    return request({
      url: '/menus',
      method: 'GET',
      params
    })
  }

  /**
   * 分页获取菜单列表
   */
  static async getPagedList(params: {
    pageIndex: number,
    pageSize: number,
    menuGroupId?: string,
    menuType?: number,
    isEnabled?: boolean,
    isVisible?: boolean,
    keyword?: string
  }): Promise<ApiResponse<PageResponse<MenuGroup[]>>> {
    return request({
      url: '/menus/paged',
      method: 'GET',
      params
    })
  }

  /**
   * 获取菜单树结构
   */
  static async getMenuTree(): Promise<ApiResponse<Menu[]>> {
    return request({
      url: '/menus/tree',
      method: 'GET'
    })
  }

  /**
   * 获取菜单详情
   */
  static async getMenu(id: string): Promise<ApiResponse<Menu>> {
    return request({
      url: `/menus/${id}`,
      method: 'GET'
    })
  }

  /**
   * 创建菜单
   */
  static async createMenu(data: CreateMenuRequest): Promise<ApiResponse<Menu>> {
    return request({
      url: '/menus',
      method: 'POST',
      data
    })
  }

  /**
   * 更新菜单
   */
  static async updateMenu(id: string, data: UpdateMenuRequest): Promise<ApiResponse<void>> {
    return request({
      url: `/menus/${id}`,
      method: 'PUT',
      data
    })
  }

  /**
   * 删除菜单
   */
  static async deleteMenu(id: string): Promise<ApiResponse<void>> {
    return request({
      url: `/menus/${id}`,
      method: 'DELETE'
    })
  }

  /**
   * 更新菜单排序
   */
  static async updateMenuSort(data: UpdateMenuSortRequest): Promise<ApiResponse<void>> {
    return request({
      url: '/menus/sort',
      method: 'PUT',
      data
    })
  }

  /**
   * 批量删除菜单
   */
  static async batchDeleteMenus(data: BatchDeleteRequest): Promise<ApiResponse<void>> {
    return request({
      url: '/menus/batch',
      method: 'DELETE',
      data
    })
  }

  /**
   * 批量更新菜单状态
   */
  static async batchUpdateMenuStatus(data: BatchUpdateStatusRequest): Promise<ApiResponse<void>> {
    return request({
      url: '/menus/batch/status',
      method: 'PUT',
      data
    })
  }

  /**
   * 获取菜单组列表
   */
  static async getMenuGroups(): Promise<ApiResponse<PageResponse<MenuGroup[]>>> {
    return request({
      url: '/menus/groups',
      method: 'GET'
    })
  }
/**
   * 分页获取菜单组列表
   */
  static async getMenuGroupPagedList(params: {
    pageIndex: number,
    pageSize: number,
    isEnabled?: boolean,
    isVisible?: boolean,
  }): Promise<ApiResponse<PageResponse<Menu[]>>> {
    return request({
      url: '/menus/groups/paged',
      method: 'GET',
      params
    })
  }
  /**
   * 创建菜单组
   */
  static async createMenuGroup(data: Omit<MenuGroup, 'id' | 'createTime' | 'updateTime'>): Promise<ApiResponse<MenuGroup>> {
    return request({
      url: '/menus/groups',
      method: 'POST',
      data
    })
  }

  /**
   * 更新菜单组 - 支持Name和Code字段
   */
  static async updateMenuGroup(id: string, data: UpdateMenuGroupRequest): Promise<ApiResponse<void>> {
    return request({
      url: `/menus/groups/${id}`,
      method: 'PUT',
      data
    })
  }

  /**
   * 删除菜单组
   */
  static async deleteMenuGroup(id: string): Promise<ApiResponse<void>> {
    return request({
      url: `/menus/groups/${id}`,
      method: 'DELETE'
    })
  }
}

// 导出默认实例
export default MenuApiService