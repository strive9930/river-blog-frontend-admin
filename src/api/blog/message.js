// src/api/blog/message.js
import request from '@/utils/request'

// 后台：获取所有留言
export function getMessagesAdmin(params) {
  return request({ url: '/api/blog/message/admin', method: 'get', params })
}

// 审核留言
export function auditMessage(id, status) {
  return request({ url: `/api/blog/message/${id}/audit`, method: 'put', data: { id, status } })
}

// 删除留言
export function deleteMessage(id) {
  return request({ url: `/api/blog/message/${id}`, method: 'delete' })
}
