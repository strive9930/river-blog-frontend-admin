// 通用API响应类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  code: number;
  timestamp: number;
  data: T;
  // 分页字段（可选，仅在分页接口中存在）
  pageIndex?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
  errors?: any;
}

// 分页响应数据类型（嵌套在data中的格式，目前已不使用）
export interface PageResponse<T> {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  data: T; // 实际的数据列表
}