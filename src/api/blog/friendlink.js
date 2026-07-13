// src/api/blog/friendlink.js
import request from '@/utils/request'

// 后台：获取所有友链 (含待审核)
export function getFriendLinksAdmin(params) {
  return request({ url: '/api/blog/friendlink/admin/page', method: 'get', params })
}

// 新增友链
export function createFriendLink(data) {
  return request({ url: '/api/blog/friendlink', method: 'post', data })
}

// 修改友链
export function updateFriendLink(id, data) {
  return request({ url: `/api/blog/friendlink/${id}`, method: 'put', data })
}

// 删除友链
export function deleteFriendLink(id) {
  return request({ url: `/api/blog/friendlink/${id}`, method: 'delete' })
}

// 审核友链 (status: 1=Approved, 2=Rejected)
export function auditFriendLink(id, status) {
  return request({ url: `/api/blog/friendlink/${id}/audit`, method: 'put', data: { id, status } })
}

// 切换置顶
export function toggleTopFriendLink(id) {
  return request({ url: `/api/blog/friendlink/${id}/top`, method: 'put' })
}
