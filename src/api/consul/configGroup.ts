import request from '@/utils/request'

const BASE = '/api/consul/configgroup'

/** 获取所有配置组 */
export function getConfigGroups(env: string = 'dev') {
  return request({ url: BASE, method: 'get', params: { env } })
}

/** 获取配置组详情（含配置项） */
export function getConfigGroupDetail(groupName: string, env: string = 'dev') {
  return request({ url: `${BASE}/${groupName}`, method: 'get', params: { env } })
}

/** 创建配置组 */
export function createConfigGroup(data: {
  groupName: string
  environment: string
  scope: number
  serviceName?: string
  description?: string
  keyPrefixes?: string[]
}) {
  return request({ url: BASE, method: 'post', data })
}

/** 更新配置组 */
export function updateConfigGroup(groupName: string, data: {
  groupName: string
  environment: string
  description?: string
  keyPrefixes?: string[]
}) {
  return request({ url: `${BASE}/${groupName}`, method: 'put', data })
}

/** 删除配置组 */
export function deleteConfigGroup(groupName: string, env: string = 'dev') {
  return request({ url: `${BASE}/${groupName}`, method: 'delete', params: { env } })
}
