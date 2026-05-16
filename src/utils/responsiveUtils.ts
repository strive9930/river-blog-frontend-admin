// 响应式断点定义
export const breakpoints = {
  xs: 0,      // 超小屏 (手机竖屏)
  sm: 576,    // 小屏 (手机横屏)
  md: 768,    // 中屏 (平板)
  lg: 992,    // 大屏 (桌面)
  xl: 1200,   // 超大屏 (宽屏桌面)
  xxl: 1600   // 超超大屏 (超宽屏)
} as const

// 屏幕尺寸类型
export type ScreenSize = keyof typeof breakpoints

// 响应式状态
export interface ResponsiveState {
  width: number
  height: number
  screenSize: ScreenSize
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isWideScreen: boolean
}

// 响应式媒体查询
export const mediaQueries = {
  xs: `(max-width: ${breakpoints.sm - 1}px)`,
  sm: `(min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.md - 1}px)`,
  md: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  lg: `(min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xl - 1}px)`,
  xl: `(min-width: ${breakpoints.xl}px) and (max-width: ${breakpoints.xxl - 1}px)`,
  xxl: `(min-width: ${breakpoints.xxl}px)`,
  mobile: `(max-width: ${breakpoints.md - 1}px)`,
  tablet: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  desktop: `(min-width: ${breakpoints.lg}px)`
}

// 响应式工具类
class ResponsiveUtils {
  private state: ResponsiveState = {
    width: 0,
    height: 0,
    screenSize: 'xs',
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    isWideScreen: false
  }

  private listeners: Array<(state: ResponsiveState) => void> = []
  private resizeObserver: ResizeObserver | null = null

  constructor() {
    this.updateState()
    this.setupListeners()
  }

  // 获取当前响应式状态
  getState(): ResponsiveState {
    return { ...this.state }
  }

  // 获取屏幕尺寸
  getScreenSize(): ScreenSize {
    return this.state.screenSize
  }

  // 检查是否为移动设备
  isMobile(): boolean {
    return this.state.isMobile
  }

  // 检查是否为平板设备
  isTablet(): boolean {
    return this.state.isTablet
  }

  // 检查是否为桌面设备
  isDesktop(): boolean {
    return this.state.isDesktop
  }

  // 检查是否为宽屏
  isWideScreen(): boolean {
    return this.state.isWideScreen
  }

  // 根据断点检查屏幕尺寸
  isScreenSize(size: ScreenSize): boolean {
    return this.state.screenSize === size
  }

  // 添加状态变化监听器
  addListener(callback: (state: ResponsiveState) => void): void {
    this.listeners.push(callback)
  }

  // 移除状态变化监听器
  removeListener(callback: (state: ResponsiveState) => void): void {
    const index = this.listeners.indexOf(callback)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  // 根据屏幕尺寸获取合适的值
  getValue<T>(values: Partial<Record<ScreenSize, T>>): T | undefined {
    const orderedSizes: ScreenSize[] = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs']
    
    for (const size of orderedSizes) {
      if (this.isScreenSize(size) && values[size] !== undefined) {
        return values[size]
      }
    }
    
    return values.xs // 默认返回最小尺寸的值
  }

  // 获取列数配置
  getGridColumns(defaultCols: number = 24): number {
    const columns: Record<ScreenSize, number> = {
      xs: 24,
      sm: 24,
      md: 12,
      lg: 8,
      xl: 6,
      xxl: 4
    }
    
    return this.getValue(columns) || defaultCols
  }

  // 获取间距配置
  getSpacing(defaultSpacing: number = 20): number {
    const spacing: Record<ScreenSize, number> = {
      xs: 10,
      sm: 15,
      md: 20,
      lg: 25,
      xl: 30,
      xxl: 35
    }
    
    return this.getValue(spacing) || defaultSpacing
  }

  // 私有方法
  private updateState(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    
    let screenSize: ScreenSize = 'xs'
    let isMobile = false
    let isTablet = false
    let isDesktop = false
    let isWideScreen = false

    if (width >= breakpoints.xxl) {
      screenSize = 'xxl'
      isWideScreen = true
      isDesktop = true
    } else if (width >= breakpoints.xl) {
      screenSize = 'xl'
      isDesktop = true
    } else if (width >= breakpoints.lg) {
      screenSize = 'lg'
      isDesktop = true
    } else if (width >= breakpoints.md) {
      screenSize = 'md'
      isTablet = true
    } else if (width >= breakpoints.sm) {
      screenSize = 'sm'
      isMobile = true
    } else {
      screenSize = 'xs'
      isMobile = true
    }

    const newState: ResponsiveState = {
      width,
      height,
      screenSize,
      isMobile,
      isTablet,
      isDesktop,
      isWideScreen
    }

    // 检查状态是否发生变化
    if (JSON.stringify(this.state) !== JSON.stringify(newState)) {
      this.state = newState
      this.notifyListeners()
    }
  }

  private setupListeners(): void {
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize.bind(this))
    
    // 使用 ResizeObserver 监听容器变化（如果支持）
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateState()
      })
      this.resizeObserver.observe(document.body)
    }
  }

  private handleResize(): void {
    // 使用防抖避免频繁更新
    clearTimeout(this.resizeTimer)
    this.resizeTimer = setTimeout(() => {
      this.updateState()
    }, 100)
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state))
  }

  private resizeTimer: number = 0
}

// 创建全局实例
export const responsiveUtils = new ResponsiveUtils()

// 组合式API钩子
export const useResponsive = () => {
  const state = ref(responsiveUtils.getState())

  const updateState = () => {
    state.value = responsiveUtils.getState()
  }

  onMounted(() => {
    responsiveUtils.addListener(updateState)
  })

  onUnmounted(() => {
    responsiveUtils.removeListener(updateState)
  })

  return {
    state,
    isMobile: computed(() => state.value.isMobile),
    isTablet: computed(() => state.value.isTablet),
    isDesktop: computed(() => state.value.isDesktop),
    isWideScreen: computed(() => state.value.isWideScreen),
    screenSize: computed(() => state.value.screenSize),
    getValue: responsiveUtils.getValue.bind(responsiveUtils),
    getGridColumns: responsiveUtils.getGridColumns.bind(responsiveUtils),
    getSpacing: responsiveUtils.getSpacing.bind(responsiveUtils)
  }
}

// 响应式CSS工具类生成器
export const generateResponsiveClasses = () => {
  const classes: string[] = []
  
  const state = responsiveUtils.getState()
  
  classes.push(`screen-${state.screenSize}`)
  
  if (state.isMobile) classes.push('mobile')
  if (state.isTablet) classes.push('tablet')
  if (state.isDesktop) classes.push('desktop')
  if (state.isWideScreen) classes.push('wide-screen')
  
  return classes.join(' ')
}

// 响应式样式混入
export const responsiveMixin = {
  data() {
    return {
      responsiveState: responsiveUtils.getState()
    }
  },
  
  mounted() {
    responsiveUtils.addListener(this.updateResponsiveState)
  },
  
  beforeUnmount() {
    responsiveUtils.removeListener(this.updateResponsiveState)
  },
  
  methods: {
    updateResponsiveState(state: ResponsiveState) {
      this.responsiveState = state
    },
    
    isMobile() {
      return this.responsiveState.isMobile
    },
    
    isTablet() {
      return this.responsiveState.isTablet
    },
    
    isDesktop() {
      return this.responsiveState.isDesktop
    }
  }
}