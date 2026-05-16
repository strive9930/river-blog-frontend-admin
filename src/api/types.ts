// 通用API响应类型定义
export interface ApiResponse<T = any> {
  totalCount: number;
  data: T;
  success: boolean;
  message: string;
  code: number;
  timestamp: number;
  errors?: any;
}

// 分页响应数据类型
export interface PageResponse<T> {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  data: T; // 实际的数据列表
  success: boolean;
  message: string;
  code: number;
  timestamp: number;
  errors: any;
}