// 权限相关类型定义

export interface Permission {
  id: string
  name: string
  code: string
  description?: string
  group: string
  claimType?: string
  claimValue?: string
  isEnabled: boolean
  createTime: string
  updateTime?: string
}

export interface PermissionGroup {
  groupName: string
  permissions: Permission[]
}

export interface RolePermission {
  roleId: string
  roleName: string
  permissions: Permission[]
  permissionCount: number
  lastModified: string
}

export interface UserPermission {
  userId: string
  username: string
  permissions: Permission[]
  permissionCount: number
  lastModified: string
}

export interface PermissionAssignmentRequest {
  targetId: string
  targetType: 'role' | 'user'
  permissionIds: string[]
}

export interface PermissionStats {
  total: number
  groups: number
  assigned: number
  unused: number
}

export interface PermissionActivity {
  id: number
  type: 'create' | 'update' | 'delete' | 'assign' | 'revoke'
  title: string
  description: string
  operator: string
  target: string
  timestamp: string
}

// 权限分组查询响应
export interface GroupedPermissionsResponse {
  success: boolean
  data: PermissionGroup[]
  message?: string
}

// 权限状态查询响应
export interface PermissionStatusResponse {
  success: boolean
  data: {
    roleId: string
    roleName: string
    assignedPermissionIds: string[]
    totalPermissions: number
    assignedPermissions: number
  }
  message?: string
}

// 批量权限分配请求
export interface BatchAssignPermissionsRequest {
  addPermissionIds: string[]
  removePermissionIds: string[]
}

// 权限冲突检测结果
export interface PermissionConflict {
  permissionId: string
  permissionName: string
  conflictReason: string
  conflictSource: string
  conflictType: 'duplicate' | 'inheritance' | 'mutual_exclusion'
}

export interface ConflictDetectionResult {
  hasConflicts: boolean
  conflicts: PermissionConflict[]
  resolutionSuggestions: string[]
}

// 权限继承链
export interface PermissionInheritanceChain {
  roleId: string
  roleName: string
  level: number
  parentRoleId?: string
  inheritanceType: 'direct' | 'inherited'
  permissionCount: number
}

// 补充缺失的类型定义
export interface PermissionAssignment {
  id: string
  targetId: string
  targetType: 'role' | 'user' | 'department'
  permissionId: string
  assignedAt: string
  assignedBy: string
}

export interface AssignmentTarget {
  id: string
  name: string
  type: 'role' | 'user' | 'department'
}

export interface AssignPermissionRequest {
  targetId: string
  targetType: 'role' | 'user' | 'department'
  permissionIds: string[]
}