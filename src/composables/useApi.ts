import { ref, Ref } from 'vue'
import { api, apiWithLoading } from '@/api/httpClient'
import { useLoading } from '@/services/loadingService'
import { useErrorHandler } from '@/services/errorHandlingService'

// 泛型数据获取hook
export function useApiData<T>(
  fetchDataFn: () => Promise<T>,
  options: {
    immediate?: boolean
    loadingMessage?: string
    errorMessage?: string
  } = {}
) {
  const { immediate = true, loadingMessage = '加载中...', errorMessage = '数据加载失败' } = options
  
  const data = ref<T | null>(null) as Ref<T | null>
  const error = ref<string | null>(null)
  const { showLoading, hideLoading } = useLoading()
  const { handleError } = useErrorHandler()

  const loading = ref(false)

  const execute = async (): Promise<T | null> => {
    try {
      loading.value = true
      error.value = null
      showLoading(loadingMessage)
      
      const result = await fetchDataFn()
      data.value = result
      
      return result
    } catch (err) {
      error.value = errorMessage
      handleError(err, errorMessage)
      return null
    } finally {
      loading.value = false
      hideLoading()
    }
  }

  // 立即执行
  if (immediate) {
    execute()
  }

  return {
    data,
    loading,
    error,
    execute,
    refresh: execute
  }
}

// 带分页的数据获取hook
export function usePaginatedApiData<T>(
  fetchDataFn: (page: number, size: number) => Promise<{ data: T[]; total: number }>,
  options: {
    pageSize?: number
    immediate?: boolean
    loadingMessage?: string
  } = {}
) {
  const { pageSize = 20, immediate = true, loadingMessage = '加载中...' } = options
  
  const data = ref<T[]>([])
  const total = ref(0)
  const currentPage = ref(1)
  const { showLoading, hideLoading } = useLoading()
  const { handleError } = useErrorHandler()

  const loading = ref(false)

  const execute = async (page: number = currentPage.value): Promise<void> => {
    try {
      loading.value = true
      showLoading(loadingMessage)
      
      const result = await fetchDataFn(page, pageSize)
      data.value = result.data
      total.value = result.total
      currentPage.value = page
    } catch (err) {
      handleError(err, '数据加载失败')
    } finally {
      loading.value = false
      hideLoading()
    }
  }

  const nextPage = () => {
    if (currentPage.value * pageSize < total.value) {
      execute(currentPage.value + 1)
    }
  }

  const prevPage = () => {
    if (currentPage.value > 1) {
      execute(currentPage.value - 1)
    }
  }

  // 立即执行
  if (immediate) {
    execute()
  }

  return {
    data,
    loading,
    total,
    currentPage,
    pageSize,
    execute,
    nextPage,
    prevPage,
    refresh: () => execute(currentPage.value)
  }
}

// API操作hook
export function useApiAction<T>(
  actionFn: (...args: any[]) => Promise<T>,
  options: {
    successMessage?: string
    errorMessage?: string
    showLoading?: boolean
    loadingMessage?: string
  } = {}
) {
  const { 
    successMessage = '操作成功', 
    errorMessage = '操作失败',
    showLoading: shouldShowLoading = true,
    loadingMessage = '处理中...' 
  } = options
  
  const { showLoading, hideLoading } = useLoading()
  const { handleError, showInfo } = useErrorHandler()

  const loading = ref(false)
  const error = ref<string | null>(null)

  const execute = async (...args: any[]): Promise<T | null> => {
    try {
      loading.value = true
      error.value = null
      
      if (shouldShowLoading) {
        showLoading(loadingMessage)
      }
      
      const result = await actionFn(...args)
      
      if (successMessage) {
        showInfo(successMessage)
      }
      
      return result
    } catch (err) {
      error.value = errorMessage
      handleError(err, errorMessage)
      return null
    } finally {
      loading.value = false
      if (shouldShowLoading) {
        hideLoading()
      }
    }
  }

  return {
    loading,
    error,
    execute
  }
}

// 批量操作hook
export function useBatchApiAction<T>(
  actionFn: (items: T[]) => Promise<any>,
  options: {
    batchSize?: number
    successMessage?: string
    errorMessage?: string
  } = {}
) {
  const { batchSize = 10, successMessage = '批量操作完成', errorMessage = '批量操作失败' } = options
  
  const { showLoading, hideLoading } = useLoading()
  const { handleError, showInfo } = useErrorHandler()

  const loading = ref(false)
  const progress = ref(0)
  const totalItems = ref(0)

  const execute = async (items: T[]): Promise<boolean> => {
    try {
      loading.value = true
      totalItems.value = items.length
      progress.value = 0
      
      showLoading(`正在处理 ${items.length} 个项目...`)
      
      // 分批处理
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        await actionFn(batch)
        progress.value = Math.min(((i + batchSize) / items.length) * 100, 100)
      }
      
      showInfo(successMessage)
      return true
    } catch (err) {
      handleError(err, errorMessage)
      return false
    } finally {
      loading.value = false
      hideLoading()
    }
  }

  return {
    loading,
    progress,
    totalItems,
    execute
  }
}