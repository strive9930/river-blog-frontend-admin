// src/api/portal.js
import request from '@/utils/request'

// 获取公开的站点导航
export function getPublicNavigations() {
  return request({ url: '/api/blog/sitenavigations', method: 'get' })
}

// 公开分页获取文章列表
export function getPublicArticles(params) {
  return request({ url: '/api/blog/article/page', method: 'get', params })
}

// 获取文章详情
export function getPublicArticleDetail(id) {
  return request({ url: `/api/blog/article/${id}`, method: 'get' })
}

// 获取文章评论列表
export function getPublicComments(params) {
  return request({ url: '/api/blog/comment/page', method: 'get', params })
}

// 提交评论
export function submitPublicComment(data) {
  return request({ url: '/api/blog/comment', method: 'post', data })
}

// 获取分类 (options 端点)
export function getPublicCategories() {
  return request({ url: '/api/blog/category/options', method: 'get' })
}

// 获取标签 (用 page 端点拉全量)
export function getPublicTags() {
  return request({ url: '/api/blog/tag/page', method: 'get', params: { pageSize: 200 } })
}

// 获取最新评论 (复用 page 端点)
export function getLatestComments(limit = 5) {
  return request({ url: '/api/blog/comment/page', method: 'get', params: { pageIndex: 1, pageSize: limit, status: 'Approved' } })
}

// 获取随机推荐文章
export function getRandomArticles(limit = 5) {
  return request({ url: '/api/blog/article/random', method: 'get', params: { limit } })
}

// 获取友链列表
export function getFriendLinks() {
  return request({ url: '/api/blog/friendlink/page', method: 'get' })
}

// 申请友链
export function applyFriendLink(data) {
  return request({ url: '/api/blog/friendlink', method: 'post', data })
}

// 获取公开留言
export function getPublicMessages(params) {
  return request({ url: '/api/blog/message/page', method: 'get', params })
}

// 提交留言
export function submitPublicMessage(data) {
  return request({ url: '/api/blog/message', method: 'post', data })
}

// 获取公开动态
export function getPublicRecords(params) {
  return request({ url: '/api/blog/record/page', method: 'get', params })
}
