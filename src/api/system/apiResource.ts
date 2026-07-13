// src/api/system/apiResource.ts
import request from '@/utils/request'

const BASE = '/api/identity/ApiResources'

// 分页列表
export function getApiResourcePage(params: Record<string, any>) {
  return request({ url: `${BASE}/page`, method: 'get', params })
}

// 新增
export function createApiResource(data: any) {
  return request({ url: BASE, method: 'post', data })
}

// 更新
export function updateApiResource(data: any) {
  return request({ url: `${BASE}/${data.id}`, method: 'put', data })
}

// 删除
export function deleteApiResource(id: string) {
  return request({ url: `${BASE}/${id}`, method: 'delete' })
}

// 同步 API 资源
export function syncApiResources() {
  return request({ url: `${BASE}/sync`, method: 'post' })
}

// 上报 API 资源
export function reportApiResources() {
  return request({ url: `${BASE}/report`, method: 'post' })
}
