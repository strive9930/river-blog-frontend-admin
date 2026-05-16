import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

// 键盘快捷键配置
export interface ShortcutConfig {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  handler: (event: KeyboardEvent) => void
  description?: string
}

// 动画配置
export interface AnimationConfig {
  duration?: number
  easing?: string
  delay?: number
}

// 无障碍支持配置
export interface AccessibilityConfig {
  autoFocus?: boolean
  ariaLabel?: string
  role?: string
  tabIndex?: number
}

// 键盘快捷键管理组合式API
export function useKeyboardShortcuts() {
  const shortcuts = ref<ShortcutConfig[]>([])
  const isActive = ref(true)

  const registerShortcut = (config: ShortcutConfig) => {
    shortcuts.value.push(config)
  }

  const unregisterShortcut = (key: string, modifiers: Partial<Pick<ShortcutConfig, 'ctrl' | 'shift' | 'alt' | 'meta'>> = {}) => {
    shortcuts.value = shortcuts.value.filter(shortcut => {
      return !(shortcut.key === key && 
               shortcut.ctrl === (modifiers.ctrl ?? false) &&
               shortcut.shift === (modifiers.shift ?? false) &&
               shortcut.alt === (modifiers.alt ?? false) &&
               shortcut.meta === (modifiers.meta ?? false))
    })
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isActive.value) return

    const matchedShortcut = shortcuts.value.find(shortcut => {
      return shortcut.key === event.key.toLowerCase() &&
             shortcut.ctrl === event.ctrlKey &&
             shortcut.shift === event.shiftKey &&
             shortcut.alt === event.altKey &&
             shortcut.meta === event.metaKey
    })

    if (matchedShortcut) {
      event.preventDefault()
      matchedShortcut.handler(event)
    }
  }

  const enableShortcuts = () => {
    isActive.value = true
  }

  const disableShortcuts = () => {
    isActive.value = false
  }

  // 注册全局事件监听器
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  const getActiveShortcuts = computed(() => {
    return shortcuts.value.filter(shortcut => shortcut.description)
  })

  return {
    shortcuts,
    isActive,
    registerShortcut,
    unregisterShortcut,
    enableShortcuts,
    disableShortcuts,
    getActiveShortcuts,
    handleKeyDown
  }
}

// 动画效果组合式API
export function useAnimations() {
  const isAnimating = ref(false)
  const animationProgress = ref(0)

  // 淡入淡出动画
  const fadeInOut = async (
    element: HTMLElement,
    config: AnimationConfig = {}
  ): Promise<void> => {
    const { duration = 300, easing = 'ease-in-out', delay = 0 } = config
    
    isAnimating.value = true
    animationProgress.value = 0

    return new Promise((resolve) => {
      setTimeout(() => {
        element.style.transition = `opacity ${duration}ms ${easing}`
        element.style.opacity = '0'
        
        setTimeout(() => {
          element.style.opacity = '1'
          animationProgress.value = 100
          isAnimating.value = false
          resolve()
        }, duration)
      }, delay)
    })
  }

  // 滑动动画
  const slideIn = async (
    element: HTMLElement,
    direction: 'left' | 'right' | 'top' | 'bottom' = 'left',
    config: AnimationConfig = {}
  ): Promise<void> => {
    const { duration = 300, easing = 'ease-out', delay = 0 } = config
    
    isAnimating.value = true
    const axis = direction === 'left' || direction === 'right' ? 'X' : 'Y'
    const sign = direction === 'left' || direction === 'top' ? '-' : ''
    
    return new Promise((resolve) => {
      setTimeout(() => {
        element.style.transition = `transform ${duration}ms ${easing}`
        element.style.transform = `translate${axis}(0)`
        
        setTimeout(() => {
          isAnimating.value = false
          resolve()
        }, duration)
      }, delay)
    })
  }

  // 缩放动画
  const scale = async (
    element: HTMLElement,
    scaleFrom: number,
    scaleTo: number,
    config: AnimationConfig = {}
  ): Promise<void> => {
    const { duration = 300, easing = 'ease-in-out', delay = 0 } = config
    
    isAnimating.value = true
    
    return new Promise((resolve) => {
      setTimeout(() => {
        element.style.transition = `transform ${duration}ms ${easing}`
        element.style.transform = `scale(${scaleTo})`
        
        setTimeout(() => {
          isAnimating.value = false
          resolve()
        }, duration)
      }, delay)
    })
  }

  // 抖动动画
  const shake = async (
    element: HTMLElement,
    intensity: number = 5,
    config: AnimationConfig = {}
  ): Promise<void> => {
    const { duration = 500, delay = 0 } = config
    
    isAnimating.value = true
    const originalTransform = element.style.transform
    
    return new Promise((resolve) => {
      setTimeout(() => {
        let startTime: number
        const animate = (timestamp: number) => {
          if (!startTime) startTime = timestamp
          const elapsed = timestamp - startTime
          const progress = Math.min(elapsed / duration, 1)
          
          if (progress < 1) {
            const shakeAmount = intensity * (1 - progress) * Math.sin(progress * 20)
            element.style.transform = `${originalTransform} translateX(${shakeAmount}px)`
            requestAnimationFrame(animate)
          } else {
            element.style.transform = originalTransform
            isAnimating.value = false
            resolve()
          }
        }
        
        requestAnimationFrame(animate)
      }, delay)
    })
  }

  // 自定义关键帧动画
  const keyframeAnimation = async (
    element: HTMLElement,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions
  ): Promise<Animation> => {
    isAnimating.value = true
    
    const animation = element.animate(keyframes, options)
    
    animation.onfinish = () => {
      isAnimating.value = false
    }
    
    return animation
  }

  return {
    isAnimating,
    animationProgress,
    fadeInOut,
    slideIn,
    scale,
    shake,
    keyframeAnimation
  }
}

// 无障碍支持组合式API
export function useAccessibility(config: AccessibilityConfig = {}) {
  const { autoFocus = false, ariaLabel, role, tabIndex = 0 } = config
  
  const isFocused = ref(false)
  const hasError = ref(false)
  const errorMessage = ref('')

  // 焦点管理
  const focus = (element: HTMLElement | null) => {
    if (element) {
      element.focus()
      isFocused.value = true
    }
  }

  const blur = (element: HTMLElement | null) => {
    if (element) {
      element.blur()
      isFocused.value = false
    }
  }

  // 键盘导航支持
  const handleKeyDown = (event: KeyboardEvent, element: HTMLElement) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        element.click()
        break
      case 'Escape':
        blur(element)
        break
    }
  }

  // 屏幕阅读器支持
  const setAriaAttributes = (element: HTMLElement) => {
    if (ariaLabel) element.setAttribute('aria-label', ariaLabel)
    if (role) element.setAttribute('role', role)
    element.setAttribute('tabindex', tabIndex.toString())
    
    if (hasError.value) {
      element.setAttribute('aria-invalid', 'true')
      if (errorMessage.value) {
        element.setAttribute('aria-describedby', 'error-message')
      }
    }
  }

  // 动态内容更新通知
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    // 清理元素
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  // 高对比度模式检测
  const isHighContrastMode = computed(() => {
    // 简化的高对比度检测
    const testElement = document.createElement('div')
    testElement.style.backgroundColor = 'rgb(0,0,0)'
    testElement.style.color = 'rgb(255,255,255)'
    document.body.appendChild(testElement)
    
    const computedStyle = window.getComputedStyle(testElement)
    const bgColor = computedStyle.backgroundColor
    const textColor = computedStyle.color
    
    document.body.removeChild(testElement)
    
    // 如果背景色和文字颜色相同，可能处于高对比度模式
    return bgColor === textColor
  })

  // 文本缩放支持
  const getTextScale = () => {
    return parseFloat(getComputedStyle(document.documentElement).fontSize) / 16
  }

  return {
    isFocused,
    hasError,
    errorMessage,
    isHighContrastMode,
    focus,
    blur,
    handleKeyDown,
    setAriaAttributes,
    announceToScreenReader,
    getTextScale
  }
}

// 拖拽功能组合式API
export interface DragDropConfig {
  draggable?: boolean
  droppable?: boolean
  dragEffect?: 'copy' | 'move' | 'link'
  onDragStart?: (event: DragEvent, data: any) => void
  onDragOver?: (event: DragEvent) => void
  onDrop?: (event: DragEvent, data: any) => void
}

export function useDragDrop<T>(config: DragDropConfig = {}) {
  const { 
    draggable = true, 
    droppable = true, 
    dragEffect = 'move',
    onDragStart,
    onDragOver,
    onDrop 
  } = config
  
  const isDragging = ref(false)
  const dragData = ref<T | null>(null)

  const handleDragStart = (event: DragEvent, data: T) => {
    if (!draggable) return
    
    isDragging.value = true
    dragData.value = data
    
    event.dataTransfer!.effectAllowed = dragEffect
    event.dataTransfer!.setData('text/plain', JSON.stringify(data))
    
    onDragStart?.(event, data)
  }

  const handleDragOver = (event: DragEvent) => {
    if (!droppable) return
    
    event.preventDefault()
    event.dataTransfer!.dropEffect = dragEffect
    
    onDragOver?.(event)
  }

  const handleDrop = (event: DragEvent) => {
    if (!droppable) return
    
    event.preventDefault()
    isDragging.value = false
    
    try {
      const data = JSON.parse(event.dataTransfer!.getData('text/plain')) as T
      onDrop?.(event, data)
    } catch (error) {
      console.error('Failed to parse dropped data:', error)
    }
    
    dragData.value = null
  }

  const handleDragEnd = () => {
    isDragging.value = false
    dragData.value = null
  }

  return {
    isDragging,
    dragData,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd
  }
}

// 主题切换组合式API
export type Theme = 'light' | 'dark' | 'auto'

export function useTheme() {
  const currentTheme = ref<Theme>('auto')
  const isDarkMode = ref(false)

  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
    applyTheme(theme)
    localStorage.setItem('theme', theme)
  }

  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'auto']
    const currentIndex = themes.indexOf(currentTheme.value)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const applyTheme = (theme: Theme) => {
    const html = document.documentElement
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      isDarkMode.value = prefersDark
      html.classList.toggle('dark', prefersDark)
    } else {
      isDarkMode.value = theme === 'dark'
      html.classList.toggle('dark', theme === 'dark')
    }
  }

  // 初始化主题
  onMounted(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // 检测系统偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (currentTheme.value === 'auto') {
        applyTheme('auto')
      }
    })
  })

  return {
    currentTheme,
    isDarkMode,
    setTheme,
    toggleTheme,
    applyTheme
  }
}