// src/api/siteNavigation.js
import request from '@/utils/request' // 您的 axios 实例

// 获取后台导航列表 (调用 admin 专属接口)
export function getSiteNavigations() {
  return request({
    url: '/api/blog/sitenavigations/admin',
    method: 'get'
  })
}

// 新增导航
export function createSiteNavigation(data) {
  return request({
    url: '/api/blog/sitenavigations',
    method: 'post',
    data
  })
}

// 更新导航
export function updateSiteNavigation(id, data) {
  return request({
    url: `/api/blog/sitenavigations/${id}`,
    method: 'put',
    data
  })
}

// 删除导航
export function deleteSiteNavigation(id) {
  return request({
    url: `/api/blog/sitenavigations/${id}`,
    method: 'delete'
  })
}