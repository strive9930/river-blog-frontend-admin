import { ref } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'

// 错误类型定义
export interface AppError {
  id: string
  message: string
  type: 'error' | 'warning' | 'info'
  timestamp: number
  code?: string
  stack?: string
}

// 错误处理服务
class ErrorHandlingService {
  private errors = ref<AppError[]>([])
  private maxErrors = 10 // 最大错误数量

  // 处理错误
  handleError(error: unknown, context?: string): void {
    const appError: AppError = {
      id: this.generateId(),
      message: this.formatErrorMessage(error, context),
      type: 'error',
      timestamp: Date.now(),
      code: this.getErrorCode(error),
      stack: this.getErrorStack(error)
    }

    // 添加到错误列表
    this.errors.value.unshift(appError)
    
    // 限制错误数量
    if (this.errors.value.length > this.maxErrors) {
      this.errors.value.pop()
    }

    // 显示用户友好的错误提示
    this.showUserFriendlyError(appError)
    
    // 记录到控制台
    console.error('Application Error:', {
      id: appError.id,
      message: appError.message,
      type: appError.type,
      code: appError.code,
      timestamp: new Date(appError.timestamp).toISOString()
    })
  }

  // 处理API错误
  handleApiError(response: any, operation: string): void {
    const errorMessage = response?.message || response?.data?.message || '操作失败'
    const errorCode = response?.code || response?.status
    
    const appError: AppError = {
      id: this.generateId(),
      message: `${operation}失败: ${errorMessage}`,
      type: 'error',
      timestamp: Date.now(),
      code: errorCode?.toString()
    }

    this.errors.value.unshift(appError)
    this.showUserFriendlyError(appError)
  }

  // 显示警告
  showWarning(message: string, duration: number = 3000): void {
    const warning: AppError = {
      id: this.generateId(),
      message,
      type: 'warning',
      timestamp: Date.now()
    }

    this.errors.value.unshift(warning)
    ElMessage.warning({
      message,
      duration,
      showClose: true
    })
  }

  // 显示信息提示
  showInfo(message: string, duration: number = 3000): void {
    const info: AppError = {
      id: this.generateId(),
      message,
      type: 'info',
      timestamp: Date.now()
    }

    this.errors.value.unshift(info)
    ElMessage.info({
      message,
      duration,
      showClose: true
    })
  }

  // 获取错误列表
  getErrors(): AppError[] {
    return [...this.errors.value]
  }

  // 清除错误
  clearErrors(): void {
    this.errors.value = []
  }

  // 清除特定错误
  clearError(errorId: string): void {
    this.errors.value = this.errors.value.filter(error => error.id !== errorId)
  }

  // 私有方法
  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private formatErrorMessage(error: unknown, context?: string): string {
    let message = '未知错误'

    if (error instanceof Error) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = (error as any).message
    }

    return context ? `${context}: ${message}` : message
  }

  private getErrorCode(error: unknown): string | undefined {
    if (error && typeof error === 'object' && 'code' in error) {
      return (error as any).code?.toString()
    }
    return undefined
  }

  private getErrorStack(error: unknown): string | undefined {
    if (error instanceof Error) {
      return error.stack
    }
    return undefined
  }

  private showUserFriendlyError(error: AppError): void {
    const duration = error.type === 'error' ? 5000 : 3000
    
    ElNotification({
      title: this.getErrorTitle(error.type),
      message: error.message,
      type: error.type,
      duration,
      dangerouslyUseHTMLString: false,
      showClose: true
    })
  }

  private getErrorTitle(type: AppError['type']): string {
    switch (type) {
      case 'error': return '错误'
      case 'warning': return '警告'
      case 'info': return '提示'
      default: return '通知'
    }
  }

  private logDetailedError(appError: AppError, originalError: unknown, context?: string): void {
    // 基本错误信息
    const basicInfo = {
      id: appError.id,
      message: appError.message,
      type: appError.type,
      code: appError.code,
      timestamp: new Date(appError.timestamp).toISOString(),
      context: context || '无上下文'
    }

    // 原始错误详情
    let errorDetails: any = {}
    
    if (originalError instanceof Error) {
      errorDetails = {
        name: originalError.name,
        message: originalError.message,
        stack: originalError.stack
      }
    } else if (originalError && typeof originalError === 'object') {
      try {
        errorDetails = JSON.parse(JSON.stringify(originalError, null, 2))
      } catch (e) {
        errorDetails = {
          type: typeof originalError,
          value: String(originalError)
        }
      }
    } else {
      errorDetails = {
        type: typeof originalError,
        value: String(originalError)
      }
    }

    // 输出到控制台
    console.groupCollapsed(`🚨 应用错误 [${basicInfo.timestamp}]`)
    console.error('基本信息:', basicInfo)
    console.error('详细信息:', errorDetails)
    console.groupEnd()
  }
}

// 创建全局实例
export const errorHandlingService = new ErrorHandlingService()

// 组合式API钩子
export const useErrorHandler = () => {
  return {
    errors: errorHandlingService.getErrors(),
    handleError: errorHandlingService.handleError.bind(errorHandlingService),
    handleApiError: errorHandlingService.handleApiError.bind(errorHandlingService),
    showWarning: errorHandlingService.showWarning.bind(errorHandlingService),
    showInfo: errorHandlingService.showInfo.bind(errorHandlingService),
    clearErrors: errorHandlingService.clearErrors.bind(errorHandlingService),
    clearError: errorHandlingService.clearError.bind(errorHandlingService)
  }
}

// 全局错误处理器
export const setupGlobalErrorHandler = () => {
  // 记录错误处理服务初始化
  console.log('🔧 全局错误处理器已初始化')
  
  // 捕获未处理的Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    console.groupCollapsed('🚨 未处理的Promise拒绝')
    console.warn('拒绝原因:', event.reason)
    console.warn('Promise:', event.promise)
    console.groupEnd()
    
    // 特殊处理Vue相关的vnode错误
    if (event.reason && typeof event.reason === 'object') {
      if (event.reason.message && event.reason.message.includes('Cannot destructure property')) {
        console.error('检测到Vue vnode解构错误，可能是组件渲染问题')
        // 尝试提供更多上下文信息
        console.error('错误详情:', {
          message: event.reason.message,
          stack: event.reason.stack,
          name: event.reason.name
        })
      }
    }
    
    errorHandlingService.handleError(event.reason, '未处理的异步错误')
    event.preventDefault()
  })

  // 捕获全局JavaScript错误
  window.addEventListener('error', (event) => {
    console.groupCollapsed('💥 JavaScript运行时错误')
    console.error('错误对象:', event.error)
    console.error('错误信息:', event.message)
    console.error('文件:', event.filename)
    console.error('行号:', event.lineno)
    console.error('列号:', event.colno)
    console.groupEnd()
    errorHandlingService.handleError(event.error, 'JavaScript运行时错误')
  })

  // Vue特定错误处理
  if (window.Vue) {
    // @ts-ignore
    window.Vue.config.errorHandler = (err: any, vm: any, info: string) => {
      console.groupCollapsed('🔥 Vue组件错误')
      console.error('错误:', err)
      console.error('组件:', vm?.$options?.name || 'Unknown')
      console.error('错误信息:', info)
      console.groupEnd()
      errorHandlingService.handleError(err, `Vue组件错误: ${info}`)
    }
  }

  // 监控常见的错误模式
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            if (element.tagName === 'SCRIPT' && element.hasAttribute('src')) {
              const scriptSrc = element.getAttribute('src')
              if (scriptSrc && scriptSrc.includes('error')) {
                console.warn('检测到可能的错误脚本:', scriptSrc)
              }
            }
          }
        })
      }
    })
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
}