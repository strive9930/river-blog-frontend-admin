<template>
  <div v-if="!item.hidden">
    <template v-if="hasOneShowingChild(item.children, item) && (!onlyOneChild.children || onlyOneChild.noShowingChildren) && !item.alwaysShow">
      <app-link v-if="onlyOneChild.meta" :to="resolvePath(onlyOneChild.path)">
        <el-menu-item :index="resolvePath(onlyOneChild.path)" :class="{ 'submenu-title-noDropdown': !isNest }">
          <el-icon v-if="onlyOneChild.meta && onlyOneChild.meta.icon">
            <component :is="onlyOneChild.meta.icon" />
          </el-icon>
          <template #title>
            <span v-if="onlyOneChild.meta">{{ onlyOneChild.meta.title }}</span>
            <span v-else>未命名菜单</span>
          </template>
        </el-menu-item>
      </app-link>
    </template>

    <el-sub-menu v-else ref="subMenu" :index="resolvePath(item.path)" popper-append-to-body>
      <template #title>
        <el-icon v-if="item.meta && item.meta.icon">
          <component :is="item.meta.icon" />
        </el-icon>
        <span v-if="item.meta">{{ item.meta.title }}</span>
        <span v-else>未命名菜单组</span>
      </template>
      
      <sidebar-item
        v-for="child in item.children"
        :key="child.path"
        :is-nest="true"
        :item="child"
        :base-path="resolvePath(child.path)"
        class="nest-menu"
      />
    </el-sub-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { isExternal } from '@/utils/validate'
import AppLink from './AppLink.vue'

interface Props {
  item: any
  isNest?: boolean
  basePath: string
}

const props = withDefaults(defineProps<Props>(), {
  isNest: false
})

const onlyOneChild = ref<any>({})

const hasOneShowingChild = (children: any[] = [], parent: any) => {
  const showingChildren = children.filter(item => {
    if (item.hidden) {
      return false
    } else {
      // Temp set(will be used if only has one showing child)
      onlyOneChild.value = item
      return true
    }
  })

  // When there is only one child router, the child router is displayed by default
  if (showingChildren.length === 1) {
    return true
  }

  // Show parent if there are no child router to display
  if (showingChildren.length === 0) {
    onlyOneChild.value = { ...parent, path: '', noShowingChildren: true }
    return true
  }

  return false
}

const resolvePath = (routePath: string) => {
  if (isExternal(routePath)) {
    return routePath
  }
  if (isExternal(props.basePath)) {
    return props.basePath
  }
  return `${props.basePath}/${routePath}`.replace(/\/+/g, '/')
}
</script>

<style scoped>
.submenu-title-noDropdown {
  background-color: #2b2f3a !important;
}

.nest-menu .el-menu-item {
  min-width: 200px !important;
  background-color: #1f2d3d !important;
}

.nest-menu .el-menu-item:hover {
  background-color: #001528 !important;
}

.nest-menu .el-menu-item.is-active {
  background-color: #409eff !important;
}
</style>