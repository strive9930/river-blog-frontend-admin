import { ref } from 'vue'
import type { Ref } from 'vue'

/**
 * 缓存条目接口
 */
interface CacheItem<T> {
  value: T
  timestamp: number
  expireTime?: number
  tags?: string[]
}

/**
 * 缓存配置选项
 */
interface CacheOptions {
  maxSize?: number
  defaultExpireTime?: number
  tags?: string[]
}

/**
 * 缓存服务类
 * 实现LRU算法，支持过期时间和标签化管理
 */
class CacheService {
  private cache: Map<string, CacheItem<any>> = new Map()
  private maxSize: number
  private defaultExpireTime: number

  constructor(maxSize: number = 100, defaultExpireTime: number = 5 * 60 * 1000) {
    this.maxSize = maxSize
    this.defaultExpireTime = defaultExpireTime
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    // 如果达到最大容量，执行LRU淘汰
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    const expireTime = options.expireTime || this.defaultExpireTime
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      expireTime: expireTime > 0 ? Date.now() + expireTime : undefined,
      tags: options.tags || []
    }

    this.cache.set(key, item)
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // 检查是否过期
    if (item.expireTime && Date.now() > item.expireTime) {
      this.delete(key)
      return null
    }

    // 更新访问时间（用于LRU）
    item.timestamp = Date.now()
    return item.value
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * 检查缓存是否存在且未过期
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false
    
    if (item.expireTime && Date.now() > item.expireTime) {
      this.delete(key)
      return false
    }
    
    return true
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 根据标签清除缓存
   */
  clearByTags(tags: string[]): void {
    for (const [key, item] of this.cache.entries()) {
      if (item.tags && item.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expiredCount: this.getExpiredCount()
    }
  }

  /**
   * 获取过期缓存数量
   */
  private getExpiredCount(): number {
    let count = 0
    const now = Date.now()
    
    for (const item of this.cache.values()) {
      if (item.expireTime && now > item.expireTime) {
        count++
      }
    }
    
    return count
  }

  /**
   * LRU淘汰算法
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTimestamp = Infinity

    for (const [key, item] of this.cache.entries()) {
      // 优先淘汰过期的
      if (item.expireTime && Date.now() > item.expireTime) {
        this.cache.delete(key)
        return
      }
      
      // 找到最久未访问的
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp
        oldestKey = key
      }
    }

    // 删除最久未访问的项
    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
}

/**
 * 导出单例实例
 */
export const cacheService = new CacheService(100, 5 * 60 * 1000)

/**
 * 组合式函数 - 提供响应式的缓存操作
 */
export function useCache<T>(key: string, options: CacheOptions = {}) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const load = async (loader: () => Promise<T>): Promise<T> => {
    loading.value = true
    error.value = null

    try {
      // 先尝试从缓存获取
      const cached = cacheService.get<T>(key)
      if (cached !== null) {
        data.value = cached
        loading.value = false
        return cached
      }

      // 缓存未命中，加载数据
      const result = await loader()
      
      // 存入缓存
      cacheService.set(key, result, options)
      data.value = result
      
      return result
    } catch (err: any) {
      error.value = err.message || '加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const refresh = async (loader: () => Promise<T>): Promise<T> => {
    cacheService.delete(key)
    return load(loader)
  }

  const clear = () => {
    cacheService.delete(key)
    data.value = null
  }

  return {
    data: data as Ref<T | null>,
    loading,
    error,
    load,
    refresh,
    clear
  }
}
