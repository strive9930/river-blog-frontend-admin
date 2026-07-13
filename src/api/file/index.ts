import request from '@/utils/request'

const BASE = '/api/v1/files/api/file'

/** 上传图片（返回 URL 字符串） */
export function uploadImage(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  return request({ url: `${BASE}/upload-image`, method: 'post', data: fd })
}

/** 上传通用文件（返回文件 ID） */
export function uploadFile(file: File, options?: { directoryId?: string; description?: string }) {
  const fd = new FormData()
  fd.append('file', file)
  if (options?.directoryId) fd.append('DirectoryId', options.directoryId)
  if (options?.description) fd.append('Description', options.description)
  return request({ url: `${BASE}/upload`, method: 'post', data: fd })
}

/** 获取文件列表（分页） */
export function getFileList(params: {
  pageIndex?: number
  pageSize?: number
  keyword?: string
  contentType?: string
  directoryId?: string
  tagId?: string
}) {
  return request({ url: `${BASE}/list`, method: 'get', params })
}

/** 获取文件详情 */
export function getFile(id: string) {
  return request({ url: `${BASE}/${id}`, method: 'get' })
}

/** 删除文件 */
export function deleteFile(id: string) {
  return request({ url: `${BASE}/${id}`, method: 'delete' })
}
