import { ref, computed } from 'vue'

// 缓存项接口
interface CacheItem<T> {
  data: T
  timestamp: number
  expireTime?: number
  tags: string[]
}

// LRU缓存节点
class LRUNode<T> {
  key: string
  value: CacheItem<T>
  prev: LRUNode<T> | null
  next: LRUNode<T> | null

  constructor(key: string, value: CacheItem<T>) {
    this.key = key
    this.value = value
    this.prev = null
    this.next = null
  }
}

// LRU缓存类
class LRUCache<T> {
  private capacity: number
  private cache: Map<string, LRUNode<T>>
  private head: LRUNode<T> | null
  private tail: LRUNode<T> | null

  constructor(capacity: number = 100) {
    this.capacity = capacity
    this.cache = new Map()
    this.head = null
    this.tail = null
  }

  // 获取数据
  get(key: string): T | null {
    const node = this.cache.get(key)
    if (!node) return null

    // 检查是否过期
    if (node.value.expireTime && Date.now() > node.value.expireTime) {
      this.remove(key)
      return null
    }

    // 移动到头部（最近使用）
    this.moveToHead(node)
    return node.value.data
  }

  // 设置数据
  set(key: string, data: T, expireTime?: number, tags: string[] = []): void {
    const existingNode = this.cache.get(key)
    
    if (existingNode) {
      // 更新现有节点
      existingNode.value.data = data
      existingNode.value.timestamp = Date.now()
      existingNode.value.expireTime = expireTime
      existingNode.value.tags = tags
      this.moveToHead(existingNode)
    } else {
      // 创建新节点
      const newNode = new LRUNode(key, {
        data,
        timestamp: Date.now(),
        expireTime,
        tags
      })

      // 检查容量
      if (this.cache.size >= this.capacity) {
        this.removeTail()
      }

      this.addToHead(newNode)
      this.cache.set(key, newNode)
    }
  }

  // 删除数据
  remove(key: string): boolean {
    const node = this.cache.get(key)
    if (!node) return false

    this.removeFromList(node)
    this.cache.delete(key)
    return true
  }

  // 根据标签清除
  clearByTags(tags: string[]): void {
    for (const [key, node] of this.cache) {
      if (node.value.tags.some(tag => tags.includes(tag))) {
        this.remove(key)
      }
    }
  }

  // 清除过期数据
  clearExpired(): void {
    const now = Date.now()
    for (const [key, node] of this.cache) {
      if (node.value.expireTime && now > node.value.expireTime) {
        this.remove(key)
      }
    }
  }

  // 清空所有数据
  clearAll(): void {
    this.cache.clear()
    this.head = null
    this.tail = null
  }

  // 移动节点到头部
  private moveToHead(node: LRUNode<T>): void {
    this.removeFromList(node)
    this.addToHead(node)
  }

  // 添加节点到头部
  private addToHead(node: LRUNode<T>): void {
    node.prev = null
    node.next = this.head

    if (this.head) {
      this.head.prev = node
    }
    this.head = node

    if (!this.tail) {
      this.tail = node
    }
  }

  // 从链表中移除节点
  private removeFromList(node: LRUNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next
    } else {
      this.head = node.next
    }

    if (node.next) {
      node.next.prev = node.prev
    } else {
      this.tail = node.prev
    }
  }

  // 移除尾部节点
  private removeTail(): void {
    if (this.tail) {
      this.cache.delete(this.tail.key)
      this.tail = this.tail.prev
      if (this.tail) {
        this.tail.next = null
      } else {
        this.head = null
      }
    }
  }
}

// 权限缓存服务
class PermissionCacheService {
  private lruCache: LRUCache<any>
  private defaultExpireTime: number

  constructor(capacity: number = 100, defaultExpireMinutes: number = 30) {
    this.lruCache = new LRUCache(capacity)
    this.defaultExpireTime = defaultExpireMinutes * 60 * 1000
  }

  // 缓存权限列表
  cachePermissions(permissions: any[], expireMinutes?: number): void {
    const expireTime = expireMinutes 
      ? Date.now() + expireMinutes * 60 * 1000 
      : Date.now() + this.defaultExpireTime
    
    this.lruCache.set('permissions:list', permissions, expireTime, ['permissions'])
  }

  // 获取缓存的权限列表
  getCachedPermissions(): any[] | null {
    return this.lruCache.get('permissions:list')
  }

  // 缓存角色权限
  cacheRolePermissions(roleId: string, permissions: any[], expireMinutes?: number): void {
    const expireTime = expireMinutes 
      ? Date.now() + expireMinutes * 60 * 1000 
      : Date.now() + this.defaultExpireTime
    
    this.lruCache.set(`role:${roleId}:permissions`, permissions, expireTime, ['role-permissions', `role:${roleId}`])
  }

  // 获取缓存的角色权限
  getCachedRolePermissions(roleId: string): any[] | null {
    return this.lruCache.get(`role:${roleId}:permissions`)
  }

  // 缓存用户权限
  cacheUserPermissions(userId: string, permissions: any[], expireMinutes?: number): void {
    const expireTime = expireMinutes 
      ? Date.now() + expireMinutes * 60 * 1000 
      : Date.now() + this.defaultExpireTime
    
    this.lruCache.set(`user:${userId}:permissions`, permissions, expireTime, ['user-permissions', `user:${userId}`])
  }

  // 获取缓存的用户权限
  getCachedUserPermissions(userId: string): any[] | null {
    return this.lruCache.get(`user:${userId}:permissions`)
  }

  // 缓存权限分组
  cachePermissionGroups(groups: any[], expireMinutes?: number): void {
    const expireTime = expireMinutes 
      ? Date.now() + expireMinutes * 60 * 1000 
      : Date.now() + this.defaultExpireTime
    
    this.lruCache.set('permissions:groups', groups, expireTime, ['permission-groups'])
  }

  // 获取缓存的权限分组
  getCachedPermissionGroups(): any[] | null {
    return this.lruCache.get('permissions:groups')
  }

  // 清除特定角色的权限缓存
  clearRolePermissionCache(roleId: string): void {
    this.lruCache.remove(`role:${roleId}:permissions`)
  }

  // 清除特定用户的权限缓存
  clearUserPermissionCache(userId: string): void {
    this.lruCache.remove(`user:${userId}:permissions`)
  }

  // 清除所有权限相关缓存
  clearAllPermissionCache(): void {
    this.lruCache.clearByTags(['permissions', 'role-permissions', 'user-permissions', 'permission-groups'])
  }

  // 清除过期缓存
  clearExpiredCache(): void {
    this.lruCache.clearExpired()
  }

  // 获取缓存统计信息
  getCacheStats(): { size: number; capacity: number } {
    // 注意：这里需要在LRUCache中添加getSize方法
    return {
      size: 0, // 需要实现
      capacity: this.lruCache['capacity']
    }
  }
}

// 创建全局权限缓存服务实例
export const permissionCacheService = new PermissionCacheService(200, 30)

// 组合式API钩子
export const usePermissionCache = () => {
  const cacheStats = ref({ size: 0, capacity: 200 })

  const refreshCacheStats = () => {
    cacheStats.value = permissionCacheService.getCacheStats()
  }

  const clearAllCache = () => {
    permissionCacheService.clearAllPermissionCache()
    refreshCacheStats()
  }

  const clearExpiredCache = () => {
    permissionCacheService.clearExpiredCache()
    refreshCacheStats()
  }

  return {
    cacheStats: computed(() => cacheStats.value),
    refreshCacheStats,
    clearAllCache,
    clearExpiredCache
  }
}

export default PermissionCacheService