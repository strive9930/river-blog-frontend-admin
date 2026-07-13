import { get, post } from '@/utils/request'
import type { User, Paginated } from '@/types'

const BASE = '/system/user'

/** 分页查询用户列表 */
export function getUserList(params: Record<string, any>) {
  return get<Paginated<User>>(`${BASE}/list`, params)
}

/** 新增用户 */
export function createUser(data: Partial<User>) {
  return post(`${BASE}`, data)
}

/** 更新用户 */
export function updateUser(data: Partial<User>) {
  return post(`${BASE}/update`, data)
}

/** 删除用户 */
export function deleteUser(id: string) {
  return post(`${BASE}/delete`, { id })
}
