import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Ref } from 'vue'

// 批量操作配置
export interface BatchOperationConfig<T> {
  batchSize?: number
  concurrency?: number
  retryCount?: number
  onSuccess?: (item: T, index: number) => void
  onError?: (item: T, error: any, index: number) => void
  onComplete?: (results: BatchOperationResult<T>) => void
}

// 批量操作结果
export interface BatchOperationResult<T> {
  successCount: number
  errorCount: number
  totalCount: number
  successItems: T[]
  errorItems: Array<{ item: T; error: any }>
  duration: number
}

// 数据导入配置
export interface DataImportConfig<T> {
  fileType?: string[]
  maxSize?: number // bytes
  parser?: (file: File) => Promise<T[]>
  validator?: (data: T[]) => Promise<{ isValid: boolean; errors: string[] }>
  onProgress?: (progress: number) => void
}

// 数据导出配置
export interface DataExportConfig<T> {
  fileName?: string
  format?: 'csv' | 'xlsx' | 'json'
  columns?: Array<{
    key: keyof T
    title: string
    formatter?: (value: any, row: T) => any
  }>
  onProgress?: (progress: number) => void
}

// 权限检查配置
export interface PermissionCheckConfig {
  mode?: 'strict' | 'loose' // strict: 全部满足, loose: 满足任一即可
  showMessage?: boolean
  redirectTo?: string
}

// 批量操作组合式API
export function useBatchOperations<T>() {
  const isProcessing = ref(false)
  const progress = ref(0)
  const processedCount = ref(0)
  const totalCount = ref(0)

  const batchOperation = async (
    items: T[],
    operation: (item: T, index: number) => Promise<any>,
    config: BatchOperationConfig<T> = {}
  ): Promise<BatchOperationResult<T>> => {
    const {
      batchSize = 10,
      concurrency = 3,
      retryCount = 0,
      onSuccess,
      onError,
      onComplete
    } = config

    isProcessing.value = true
    progress.value = 0
    processedCount.value = 0
    totalCount.value = items.length

    const startTime = Date.now()
    const results: BatchOperationResult<T> = {
      successCount: 0,
      errorCount: 0,
      totalCount: items.length,
      successItems: [],
      errorItems: [],
      duration: 0
    }

    try {
      // 分批处理
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        const batchPromises = batch.map((item, index) => 
          processItem(item, i + index, operation, retryCount)
        )

        const batchResults = await Promise.all(batchPromises)
        
        batchResults.forEach(result => {
          if (result.success) {
            results.successCount++
            results.successItems.push(result.item)
            onSuccess?.(result.item, result.index)
          } else {
            results.errorCount++
            results.errorItems.push({ item: result.item, error: result.error })
            onError?.(result.item, result.error, result.index)
          }
        })

        processedCount.value = Math.min(i + batchSize, items.length)
        progress.value = (processedCount.value / totalCount.value) * 100
      }

      results.duration = Date.now() - startTime
      onComplete?.(results)
      
      ElMessage.success(`批量操作完成：成功 ${results.successCount} 项，失败 ${results.errorCount} 项`)
      
      return results
    } catch (error) {
      ElMessage.error('批量操作过程中发生错误')
      throw error
    } finally {
      isProcessing.value = false
    }
  }

  const processItem = async (
    item: T,
    index: number,
    operation: (item: T, index: number) => Promise<any>,
    retries: number
  ): Promise<{ success: boolean; item: T; index: number; error?: any }> => {
    let attempt = 0
    
    while (attempt <= retries) {
      try {
        await operation(item, index)
        return { success: true, item, index }
      } catch (error) {
        attempt++
        if (attempt > retries) {
          return { success: false, item, index, error }
        }
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }
    
    return { success: false, item, index, error: new Error('Max retries exceeded') }
  }

  // 取消操作
  const cancelOperation = () => {
    isProcessing.value = false
    progress.value = 0
    processedCount.value = 0
    totalCount.value = 0
  }

  return {
    isProcessing,
    progress,
    processedCount,
    totalCount,
    batchOperation,
    cancelOperation
  }
}

// 数据导入组合式API
export function useDataImport<T>() {
  const isImporting = ref(false)
  const importProgress = ref(0)
  const importedData = ref<T[]>([])

  const importData = async (
    file: File,
    config: DataImportConfig<T> = {}
  ): Promise<T[]> => {
    const {
      fileType = ['application/json', 'text/csv'],
      maxSize = 10 * 1024 * 1024, // 10MB
      parser,
      validator,
      onProgress
    } = config

    // 文件验证
    if (!fileType.includes(file.type)) {
      throw new Error(`不支持的文件类型，请上传 ${fileType.join(', ')} 格式的文件`)
    }

    if (file.size > maxSize) {
      throw new Error(`文件大小超过限制 (${Math.round(maxSize / 1024 / 1024)}MB)`)
    }

    isImporting.value = true
    importProgress.value = 0

    try {
      // 解析文件
      let data: T[] = []
      
      if (parser) {
        data = await parser(file)
      } else {
        // 默认JSON解析
        const text = await file.text()
        data = JSON.parse(text)
      }

      importProgress.value = 50
      onProgress?.(50)

      // 数据验证
      if (validator) {
        const validationResult = await validator(data)
        if (!validationResult.isValid) {
          throw new Error(`数据验证失败：${validationResult.errors.join(', ')}`)
        }
      }

      importProgress.value = 100
      onProgress?.(100)
      
      importedData.value = data
      ElMessage.success(`成功导入 ${data.length} 条数据`)
      
      return data
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '数据导入失败')
      throw error
    } finally {
      isImporting.value = false
      setTimeout(() => {
        importProgress.value = 0
      }, 1000)
    }
  }

  const resetImport = () => {
    isImporting.value = false
    importProgress.value = 0
    importedData.value = []
  }

  return {
    isImporting,
    importProgress,
    importedData,
    importData,
    resetImport
  }
}

// 数据导出组合式API
export function useDataExport<T>() {
  const isExporting = ref(false)
  const exportProgress = ref(0)

  const exportData = async (
    data: T[],
    config: DataExportConfig<T> = {}
  ): Promise<void> => {
    const {
      fileName = `data-export-${new Date().toISOString().split('T')[0]}`,
      format = 'json',
      columns = [],
      onProgress
    } = config

    isExporting.value = true
    exportProgress.value = 0

    try {
      let content: string
      let mimeType: string
      let fileExtension: string

      switch (format) {
        case 'csv':
          content = await exportToCSV(data, columns)
          mimeType = 'text/csv;charset=utf-8;'
          fileExtension = '.csv'
          break
        case 'xlsx':
          content = await exportToExcel(data, columns)
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          fileExtension = '.xlsx'
          break
        case 'json':
        default:
          content = JSON.stringify(data, null, 2)
          mimeType = 'application/json'
          fileExtension = '.json'
          break
      }

      exportProgress.value = 80
      onProgress?.(80)

      // 创建并下载文件
      const blob = new Blob([content], { type: mimeType })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName + fileExtension
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      exportProgress.value = 100
      onProgress?.(100)
      
      ElMessage.success('数据导出成功')
    } catch (error) {
      ElMessage.error('数据导出失败')
      throw error
    } finally {
      isExporting.value = false
      setTimeout(() => {
        exportProgress.value = 0
      }, 1000)
    }
  }

  const exportToCSV = async <T>(data: T[], columns: DataExportConfig<T>['columns']): Promise<string> => {
    if (data.length === 0) return ''

    // 如果没有指定列，则使用第一条数据的所有键
    const cols = columns.length > 0 ? columns : 
      Object.keys(data[0]).map(key => ({
        key: key as keyof T,
        title: key
      }))

    // 创建CSV头部
    const headers = cols.map(col => `"${col.title}"`).join(',')
    
    // 创建CSV数据行
    const rows = data.map((item, index) => {
      const values = cols.map(col => {
        let value = item[col.key]
        if (col.formatter) {
          value = col.formatter(value, item)
        }
        // 处理特殊字符
        return `"${String(value ?? '').replace(/"/g, '""')}"`
      })
      return values.join(',')
    })

    return [headers, ...rows].join('\n')
  }

  const exportToExcel = async <T>(data: T[], columns: DataExportConfig<T>['columns']): Promise<string> => {
    // 简化的Excel导出，实际项目中建议使用专门的库如 xlsx
    const csvContent = await exportToCSV(data, columns)
    // 这里可以集成真正的Excel生成库
    return csvContent
  }

  return {
    isExporting,
    exportProgress,
    exportData
  }
}

// 权限检查组合式API
export function usePermissionCheck() {
  // 模拟用户权限数据
  const userPermissions = ref<string[]>([
    'user.view',
    'user.create',
    'user.edit',
    'user.delete',
    'role.view',
    'role.assign',
    'permission.view',
    'permission.assign'
  ])

  const hasPermission = (permission: string): boolean => {
    return userPermissions.value.includes(permission)
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  const checkPermission = (
    requiredPermissions: string | string[],
    config: PermissionCheckConfig = {}
  ): boolean => {
    const {
      mode = 'strict',
      showMessage = true,
      redirectTo
    } = config

    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]
    
    const hasAccess = mode === 'strict' 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)

    if (!hasAccess && showMessage) {
      ElMessage.warning('您没有执行此操作的权限')
      if (redirectTo) {
        // 实际项目中这里应该是路由跳转
        console.log('Redirect to:', redirectTo)
      }
    }

    return hasAccess
  }

  const requirePermission = (
    requiredPermissions: string | string[],
    config: PermissionCheckConfig = {}
  ) => {
    return computed(() => checkPermission(requiredPermissions, config))
  }

  return {
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermission,
    requirePermission
  }
}

// 操作历史记录组合式API
export interface OperationHistoryItem {
  id: string
  operation: string
  target: string
  timestamp: Date
  userId: string
  userName: string
  status: 'success' | 'failed'
  details?: any
  duration?: number
}

export function useOperationHistory() {
  const history = ref<OperationHistoryItem[]>([])
  const maxHistorySize = 100

  const addHistory = (item: Omit<OperationHistoryItem, 'id' | 'timestamp'>) => {
    const historyItem: OperationHistoryItem = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }

    history.value.unshift(historyItem)
    
    // 限制历史记录数量
    if (history.value.length > maxHistorySize) {
      history.value = history.value.slice(0, maxHistorySize)
    }

    // 保存到本地存储
    localStorage.setItem('operation-history', JSON.stringify(history.value))
  }

  const clearHistory = () => {
    history.value = []
    localStorage.removeItem('operation-history')
  }

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('operation-history')
      if (saved) {
        history.value = JSON.parse(saved).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
      }
    } catch (error) {
      console.error('Failed to load operation history:', error)
    }
  }

  const getRecentOperations = (count: number = 10) => {
    return history.value.slice(0, count)
  }

  const getOperationsByUser = (userId: string) => {
    return history.value.filter(item => item.userId === userId)
  }

  const getOperationsByType = (operation: string) => {
    return history.value.filter(item => item.operation === operation)
  }

  // 初始化时加载历史记录
  loadHistory()

  return {
    history,
    addHistory,
    clearHistory,
    loadHistory,
    getRecentOperations,
    getOperationsByUser,
    getOperationsByType
  }
}