import request from '@/utils/request'

const BASE = '/api/consul/config'

/** 按 key 获取配置项 */
export function getConfigByKey(key: string, env: string = 'dev') {
  return request({ url: BASE, method: 'get', params: { key, env } })
}

/** 按前缀列出配置项 */
export function getConfigByPrefix(prefix: string, env: string = 'dev') {
  return request({ url: `${BASE}/prefix`, method: 'get', params: { prefix, env } })
}

/** 聚合获取服务的全部配置（common + service-specific） */
export function getConfigForService(serviceName: string, env: string = 'dev') {
  return request({ url: `${BASE}/service/${serviceName}`, method: 'get', params: { env } })
}

/** 获取纯值（无元数据） */
export function getRawValue(key: string, env: string = 'dev') {
  return request({ url: `${BASE}/raw`, method: 'get', params: { key, env } })
}

/** 创建配置项 */
export function createConfig(data: {
  key: string
  value: string
  valueType: number
  environment: string
  scope: number
  serviceName?: string
  description?: string
}) {
  return request({ url: BASE, method: 'post', data })
}

/** 更新配置项 */
export function updateConfig(data: {
  key: string
  value: string
  environment: string
  valueType?: number
  description?: string
}) {
  return request({ url: BASE, method: 'put', data })
}

/** 删除配置项 */
export function deleteConfig(key: string, env: string = 'dev') {
  return request({ url: BASE, method: 'delete', params: { key, env } })
}

/** 批量删除配置项 */
export function batchDeleteConfig(keys: string[], environment: string = 'dev') {
  return request({ url: `${BASE}/batch-delete`, method: 'post', data: { keys, environment } })
}

/** 获取所有环境列表 */
export function getEnvironments() {
  return request({ url: '/api/consul/environment', method: 'get' })
}
