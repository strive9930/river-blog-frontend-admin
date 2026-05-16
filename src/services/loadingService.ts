import { ref } from 'vue'
import type { Ref } from 'vue'

/**
 * 加载状态管理服务
 * 提供统一的加载状态控制和UI反馈
 */
class LoadingService {
  private loadingStates: Map<string, Ref<boolean>> = new Map()
  private globalLoading: Ref<boolean> = ref(false)

  /**
   * 创建或获取指定key的加载状态
   */
  useLoading(key: string = 'default'): Ref<boolean> {
    if (!this.loadingStates.has(key)) {
      this.loadingStates.set(key, ref(false))
    }
    return this.loadingStates.get(key)!
  }

  /**
   * 开始加载
   */
  start(key: string = 'default'): void {
    const loadingRef = this.useLoading(key)
    loadingRef.value = true
    
    // 如果是全局加载，也更新全局状态
    if (key === 'global') {
      this.globalLoading.value = true
    }
  }

  /**
   * 结束加载
   */
  stop(key: string = 'default'): void {
    const loadingRef = this.useLoading(key)
    loadingRef.value = false
    
    // 如果是全局加载，也更新全局状态
    if (key === 'global') {
      this.globalLoading.value = false
    }
  }

  /**
   * 切换加载状态
   */
  toggle(key: string = 'default'): void {
    const loadingRef = this.useLoading(key)
    loadingRef.value = !loadingRef.value
    
    // 如果是全局加载，也同步更新
    if (key === 'global') {
      this.globalLoading.value = loadingRef.value
    }
  }

  /**
   * 获取全局加载状态
   */
  getGlobalLoading(): Ref<boolean> {
    return this.globalLoading
  }

  /**
   * 执行带加载状态的异步操作
   */
  async withLoading<T>(
    asyncFn: () => Promise<T>,
    key: string = 'default',
    showError: boolean = true
  ): Promise<T> {
    this.start(key)
    try {
      const result = await asyncFn()
      return result
    } catch (error) {
      if (showError) {
        // 这里可以集成错误处理服务
        console.error('LoadingService error:', error)
      }
      throw error
    } finally {
      this.stop(key)
    }
  }

  /**
   * 清理所有加载状态
   */
  clear(): void {
    this.loadingStates.clear()
    this.globalLoading.value = false
  }
}

// 导出单例实例
export const loadingService = new LoadingService()

// 组合式函数，方便在组件中使用
export function useLoading(key: string = 'default') {
  const isLoading = loadingService.useLoading(key)
  
  return {
    isLoading,
    start: () => loadingService.start(key),
    stop: () => loadingService.stop(key),
    toggle: () => loadingService.toggle(key),
    withLoading: <T>(asyncFn: () => Promise<T>, showError: boolean = true) => 
      loadingService.withLoading(asyncFn, key, showError)
  }
}