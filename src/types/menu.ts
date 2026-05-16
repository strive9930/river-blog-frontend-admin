// 菜单分组类型定义
export interface MenuGroup {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  icon?: string | null;
  sort: number;
  isEnabled: boolean;
  parentId?: string | null;
  groupType: number; // 1表示前端路由分组，2表示后端路由分组，3表示系统分组
  requiredPermission?: string | null;
  createTime: string; // ISO日期字符串
  updateTime?: string | null;
  parent?: MenuGroup | null;
  children: MenuGroup[];
  frontendRouteCount: number;
  backendRouteCount: number;
}

// 菜单分组分页响应类型
export interface MenuGroupPageResponse {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  data: MenuGroup[];
  success: boolean;
  message: string;
  code: number;
  timestamp: number;
  errors: any;
}