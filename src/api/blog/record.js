// src/api/blog/record.js
import request from '@/utils/request'

// 后台：获取所有动态
export function getRecordsAdmin(params) {
  return request({ url: '/api/blog/record/admin/page', method: 'get', params })
}

// 发布动态
export function createRecord(data) {
  return request({ url: '/api/blog/record', method: 'post', data })
}

// 编辑动态
export function updateRecord(id, data) {
  return request({ url: `/api/blog/record/${id}`, method: 'put', data })
}

// 删除动态
export function deleteRecord(id) {
  return request({ url: `/api/blog/record/${id}`, method: 'delete' })
}
