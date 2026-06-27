/** 统一后端响应包裹 */
export interface ApiResponse<T = any> {
  code: number
  message?: string
  data: T
}

/** 分页结构 */
export interface Paginated<T> {
  records: T[]
  total: number
  page: number
  pageSize: number
}

/** 用户 */
export interface User {
  id: string
  username: string
  nickname?: string
  email?: string
  avatar?: string
  status: 0 | 1
  createTime: string
}
