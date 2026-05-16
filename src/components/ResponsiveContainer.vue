<template>
  <div 
    class="responsive-container"
    :class="containerClasses"
    :style="containerStyles"
  >
    <slot :responsive="responsive"></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useResponsive } from '@/utils/responsiveUtils'

interface Props {
  fluid?: boolean
  maxWidth?: string
  padding?: string | number
  gap?: string | number
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
}

const props = withDefaults(defineProps<Props>(), {
  fluid: false,
  maxWidth: '1200px',
  padding: undefined,
  gap: undefined,
  flexDirection: 'row'
})

const { state: responsive, isMobile, isTablet, isDesktop } = useResponsive()

// 计算容器类名
const containerClasses = computed(() => {
  const classes = ['responsive-container']
  
  if (props.fluid) classes.push('fluid')
  if (isMobile.value) classes.push('mobile')
  if (isTablet.value) classes.push('tablet')
  if (isDesktop.value) classes.push('desktop')
  
  return classes
})

// 计算容器样式
const containerStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  // 最大宽度
  if (!props.fluid) {
    styles.maxWidth = props.maxWidth
  }
  
  // 内边距
  if (props.padding !== undefined) {
    styles.padding = typeof props.padding === 'number' 
      ? `${props.padding}px` 
      : props.padding
  } else {
    // 响应式内边距
    if (isMobile.value) {
      styles.padding = '10px'
    } else if (isTablet.value) {
      styles.padding = '15px'
    } else {
      styles.padding = '20px'
    }
  }
  
  // 间距
  if (props.gap !== undefined) {
    styles.gap = typeof props.gap === 'number' 
      ? `${props.gap}px` 
      : props.gap
  } else {
    // 响应式间距
    if (isMobile.value) {
      styles.gap = '10px'
    } else if (isTablet.value) {
      styles.gap = '15px'
    } else {
      styles.gap = '20px'
    }
  }
  
  // 弹性布局方向
  styles.flexDirection = props.flexDirection
  
  return styles
})
</script>

<style scoped>
.responsive-container {
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
}

.responsive-container.fluid {
  max-width: none;
}

/* 响应式断点 */
@media (max-width: 575px) {
  .responsive-container {
    flex-direction: column;
  }
  
  .responsive-container:not(.fluid) {
    max-width: 100%;
  }
}

@media (min-width: 576px) and (max-width: 767px) {
  .responsive-container.mobile {
    flex-direction: column;
  }
}

@media (min-width: 768px) and (max-width: 991px) {
  .responsive-container.tablet {
    flex-direction: row;
  }
}

@media (min-width: 992px) {
  .responsive-container.desktop {
    flex-direction: row;
  }
}
</style>