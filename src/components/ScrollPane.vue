<template>
  <el-scrollbar ref="scrollContainer" class="scroll-container" @wheel.prevent="handleScroll">
    <slot />
  </el-scrollbar>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const tagSpacing = 4
const scrollContainer = ref()
const scrollWrapper = ref()

const emit = defineEmits(['scroll'])

const handleScroll = (e: WheelEvent) => {
  const eventDelta = (e as any).wheelDelta || -e.deltaY * 40
  const $scrollWrapper = scrollContainer.value.wrapRef
  $scrollWrapper.scrollLeft += eventDelta / 4
}

const moveToTarget = (currentTag: any) => {
  const $container = scrollContainer.value.$el
  const $containerWidth = $container.offsetWidth
  const $scrollWrapper = scrollContainer.value.wrapRef
  const tagList = document.querySelectorAll('.tags-view-item')

  let firstTag = null
  let lastTag = null

  // 查找第一个和最后一个标签
  if (tagList.length > 0) {
    firstTag = tagList[0]
    lastTag = tagList[tagList.length - 1]
  }

  if (firstTag === currentTag) {
    $scrollWrapper.scrollLeft = 0
  } else if (lastTag === currentTag) {
    $scrollWrapper.scrollLeft = $scrollWrapper.scrollWidth - $containerWidth
  } else {
    // 查找前一个兄弟元素
    const prevTag = currentTag.previousElementSibling

    // 标签的偏移距离
    const afterNextTagOffsetLeft = (currentTag.nextElementSibling as HTMLElement)?.offsetLeft || 0
    const beforePrevTagOffsetLeft = (prevTag as HTMLElement)?.offsetLeft || 0

    if (afterNextTagOffsetLeft > $scrollWrapper.scrollLeft + $containerWidth) {
      $scrollWrapper.scrollLeft = afterNextTagOffsetLeft - $containerWidth + tagSpacing
    } else if (beforePrevTagOffsetLeft < $scrollWrapper.scrollLeft) {
      $scrollWrapper.scrollLeft = beforePrevTagOffsetLeft - tagSpacing
    }
  }
}

defineExpose({
  moveToTarget
})
</script>

<style lang="scss" scoped>
.scroll-container {
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  width: 100%;

  :deep(.el-scrollbar__bar) {
    bottom: 0px;
  }

  :deep(.el-scrollbar__wrap) {
    height: 49px;
  }
}
</style>