import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'

// 数据过滤配置
export interface DataFilterConfig<T> {
  fields: Array<{
    key: keyof T
    label: string
    type: 'text' | 'number' | 'date' | 'select' | 'boolean'
    options?: Array<{ label: string; value: any }>
    placeholder?: string
  }>
}

// 数据排序配置
export interface SortConfig<T> {
  key: keyof T
  order: 'asc' | 'desc'
}

// 数据分页配置
export interface PaginationConfig {
  page: number
  size: number
  total: number
}

// 数据管理状态
export interface DataManagerState<T> {
  data: T[]
  filteredData: T[]
  sortedData: T[]
  paginatedData: T[]
  filters: Record<string, any>
  sort: SortConfig<T> | null
  pagination: PaginationConfig
  loading: boolean
  error: string | null
}

// 高级数据管理组合式API
export function useDataManager<T extends Record<string, any>>(
  initialData: T[] = [],
  filterConfig?: DataFilterConfig<T>
) {
  // 响应式状态
  const rawData = ref<T[]>(initialData) as Ref<T[]>
  const filters = ref<Record<string, any>>({})
  const sort = ref<SortConfig<T> | null>(null)
  const pagination = ref<PaginationConfig>({
    page: 1,
    size: 10,
    total: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const filteredData = computed(() => {
    if (!filters.value || Object.keys(filters.value).length === 0) {
      return rawData.value
    }

    return rawData.value.filter(item => {
      return Object.entries(filters.value).every(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          return true
        }

        const itemValue = item[key as keyof T]
        
        if (typeof value === 'string') {
          return String(itemValue).toLowerCase().includes(value.toLowerCase())
        }
        
        if (typeof value === 'number') {
          return Number(itemValue) === value
        }
        
        if (value instanceof Date) {
          const itemDate = new Date(itemValue as any)
          return itemDate.toDateString() === value.toDateString()
        }
        
        return itemValue === value
      })
    })
  })

  const sortedData = computed(() => {
    if (!sort.value) {
      return [...filteredData.value]
    }

    return [...filteredData.value].sort((a, b) => {
      const aValue = a[sort.value!.key]
      const bValue = b[sort.value!.key]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      let comparison = 0
      if (typeof aValue === 'string') {
        comparison = aValue.localeCompare(bValue as string)
      } else if (typeof aValue === 'number') {
        comparison = (aValue as number) - (bValue as number)
      } else if (aValue instanceof Date) {
        comparison = (aValue as Date).getTime() - (bValue as Date).getTime()
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return sort.value!.order === 'asc' ? comparison : -comparison
    })
  })

  const paginatedData = computed(() => {
    const startIndex = (pagination.value.page - 1) * pagination.value.size
    const endIndex = startIndex + pagination.value.size
    return sortedData.value.slice(startIndex, endIndex)
  })

  const totalPages = computed(() => {
    return Math.ceil(sortedData.value.length / pagination.value.size)
  })

  // 方法
  const setData = (data: T[]) => {
    rawData.value = data
    pagination.value.total = data.length
    // 重置到第一页
    pagination.value.page = 1
  }

  const setFilter = (key: string, value: any) => {
    filters.value[key] = value
    // 重置分页到第一页
    pagination.value.page = 1
  }

  const clearFilters = () => {
    filters.value = {}
    pagination.value.page = 1
  }

  const setSort = (key: keyof T, order: 'asc' | 'desc' = 'asc') => {
    if (sort.value?.key === key) {
      // 切换排序方向
      sort.value.order = sort.value.order === 'asc' ? 'desc' : 'asc'
    } else {
      sort.value = { key, order }
    }
  }

  const clearSort = () => {
    sort.value = null
  }

  const setPage = (page: number) => {
    pagination.value.page = Math.max(1, Math.min(page, totalPages.value))
  }

  const setPageSize = (size: number) => {
    pagination.value.size = size
    pagination.value.page = 1 // 重置到第一页
  }

  const refresh = () => {
    // 这里可以重新加载数据
    console.log('Refreshing data...')
  }

  const exportFilteredData = () => {
    return sortedData.value
  }

  // 监听数据变化更新总数
  watch(rawData, (newData) => {
    pagination.value.total = newData.length
  })

  watch(filteredData, (newFilteredData) => {
    pagination.value.total = newFilteredData.length
    // 如果当前页超出范围，调整到有效页
    if (pagination.value.page > totalPages.value && totalPages.value > 0) {
      pagination.value.page = totalPages.value
    }
  })

  return {
    // 数据
    rawData,
    filteredData,
    sortedData,
    paginatedData,
    filters,
    sort,
    pagination,
    loading,
    error,
    
    // 状态
    totalPages,
    
    // 方法
    setData,
    setFilter,
    clearFilters,
    setSort,
    clearSort,
    setPage,
    setPageSize,
    refresh,
    exportFilteredData,
    
    // 配置
    filterConfig
  }
}

// 虚拟滚动组合式API
export interface VirtualScrollConfig {
  itemHeight: number
  bufferSize: number
  containerHeight: number
}

export function useVirtualScroll<T>(
  data: Ref<T[]>,
  config: VirtualScrollConfig
) {
  const { itemHeight, bufferSize, containerHeight } = config
  
  const scrollTop = ref(0)
  const containerRef = ref<HTMLElement | null>(null)

  const visibleCount = Math.ceil(containerHeight / itemHeight) + bufferSize
  const totalHeight = computed(() => data.value.length * itemHeight)

  const startIndex = computed(() => {
    return Math.max(0, Math.floor(scrollTop.value / itemHeight) - Math.floor(bufferSize / 2))
  })

  const endIndex = computed(() => {
    return Math.min(data.value.length, startIndex.value + visibleCount)
  })

  const visibleData = computed(() => {
    return data.value.slice(startIndex.value, endIndex.value)
  })

  const offsetY = computed(() => startIndex.value * itemHeight)

  const handleScroll = (e: Event) => {
    const target = e.target as HTMLElement
    scrollTop.value = target.scrollTop
  }

  const scrollToIndex = (index: number) => {
    if (containerRef.value) {
      const targetScrollTop = index * itemHeight
      containerRef.value.scrollTop = targetScrollTop
    }
  }

  return {
    containerRef,
    visibleData,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    handleScroll,
    scrollToIndex
  }
}

// 数据缓存组合式API
export interface CacheOptions {
  ttl?: number // 过期时间(毫秒)
  maxSize?: number // 最大缓存数量
}

export function useDataCache<T>(options: CacheOptions = {}) {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = options
  
  const cache = new Map<string, { data: T; timestamp: number }>()
  
  const set = (key: string, data: T) => {
    // 检查缓存大小限制
    if (cache.size >= maxSize) {
      // 删除最旧的条目
      const firstKey = cache.keys().next().value
      if (firstKey) cache.delete(firstKey)
    }
    
    cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }
  
  const get = (key: string): T | null => {
    const item = cache.get(key)
    if (!item) return null
    
    // 检查是否过期
    if (ttl > 0 && Date.now() - item.timestamp > ttl) {
      cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  const has = (key: string): boolean => {
    return cache.has(key) && get(key) !== null
  }
  
  const remove = (key: string) => {
    cache.delete(key)
  }
  
  const clear = () => {
    cache.clear()
  }
  
  const getSize = () => {
    return cache.size
  }
  
  return {
    set,
    get,
    has,
    remove,
    clear,
    getSize
  }
}

// 数据同步组合式API
export interface SyncConfig<T> {
  interval?: number // 同步间隔(毫秒)
  compare?: (local: T[], remote: T[]) => boolean // 数据比较函数
  merge?: (local: T[], remote: T[]) => T[] // 数据合并函数
}

export function useDataSync<T>(
  localData: Ref<T[]>,
  fetchRemote: () => Promise<T[]>,
  config: SyncConfig<T> = {}
) {
  const { interval = 30000, compare, merge } = config
  
  const isSyncing = ref(false)
  const lastSyncTime = ref<Date | null>(null)
  const syncTimer = ref<number | null>(null)
  
  const defaultCompare = (local: T[], remote: T[]): boolean => {
    return JSON.stringify(local) === JSON.stringify(remote)
  }
  
  const defaultMerge = (local: T[], remote: T[]): T[] => {
    // 简单的合并策略：远程数据优先
    return [...remote]
  }
  
  const sync = async () => {
    if (isSyncing.value) return
    
    isSyncing.value = true
    try {
      const remoteData = await fetchRemote()
      const isEqual = compare ? compare(localData.value, remoteData) : defaultCompare(localData.value, remoteData)
      
      if (!isEqual) {
        localData.value = merge ? merge(localData.value, remoteData) : defaultMerge(localData.value, remoteData)
        lastSyncTime.value = new Date()
      }
    } catch (error) {
      console.error('Data sync failed:', error)
    } finally {
      isSyncing.value = false
    }
  }
  
  const startAutoSync = () => {
    if (syncTimer.value) return
    
    syncTimer.value = window.setInterval(sync, interval) as unknown as number
  }
  
  const stopAutoSync = () => {
    if (syncTimer.value) {
      clearInterval(syncTimer.value)
      syncTimer.value = null
    }
  }
  
  // 组件卸载时清理定时器
  const cleanup = () => {
    stopAutoSync()
  }
  
  return {
    isSyncing,
    lastSyncTime,
    sync,
    startAutoSync,
    stopAutoSync,
    cleanup
  }
}