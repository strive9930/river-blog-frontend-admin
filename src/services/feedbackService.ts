// 操作确认类型
export type ConfirmType = 'delete' | 'warning' | 'info' | 'custom'

// 操作确认选项
export interface ConfirmOptions {
  title?: string
  message: string
  type?: ConfirmType
  confirmText?: string
  cancelText?: string
  danger?: boolean
  showClose?: boolean
  draggable?: boolean
  beforeClose?: (action: 'confirm' | 'cancel') => void
}

// 即时反馈类型
export type FeedbackType = 'success' | 'error' | 'warning' | 'info'

// 即时反馈选项
export interface FeedbackOptions {
  message: string
  type?: FeedbackType
  duration?: number
  showClose?: boolean
  dangerouslyUseHTMLString?: boolean
  icon?: string
  onClose?: () => void
}

// 进度反馈选项
export interface ProgressFeedbackOptions {
  message: string
  type?: FeedbackType
  percentage?: number
  status?: 'success' | 'exception' | 'warning' | '' | undefined
  strokeWidth?: number
  showText?: boolean
}

// 操作确认服务
class ConfirmationService {
  // 显示确认对话框
  async showConfirm(options: ConfirmOptions): Promise<boolean> {
    const {
      title = '确认操作',
      message,
      type = 'info',
      confirmText = '确定',
      cancelText = '取消',
      danger = false,
      showClose = true,
      draggable = false,
      beforeClose
    } = options

    try {
      await ElMessageBox.confirm(message, title, {
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        type: this.getElMessageType(type),
        showClose,
        draggable,
        beforeClose: (action, instance, done) => {
          if (beforeClose) {
            beforeClose(action as 'confirm' | 'cancel')
          }
          done()
        },
        customClass: danger ? 'danger-confirm' : ''
      })
      return true
    } catch (error) {
      return false
    }
  }

  // 显示删除确认
  async showDeleteConfirm(
    itemName: string,
    options: Partial<ConfirmOptions> = {}
  ): Promise<boolean> {
    return this.showConfirm({
      title: '删除确认',
      message: `确定要删除 "${itemName}" 吗？此操作不可恢复！`,
      type: 'delete',
      confirmText: '删除',
      cancelText: '取消',
      danger: true,
      ...options
    })
  }

  // 显示批量操作确认
  async showBatchConfirm(
    count: number,
    action: string,
    options: Partial<ConfirmOptions> = {}
  ): Promise<boolean> {
    return this.showConfirm({
      title: '批量操作确认',
      message: `确定要对 ${count} 个项目执行"${action}"操作吗？`,
      type: 'warning',
      confirmText: '确定',
      cancelText: '取消',
      ...options
    })
  }

  // 显示危险操作确认
  async showDangerConfirm(
    action: string,
    details: string,
    options: Partial<ConfirmOptions> = {}
  ): Promise<boolean> {
    return this.showConfirm({
      title: '危险操作警告',
      message: `即将执行危险操作：${action}

${details}

请确认是否继续？`,
      type: 'warning',
      confirmText: '我了解风险，继续执行',
      cancelText: '取消操作',
      danger: true,
      ...options
    })
  }

  private getElMessageType(type: ConfirmType): 'success' | 'warning' | 'info' | 'error' {
    switch (type) {
      case 'delete': return 'warning'
      case 'warning': return 'warning'
      case 'info': return 'info'
      default: return 'info'
    }
  }
}

// 即时反馈服务
class FeedbackService {
  /**
   * 显示成功消息
   */
  success(message: string, duration: number = 3000) {
    ElMessage.success({
      message,
      duration,
      showClose: true
    })
  }

  /**
   * 显示错误消息
   */
  error(message: string, duration: number = 5000) {
    ElMessage.error({
      message,
      duration,
      showClose: true
    })
  }

  /**
   * 显示警告消息
   */
  warning(message: string, duration: number = 4000) {
    ElMessage.warning({
      message,
      duration,
      showClose: true
    })
  }

  /**
   * 显示信息消息
   */
  info(message: string, duration: number = 3000) {
    ElMessage.info({
      message,
      duration,
      showClose: true
    })
  }

  /**
   * 显示通知
   */
  notify(title: string, message: string, type: MessageType = 'info', duration: number = 4500) {
    ElNotification({
      title,
      message,
      type,
      duration,
      showClose: true
    })
  }

  /**
   * 显示确认对话框
   */
  async confirm(
    message: string,
    title: string = '确认操作',
    options: {
      type?: 'warning' | 'info' | 'error' | 'success'
      confirmButtonText?: string
      cancelButtonText?: string
    } = {}
  ): Promise<boolean> {
    try {
      await ElMessageBox.confirm(message, title, {
        type: options.type || 'warning',
        confirmButtonText: options.confirmButtonText || '确定',
        cancelButtonText: options.cancelButtonText || '取消',
        distinguishCancelAndClose: true
      })
      return true
    } catch {
      return false
    }
  }

  /**
   * 显示删除确认对话框
   */
  async confirmDelete(itemName: string = '该项'): Promise<boolean> {
    return this.confirm(
      `确定要删除${itemName}吗？此操作不可撤销！`,
      '删除确认',
      {
        type: 'error',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }
    )
  }

  /**
   * 显示批量操作确认对话框
   */
  async confirmBatch(operation: string, count: number): Promise<boolean> {
    return this.confirm(
      `确定要${operation}选中的 ${count} 项吗？`,
      '批量操作确认',
      {
        type: 'warning',
        confirmButtonText: `确定${operation}`,
        cancelButtonText: '取消'
      }
    )
  }

  /**
   * 显示操作成功反馈
   */
  operationSuccess(operation: string = '操作') {
    this.success(`${operation}成功`)
  }

  /**
   * 显示操作失败反馈
   */
  operationError(operation: string = '操作', error?: string) {
    this.error(`${operation}失败${error ? `: ${error}` : ''}`)
  }

  /**
   * 显示网络错误反馈
   */
  networkError() {
    this.error('网络连接异常，请检查网络设置')
  }

  /**
   * 显示服务器错误反馈
   */
  serverError() {
    this.error('服务器异常，请稍后重试')
  }

  /**
   * 显示表单验证错误
   */
  formValidationError(errors: string[]) {
    const message = errors.length === 1 
      ? errors[0] 
      : `表单验证失败 (${errors.length} 个错误)`
    
    this.error(message)
  }
}

// 操作反馈组合服务
class OperationFeedbackService {
  private confirmationService = new ConfirmationService()
  private feedbackService = new FeedbackService()

  // 组合确认和反馈的方法
  async confirmAndExecute<T>(
    confirmOptions: ConfirmOptions,
    executeFn: () => Promise<T>,
    successMessage?: string,
    errorMessage?: string
  ): Promise<T | null> {
    const confirmed = await this.confirmationService.showConfirm(confirmOptions)
    
    if (!confirmed) {
      return null
    }

    const loadingMessage = this.feedbackService.showLoading('正在处理...')
    
    try {
      const result = await executeFn()
      
      if (successMessage) {
        this.feedbackService.showSuccess(successMessage)
      }
      
      return result
    } catch (error) {
      if (errorMessage) {
        this.feedbackService.showError(errorMessage)
      } else {
        this.feedbackService.showError('操作失败')
      }
      return null
    } finally {
      this.feedbackService.closeProgress(loadingMessage)
    }
  }

  // 批量操作反馈
  async batchOperationFeedback<T>(
    items: T[],
    operationName: string,
    batchProcessor: (batch: T[], progress: (processed: number) => void) => Promise<void>,
    batchSize: number = 10
  ): Promise<boolean> {
    const confirmed = await this.confirmationService.showBatchConfirm(
      items.length,
      operationName
    )

    if (!confirmed) {
      return false
    }

    const progressMessage = this.feedbackService.showProgress({
      message: `正在${operationName} (${0}/${items.length})`,
      percentage: 0
    })

    try {
      let processed = 0
      
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        await batchProcessor(batch, (count) => {
          processed += count
          this.feedbackService.updateProgress(progressMessage, {
            message: `正在${operationName} (${processed}/${items.length})`,
            percentage: Math.round((processed / items.length) * 100)
          })
        })
      }

      this.feedbackService.updateProgress(progressMessage, {
        message: `${operationName}完成 (${items.length}/${items.length})`,
        percentage: 100,
        status: 'success'
      })

      this.feedbackService.showSuccess(`${operationName}成功完成`)
      return true
    } catch (error) {
      this.feedbackService.updateProgress(progressMessage, {
        message: `${operationName}失败`,
        percentage: 0,
        status: 'exception'
      })
      
      this.feedbackService.showError(`${operationName}过程中发生错误`)
      return false
    } finally {
      setTimeout(() => {
        this.feedbackService.closeProgress(progressMessage)
      }, 2000)
    }
  }

  // 获取子服务实例
  getConfirmationService(): ConfirmationService {
    return this.confirmationService
  }

  getFeedbackService(): FeedbackService {
    return this.feedbackService
  }
}

// 创建全局实例
export const confirmationService = new ConfirmationService()
export const feedbackService = new FeedbackService()
export const operationFeedbackService = new OperationFeedbackService()

// 组合式API钩子
export const useConfirmation = () => {
  return {
    showConfirm: confirmationService.showConfirm.bind(confirmationService),
    showDeleteConfirm: confirmationService.showDeleteConfirm.bind(confirmationService),
    showBatchConfirm: confirmationService.showBatchConfirm.bind(confirmationService),
    showDangerConfirm: confirmationService.showDangerConfirm.bind(confirmationService)
  }
}

export const useFeedback = () => {
  return {
    success: feedbackService.success.bind(feedbackService),
    error: feedbackService.error.bind(feedbackService),
    warning: feedbackService.warning.bind(feedbackService),
    info: feedbackService.info.bind(feedbackService),
    notify: feedbackService.notify.bind(feedbackService),
    confirm: feedbackService.confirm.bind(feedbackService),
    confirmDelete: feedbackService.confirmDelete.bind(feedbackService),
    confirmBatch: feedbackService.confirmBatch.bind(feedbackService),
    operationSuccess: feedbackService.operationSuccess.bind(feedbackService),
    operationError: feedbackService.operationError.bind(feedbackService),
    networkError: feedbackService.networkError.bind(feedbackService),
    serverError: feedbackService.serverError.bind(feedbackService),
    formValidationError: feedbackService.formValidationError.bind(feedbackService)
  }
}

export const useOperationFeedback = () => {
  return {
    confirmAndExecute: operationFeedbackService.confirmAndExecute.bind(operationFeedbackService),
    batchOperationFeedback: operationFeedbackService.batchOperationFeedback.bind(operationFeedbackService)
  }
}