<template>
  <el-card 
    class="responsive-card"
    :class="cardClasses"
    :style="cardStyles"
    v-bind="$attrs"
  >
    <template v-if="$slots.header" #header>
      <div class="card-header" :class="headerClasses">
        <slot name="header"></slot>
      </div>
    </template>
    
    <div class="card-body" :class="bodyClasses">
      <slot></slot>
    </div>
    
    <template v-if="$slots.footer" #footer>
      <div class="card-footer" :class="footerClasses">
        <slot name="footer"></slot>
      </div>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useResponsive } from '@/utils/responsiveUtils'

interface Props {
  hoverEffect?: boolean
  shadow?: 'always' | 'hover' | 'never'
  bordered?: boolean
  compact?: boolean
  headerAlign?: 'left' | 'center' | 'right'
  footerAlign?: 'left' | 'center' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  hoverEffect: true,
  shadow: 'hover',
  bordered: true,
  compact: false,
  headerAlign: 'left',
  footerAlign: 'right'
})

const { isMobile, isTablet } = useResponsive()

// 计算类名
const cardClasses = computed(() => {
  const classes = []
  
  if (props.hoverEffect) classes.push('hover-effect')
  if (props.compact) classes.push('compact')
  if (isMobile.value) classes.push('mobile')
  if (isTablet.value) classes.push('tablet')
  
  return classes
})

const headerClasses = computed(() => {
  return [`align-${props.headerAlign}`]
})

const bodyClasses = computed(() => {
  const classes = []
  if (props.compact) classes.push('compact')
  return classes
})

const footerClasses = computed(() => {
  return [`align-${props.footerAlign}`]
})

// 计算样式
const cardStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  if (props.shadow) {
    styles.boxShadow = props.shadow === 'always' 
      ? 'var(--el-box-shadow-light)' 
      : 'none'
  }
  
  return styles
})
</script>

<style scoped>
.responsive-card {
  width: 100%;
  transition: all 0.3s ease;
}

.responsive-card.hover-effect:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-light);
}

.responsive-card.compact {
  --el-card-padding: 12px;
}

.responsive-card.mobile {
  --el-card-padding: 10px;
  margin-bottom: 10px;
}

.responsive-card.tablet {
  --el-card-padding: 15px;
  margin-bottom: 15px;
}

.card-header {
  display: flex;
  align-items: center;
  min-height: 40px;
}

.card-header.align-left {
  justify-content: flex-start;
}

.card-header.align-center {
  justify-content: center;
}

.card-header.align-right {
  justify-content: flex-end;
}

.card-body {
  padding: var(--el-card-padding);
}

.card-body.compact {
  padding: 8px;
}

.card-footer {
  display: flex;
  align-items: center;
  min-height: 40px;
  border-top: 1px solid var(--el-border-color-light);
  padding: 10px var(--el-card-padding);
}

.card-footer.align-left {
  justify-content: flex-start;
}

.card-footer.align-center {
  justify-content: center;
}

.card-footer.align-right {
  justify-content: flex-end;
}

/* 响应式调整 */
@media (max-width: 767px) {
  .responsive-card {
    margin-bottom: 10px;
  }
  
  .card-header,
  .card-footer {
    min-height: 36px;
    padding: 8px 10px;
  }
  
  .card-body {
    padding: 10px;
  }
}

@media (min-width: 768px) and (max-width: 991px) {
  .responsive-card {
    margin-bottom: 15px;
  }
  
  .card-header,
  .card-footer {
    min-height: 38px;
  }
}

/* 暗色主题适配 */
html.dark .responsive-card {
  background-color: var(--el-bg-color-overlay);
  border-color: var(--el-border-color-dark);
}

html.dark .card-footer {
  border-top-color: var(--el-border-color-dark);
}
</style>