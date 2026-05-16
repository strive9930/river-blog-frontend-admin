/**
 * 用户体验服务统一导出
 * 集中管理所有前端体验优化服务
 */

// 加载状态服务
export { loadingService, useLoading } from './loadingService'

// 缓存管理服务
export { cacheService, useCache } from './cacheService'

// 消息反馈服务
export { feedbackService, useFeedback } from './feedbackService'

// 权限管理服务
export { PermissionService, RoleService } from '@/api/permissionService'

// 类型定义
export type { CacheOptions } from './cacheService'