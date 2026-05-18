/**
 * 前端路由 & 路由分组 API 服务
 * 对接后端 /api/frontend-routes 和 /api/route-groups
 */
import request from '@/utils/request'

// ==================== 类型定义 ====================

export interface FrontendRoute {
  id: string
  path: string
  name: string
  component: string
  title: string
  icon?: string
  sort: number
  parentId?: string
  routeGroupId?: string
  isMenu: boolean
  isEnabled: boolean
  requiredPermission?: string
  description?: string
  meta?: string
  createTime: string
  updateTime?: string
  children?: FrontendRoute[]
  routeGroup?: RouteGroup
  backendRouteCount?: number
}

export interface RouteGroup {
  id: string
  name: string
  code: string
  description?: string
  sort: number
  groupType: number   // 1=前端路由组 2=后端路由组
  isEnabled: boolean
  createTime: string
  updateTime?: string
  parentId?: string
  children?: RouteGroup[]
}

export interface SysRoute {
  id: string
  path: string
  method: string
  description?: string
  routeGroupId?: string
}

export interface CreateFrontendRouteRequest {
  path: string
  name: string
  component: string
  title: string
  icon?: string
  sort: number
  parentId?: string
  routeGroupId?: string
  isMenu: boolean
  isEnabled: boolean
  requiredPermission?: string
  description?: string
  meta?: string
}

export interface UpdateFrontendRouteRequest extends Partial<CreateFrontendRouteRequest> {}

export interface CreateRouteGroupRequest {
  name: string
  code: string
  description?: string
  sort: number
  groupType: number
  isEnabled: boolean
  parentId?: string
}

export interface AssociateBackendRoutesRequest {
  backendRouteIds: string[]
}

// ==================== 前端路由 API ====================

export const FrontendRouteApi = {
  /** 获取所有前端路由（平铺） */
  getAll(): Promise<{ data: FrontendRoute[] }> {
    return request({ url: '/frontend-routes', method: 'GET' })
  },

  /** 获取前端路由分页 */
  getPaged(params: {
    pageIndex: number
    pageSize: number
    keyword?: string
    sortBy?: string
    sortDesc?: boolean
  }): Promise<{ 
    success: boolean
    message: string
    code: number
    timestamp: number
    pageIndex: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasPreviousPage: boolean
    hasNextPage: boolean
    data: FrontendRoute[]
  }> {
    return request({ url: '/frontend-routes/paged', method: 'GET', params })
  },

  /** 获取前端路由树形结构 */
  getTree(): Promise<{ data: FrontendRoute[] }> {
    return request({ url: '/frontend-routes/tree', method: 'GET' })
  },

  /** 获取菜单树（用于动态路由） */
  getMenuTree(permissions?: string): Promise<{ data: FrontendRoute[] }> {
    return request({ url: '/frontend-routes/menu-tree', method: 'GET', params: { permissions } })
  },

  /** 根据 ID 获取路由详情 */
  getById(id: string): Promise<{ data: FrontendRoute }> {
    return request({ url: `/frontend-routes/${id}`, method: 'GET' })
  },

  /** 创建前端路由 */
  create(data: CreateFrontendRouteRequest): Promise<{ data: FrontendRoute }> {
    return request({ url: '/frontend-routes', method: 'POST', data })
  },

  /** 更新前端路由 */
  update(id: string, data: UpdateFrontendRouteRequest): Promise<void> {
    return request({ url: `/frontend-routes/${id}`, method: 'PUT', data })
  },

  /** 删除前端路由 */
  delete(id: string): Promise<void> {
    return request({ url: `/frontend-routes/${id}`, method: 'DELETE' })
  },

  /** 为前端路由关联后端路由 */
  associateBackendRoutes(id: string, data: AssociateBackendRoutesRequest): Promise<void> {
    return request({ url: `/frontend-routes/${id}/backend-routes`, method: 'POST', data })
  }
}

// ==================== 路由分组 API ====================

export const RouteGroupApi = {
  /** 获取所有路由分组 */
  getAll(params?: { groupType?: number; isEnabled?: boolean; keyword?: string }): Promise<{ data: RouteGroup[] }> {
    return request({ url: '/route-groups', method: 'GET', params })
  },

  /** 获取路由分组树 */
  getTree(params?: { groupType?: number; isEnabled?: boolean }): Promise<{ data: RouteGroup[] }> {
    return request({ url: '/route-groups/tree', method: 'GET', params })
  },

  /** 分页获取路由分组 */
  getPaged(params: {
    pageIndex: number
    pageSize: number
    groupType?: number
    isEnabled?: boolean
    keyword?: string
    sortBy?: string
    sortDesc?: boolean
  }): Promise<{ 
    success: boolean
    message: string
    code: number
    timestamp: number
    pageIndex: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasPreviousPage: boolean
    hasNextPage: boolean
    data: RouteGroup[]
  }> {
    return request({ url: '/route-groups/list/paged', method: 'GET', params })
  },

  /** 根据 ID 获取路由分组 */
  getById(id: string): Promise<{ data: RouteGroup }> {
    return request({ url: `/route-groups/${id}`, method: 'GET' })
  },

  /** 创建路由分组 */
  create(data: CreateRouteGroupRequest): Promise<{ data: RouteGroup }> {
    return request({ url: '/route-groups', method: 'POST', data })
  },

  /** 更新路由分组 */
  update(id: string, data: Partial<CreateRouteGroupRequest>): Promise<void> {
    return request({ url: `/route-groups/${id}`, method: 'PUT', data: { id, ...data } })
  },

  /** 删除路由分组 */
  delete(id: string): Promise<void> {
    return request({ url: `/route-groups/${id}`, method: 'DELETE' })
  },

  /** 获取分组下的路由 */
  getRoutes(id: string): Promise<{ data: FrontendRoute[] }> {
    return request({ url: `/route-groups/${id}/routes`, method: 'GET' })
  }
}

// ==================== 后端路由 (SysRoute) API ====================

export const SysRouteApi = {
  /** 获取所有后端路由 */
  getAll(): Promise<{ data: SysRoute[] }> {
    return request({ url: '/routes', method: 'GET' })
  },

  /** 获取启用中的后端路由 */
  getActive(): Promise<{ data: SysRoute[] }> {
    return request({ url: '/routes/active', method: 'GET' })
  }
}