<template>
  <div class="tags-view-container">
    <scroll-pane ref="scrollPaneRef" class="tags-view-wrapper">
      <router-link
        v-for="tag in visitedViews"
        ref="tagRefs"
        :key="tag.path"
        :class="isActive(tag) ? 'active' : ''"
        :to="{ path: tag.path, query: tag.query, params: tag.params }"
        class="tags-view-item"
        @click.middle="!isAffix(tag) ? closeSelectedTag(tag) : ''"
        @contextmenu.prevent="openMenu(tag, $event)"
      >
        {{ tag.title }}
        <el-icon
          v-if="!isAffix(tag)"
          class="el-icon-close"
          @click.prevent.stop="closeSelectedTag(tag)"
        >
          <Close />
        </el-icon>
      </router-link>
    </scroll-pane>
    
    <!-- 右键菜单 -->
    <ul v-show="visible" :style="{ left: left + 'px', top: top + 'px' }" class="contextmenu">
      <li @click="refreshSelectedTag(selectedTag)">
        <el-icon><Refresh /></el-icon>
        刷新
      </li>
      <li v-if="!isAffix(selectedTag)" @click="closeSelectedTag(selectedTag)">
        <el-icon><Close /></el-icon>
        关闭
      </li>
      <li @click="closeOthersTags">
        <el-icon><CircleClose /></el-icon>
        关闭其他
      </li>
      <li @click="closeAllTags(selectedTag)">
        <el-icon><FolderDelete /></el-icon>
        关闭所有
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTagsViewStore } from '@/store/modules/tagsView'
import ScrollPane from './ScrollPane.vue'
import type { TagView } from '@/store/modules/tagsView'

const route = useRoute()
const router = useRouter()
const tagsViewStore = useTagsViewStore()

// 响应式数据
const visible = ref(false)
const top = ref(0)
const left = ref(0)
const selectedTag = ref<TagView>({} as TagView)
const scrollPaneRef = ref()
const tagRefs = ref()

// 计算属性
const visitedViews = tagsViewStore.visitedViewsList

// 方法
const isActive = (tag: TagView) => {
  return tag.path === route.path
}

const isAffix = (tag: TagView) => {
  return tag.meta?.affix
}

const filterAffixTags = (routes: any[]) => {
  const tags: TagView[] = []
  routes.forEach(route => {
    if (route.meta && route.meta.affix) {
      const tagPath = route.path
      tags.push({
        name: route.name,
        path: tagPath,
        title: route.meta.title,
        meta: { ...route.meta }
      })
    }
  })
  return tags
}

const initTags = () => {
  const affixTags = filterAffixTags(router.options.routes as any[])
  for (const tag of affixTags) {
    // 必须有名字
    if (tag.name) {
      tagsViewStore.addVisitedView(tag as any)
    }
  }
}

const addTags = () => {
  const { name } = route
  if (name) {
    tagsViewStore.addVisitedView(route)
  }
  return false
}

const moveToCurrentTag = () => {
  nextTick(() => {
    for (const tag of tagRefs.value) {
      if ((tag.to as any).path === route.path) {
        scrollPaneRef.value.moveToTarget(tag)
        // 当查询不同时，更新
        if ((tag.to as any).fullPath !== route.fullPath) {
          tagsViewStore.updateVisitedView(route)
        }
        break
      }
    }
  })
}

const refreshSelectedTag = (view: TagView) => {
  const { fullPath } = view
  nextTick(() => {
    router.replace({
      path: '/redirect' + fullPath
    })
  })
}

const closeSelectedTag = (view: TagView) => {
  tagsViewStore.delVisitedView(view).then((visitedViews: TagView[]) => {
    if (isActive(view)) {
      toLastView(visitedViews, view)
    }
  })
}

const closeOthersTags = () => {
  router.push(selectedTag.value)
  tagsViewStore.delOthersVisitedViews(selectedTag.value).then(() => {
    moveToCurrentTag()
  })
}

const closeAllTags = (view: TagView) => {
  tagsViewStore.delAllVisitedViews().then((visitedViews: TagView[]) => {
    if (visitedViews.some(tag => tag.path === view.path)) {
      return
    }
    toLastView(visitedViews, view)
  })
}

const toLastView = (visitedViews: TagView[], view: TagView) => {
  const latestView = visitedViews.slice(-1)[0]
  if (latestView) {
    router.push(latestView)
  } else {
    // 现在至少有一个固定标签
    if (view.name === 'Dashboard') {
      // 重新加载主页
      router.replace({ path: '/redirect' + view.path })
    } else {
      router.push('/')
    }
  }
}

const openMenu = (tag: TagView, e: MouseEvent) => {
  const menuMinWidth = 105
  const offsetLeft = scrollPaneRef.value.$el.getBoundingClientRect().left // 容器距左边界距离
  const offsetWidth = scrollPaneRef.value.$el.offsetWidth // 容器宽度
  const maxLeft = offsetWidth - menuMinWidth // 左边最大距离
  const leftVal = e.clientX - offsetLeft + 15 // 15: margin right

  if (leftVal > maxLeft) {
    left.value = maxLeft
  } else {
    left.value = leftVal
  }

  top.value = e.clientY
  visible.value = true
  selectedTag.value = tag
}

const closeMenu = () => {
  visible.value = false
}

// 监听器
watch(route, () => {
  addTags()
  moveToCurrentTag()
})

// 组件挂载
initTags()
addTags()

// 全局点击关闭右键菜单
document.addEventListener('click', closeMenu)
</script>

<style lang="scss" scoped>
.tags-view-container {
  height: 44px;
  width: 100%;
  background: #fff;
  border-bottom: 1px solid #d8dce5;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.12), 0 0 3px 0 rgba(0, 0, 0, 0.04);

  .tags-view-wrapper {
    .tags-view-item {
      display: inline-block;
      position: relative;
      cursor: pointer;
      height: 26px;
      line-height: 26px;
      border: 1px solid #d8dce5;
      color: #495060;
      background: #fff;
      padding: 0 8px;
      font-size: 12px;
      margin-left: 5px;
      margin-top: 7px;

      &:first-of-type {
        margin-left: 15px;
      }

      &:last-of-type {
        margin-right: 15px;
      }

      &.active {
        background-color: #409eff;
        color: #fff;
        border-color: #409eff;

        &::before {
          content: '';
          background: #fff;
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          position: relative;
          margin-right: 2px;
        }
      }
    }
  }

  .contextmenu {
    margin: 0;
    background: #fff;
    z-index: 3000;
    position: absolute;
    list-style-type: none;
    padding: 5px 0;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    color: #333;
    box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, 0.3);

    li {
      margin: 0;
      padding: 7px 16px;
      cursor: pointer;

      &:hover {
        background: #eee;
      }

      .el-icon {
        margin-right: 5px;
      }
    }
  }
}
</style>