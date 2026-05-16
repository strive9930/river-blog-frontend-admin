import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'

// 操作历史记录项
export interface AuditLogItem {
  id: string
  action: string
  resource: string
  resourceId?: string
  userId: string
  userName: string
  timestamp: Date
  ip?: string
  userAgent?: string
  before?: any
  after?: any
  status: 'success' | 'failed'
  error?: string
}

// 数据版本历史
export interface VersionHistoryItem<T> {
  version: number
  data: T
  timestamp: Date
  userId: string
  userName: string
  comment?: string
}

// 批量编辑配置
export interface BatchEditConfig<T> {
  fields: Array<{
    key: keyof T
    label: string
    type: 'text' | 'number' | 'select' | 'boolean' | 'date'
    options?: Array<{ label: string; value: any }>
    validator?: (value: any) => boolean | string
  }>
  onApply: (items: T[], updates: Partial<T>) => Promise<boolean>
}

// 数据审计组合式API
export function useAuditTrail<T extends Record<string, any>>() {
  const auditLogs = ref<AuditLogItem[]>([])
  const maxLogSize = 1000

  const logAction = (
    action: string,
    resource: string,
    options: {
      resourceId?: string
      userId: string
      userName: string
      before?: any
      after?: any
      status?: 'success' | 'failed'
      error?: string
      ip?: string
      userAgent?: string
    }
  ) => {
    const logItem: AuditLogItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      action,
      resource,
      timestamp: new Date(),
      status: 'success',
      ...options
    }

    auditLogs.value.unshift(logItem)
    
    // 限制日志数量
    if (auditLogs.value.length > maxLogSize) {
      auditLogs.value = auditLogs.value.slice(0, maxLogSize)
    }

    // 保存到本地存储
    localStorage.setItem('audit-logs', JSON.stringify(
      auditLogs.value.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString()
      }))
    ))
  }

  const getLogsByResource = (resource: string, resourceId?: string) => {
    return auditLogs.value.filter(log => 
      log.resource === resource && 
      (!resourceId || log.resourceId === resourceId)
    )
  }

  const getLogsByUser = (userId: string) => {
    return auditLogs.value.filter(log => log.userId === userId)
  }

  const getLogsByAction = (action: string) => {
    return auditLogs.value.filter(log => log.action === action)
  }

  const getRecentLogs = (count: number = 50) => {
    return auditLogs.value.slice(0, count)
  }

  const exportLogs = (format: 'json' | 'csv' = 'json') => {
    const logs = auditLogs.value.map(log => ({
      ...log,
      timestamp: log.timestamp.toISOString()
    }))

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      // CSV导出
      const headers = ['时间', '操作', '资源', '用户', '状态', '详情']
      const rows = logs.map(log => [
        log.timestamp.toISOString(),
        log.action,
        `${log.resource}${log.resourceId ? `(${log.resourceId})` : ''}`,
        log.userName,
        log.status,
        log.error || ''
      ])
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const clearLogs = () => {
    auditLogs.value = []
    localStorage.removeItem('audit-logs')
  }

  // 初始化时加载历史日志
  const loadLogs = () => {
    try {
      const saved = localStorage.getItem('audit-logs')
      if (saved) {
        auditLogs.value = JSON.parse(saved).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }))
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    }
  }

  loadLogs()

  return {
    auditLogs,
    logAction,
    getLogsByResource,
    getLogsByUser,
    getLogsByAction,
    getRecentLogs,
    exportLogs,
    clearLogs,
    loadLogs
  }
}

// 版本控制组合式API
export function useVersionControl<T extends Record<string, any>>() {
  const versions = ref<VersionHistoryItem<T>[]>([])
  const currentVersion = ref(0)

  const saveVersion = (
    data: T,
    options: {
      userId: string
      userName: string
      comment?: string
    }
  ) => {
    const versionItem: VersionHistoryItem<T> = {
      version: versions.value.length + 1,
      data: { ...data },
      timestamp: new Date(),
      ...options
    }

    versions.value.push(versionItem)
    currentVersion.value = versionItem.version

    // 保存到本地存储
    localStorage.setItem('version-history', JSON.stringify(
      versions.value.map(v => ({
        ...v,
        timestamp: v.timestamp.toISOString()
      }))
    ))

    return versionItem.version
  }

  const restoreVersion = (version: number): T | null => {
    const versionItem = versions.value.find(v => v.version === version)
    if (versionItem) {
      currentVersion.value = version
      return { ...versionItem.data }
    }
    return null
  }

  const getVersion = (version: number) => {
    return versions.value.find(v => v.version === version)
  }

  const getVersions = () => {
    return [...versions.value].reverse()
  }

  const compareVersions = (version1: number, version2: number) => {
    const v1 = getVersion(version1)
    const v2 = getVersion(version2)
    
    if (!v1 || !v2) return null

    return {
      added: Object.keys(v2.data).filter(key => !(key in v1.data)),
      removed: Object.keys(v1.data).filter(key => !(key in v2.data)),
      modified: Object.keys(v1.data).filter(key => 
        key in v2.data && JSON.stringify(v1.data[key]) !== JSON.stringify(v2.data[key])
      )
    }
  }

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('version-history')
      if (saved) {
        versions.value = JSON.parse(saved).map((v: any) => ({
          ...v,
          timestamp: new Date(v.timestamp)
        }))
        currentVersion.value = versions.value.length > 0 
          ? versions.value[versions.value.length - 1].version 
          : 0
      }
    } catch (error) {
      console.error('Failed to load version history:', error)
    }
  }

  const clearHistory = () => {
    versions.value = []
    currentVersion.value = 0
    localStorage.removeItem('version-history')
  }

  loadHistory()

  return {
    versions,
    currentVersion,
    saveVersion,
    restoreVersion,
    getVersion,
    getVersions,
    compareVersions,
    loadHistory,
    clearHistory
  }
}

// 批量编辑组合式API
export function useBatchEdit<T extends Record<string, any>>(config: BatchEditConfig<T>) {
  const isEditing = ref(false)
  const selectedItems = ref<T[]>([])
  const editValues = ref<Partial<T>>({})

  const startEdit = (items: T[]) => {
    selectedItems.value = [...items]
    editValues.value = {}
    isEditing.value = true
  }

  const cancelEdit = () => {
    selectedItems.value = []
    editValues.value = {}
    isEditing.value = false
  }

  const applyEdit = async (): Promise<boolean> => {
    if (selectedItems.value.length === 0) {
      ElMessage.warning('请先选择要编辑的项目')
      return false
    }

    // 验证输入值
    for (const [key, value] of Object.entries(editValues.value)) {
      const field = config.fields.find(f => f.key === key)
      if (field && field.validator && value !== undefined && value !== null) {
        const validationResult = field.validator(value)
        if (validationResult !== true) {
          ElMessage.error(typeof validationResult === 'string' ? validationResult : `字段 ${field.label} 验证失败`)
          return false
        }
      }
    }

    try {
      const success = await config.onApply(selectedItems.value, editValues.value)
      if (success) {
        ElMessage.success(`成功更新 ${selectedItems.value.length} 个项目`)
        cancelEdit()
        return true
      } else {
        ElMessage.error('批量更新失败')
        return false
      }
    } catch (error) {
      ElMessage.error('批量更新过程中发生错误')
      return false
    }
  }

  const setFieldValue = (key: keyof T, value: any) => {
    editValues.value[key] = value
  }

  const getFieldOptions = (key: keyof T) => {
    const field = config.fields.find(f => f.key === key)
    return field?.options || []
  }

  const isFieldEditable = (key: keyof T) => {
    return config.fields.some(f => f.key === key)
  }

  const getSelectedCount = computed(() => selectedItems.value.length)

  return {
    isEditing,
    selectedItems,
    editValues,
    startEdit,
    cancelEdit,
    applyEdit,
    setFieldValue,
    getFieldOptions,
    isFieldEditable,
    getSelectedCount
  }
}

// 实时协作组合式API
export interface CollaborationUser {
  id: string
  name: string
  avatar?: string
  color: string
  lastActive: Date
}

export interface PresenceData {
  userId: string
  resourceId: string
  timestamp: Date
  data?: any
}

export function useCollaboration(resourceId: string) {
  const connectedUsers = ref<CollaborationUser[]>([])
  const currentUserPresence = ref<PresenceData | null>(null)
  const isConnected = ref(false)

  // 模拟WebSocket连接
  let heartbeatInterval: number | null = null

  const connect = (userId: string, userName: string) => {
    isConnected.value = true
    
    // 添加当前用户
    const currentUser: CollaborationUser = {
      id: userId,
      name: userName,
      color: getRandomColor(),
      lastActive: new Date()
    }
    
    connectedUsers.value.push(currentUser)
    
    // 开始心跳
    heartbeatInterval = window.setInterval(() => {
      sendHeartbeat(userId, resourceId)
    }, 30000) as unknown as number
    
    ElNotification.success({
      title: '协作连接',
      message: '已连接到协作会话'
    })
  }

  const disconnect = () => {
    isConnected.value = false
    connectedUsers.value = []
    
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
    
    ElNotification.info({
      title: '协作断开',
      message: '已断开协作连接'
    })
  }

  const sendHeartbeat = (userId: string, resourceId: string) => {
    currentUserPresence.value = {
      userId,
      resourceId,
      timestamp: new Date(),
      data: { active: true }
    }
    
    // 更新用户活跃时间
    const user = connectedUsers.value.find(u => u.id === userId)
    if (user) {
      user.lastActive = new Date()
    }
  }

  const updateUserPresence = (presence: PresenceData) => {
    currentUserPresence.value = presence
    
    // 更新或添加用户
    const existingUser = connectedUsers.value.find(u => u.id === presence.userId)
    if (existingUser) {
      existingUser.lastActive = presence.timestamp
    } else {
      connectedUsers.value.push({
        id: presence.userId,
        name: `用户${presence.userId.slice(0, 4)}`,
        color: getRandomColor(),
        lastActive: presence.timestamp
      })
    }
  }

  const getRandomColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const getUserColor = (userId: string) => {
    const user = connectedUsers.value.find(u => u.id === userId)
    return user?.color || '#CCCCCC'
  }

  const getActiveUsers = computed(() => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return connectedUsers.value.filter(user => user.lastActive > fiveMinutesAgo)
  })

  // 清理
  const cleanup = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
    }
  }

  return {
    connectedUsers,
    currentUserPresence,
    isConnected,
    getActiveUsers,
    connect,
    disconnect,
    sendHeartbeat,
    updateUserPresence,
    getUserColor,
    cleanup
  }
}

// 数据备份组合式API
export interface BackupConfig {
  autoBackup?: boolean
  backupInterval?: number // 分钟
  maxBackups?: number
  storageKey?: string
}

export function useDataBackup<T>(config: BackupConfig = {}) {
  const {
    autoBackup = false,
    backupInterval = 30,
    maxBackups = 10,
    storageKey = 'app-backup'
  } = config

  const backups = ref<Array<{
    id: string
    timestamp: Date
    data: T
    size: number
  }>>([])
  
  const isBackingUp = ref(false)
  const lastBackupTime = ref<Date | null>(null)
  const backupTimer = ref<number | null>(null)

  const createBackup = async (data: T): Promise<boolean> => {
    isBackingUp.value = true
    
    try {
      const backup = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        data,
        size: JSON.stringify(data).length
      }

      backups.value.unshift(backup)
      
      // 限制备份数量
      if (backups.value.length > maxBackups) {
        backups.value = backups.value.slice(0, maxBackups)
      }

      // 保存到本地存储
      localStorage.setItem(storageKey, JSON.stringify(
        backups.value.map(b => ({
          ...b,
          timestamp: b.timestamp.toISOString()
        }))
      ))

      lastBackupTime.value = new Date()
      ElMessage.success('数据备份创建成功')
      
      return true
    } catch (error) {
      ElMessage.error('数据备份创建失败')
      return false
    } finally {
      isBackingUp.value = false
    }
  }

  const restoreBackup = (backupId: string): T | null => {
    const backup = backups.value.find(b => b.id === backupId)
    if (backup) {
      ElMessage.success('数据恢复成功')
      return backup.data
    }
    ElMessage.error('找不到指定的备份')
    return null
  }

  const deleteBackup = (backupId: string) => {
    backups.value = backups.value.filter(b => b.id !== backupId)
    localStorage.setItem(storageKey, JSON.stringify(
      backups.value.map(b => ({
        ...b,
        timestamp: b.timestamp.toISOString()
      }))
    ))
    ElMessage.success('备份已删除')
  }

  const loadBackups = () => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        backups.value = JSON.parse(saved).map((b: any) => ({
          ...b,
          timestamp: new Date(b.timestamp)
        }))
      }
    } catch (error) {
      console.error('Failed to load backups:', error)
    }
  }

  const clearAllBackups = () => {
    backups.value = []
    localStorage.removeItem(storageKey)
    ElMessage.success('所有备份已清除')
  }

  const getTotalBackupSize = computed(() => {
    return backups.value.reduce((total, backup) => total + backup.size, 0)
  })

  const startAutoBackup = (getData: () => T) => {
    if (!autoBackup || backupTimer.value) return

    backupTimer.value = window.setInterval(() => {
      createBackup(getData())
    }, backupInterval * 60 * 1000) as unknown as number
  }

  const stopAutoBackup = () => {
    if (backupTimer.value) {
      clearInterval(backupTimer.value)
      backupTimer.value = null
    }
  }

  // 初始化
  loadBackups()

  return {
    backups,
    isBackingUp,
    lastBackupTime,
    getTotalBackupSize,
    createBackup,
    restoreBackup,
    deleteBackup,
    clearAllBackups,
    startAutoBackup,
    stopAutoBackup,
    loadBackups
  }
}