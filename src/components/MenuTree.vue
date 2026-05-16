<template>
  <div class="menu-tree">
    <el-menu
      :default-active="activeMenu"
      class="menu-container"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409eff"
      :collapse="isCollapse"
      :unique-opened="true"
      :collapse-transition="false"
      mode="vertical"
    >
      <template v-for="menuItem in menuItems" :key="menuItem.id">
        <!-- 菜单组 -->
        <el-sub-menu 
          v-if="menuItem.type === 'group' && menuItem.children && menuItem.children.length > 0"
          :index="menuItem.code"
        >
          <template #title>
            <el-icon v-if="menuItem.icon">
              <component :is="menuItem.icon" />
            </el-icon>
            <span>{{ menuItem.name }}</span>
          </template>
          
          <!-- 子菜单项 -->
          <el-menu-item
            v-for="child in menuItem.children"
            :key="child.id"
            :index="child.path"
            @click="handleMenuClick(child)"
          >
            <el-icon v-if="child.icon">
              <component :is="child.icon" />
            </el-icon>
            <template #title>{{ child.name }}</template>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 单独的菜单项 -->
        <el-menu-item
          v-else-if="menuItem.type === 'menu'"
          :index="menuItem.path"
          @click="handleMenuClick(menuItem)"
        >
          <el-icon v-if="menuItem.icon">
            <component :is="menuItem.icon" />
          </el-icon>
          <template #title>{{ menuItem.name }}</template>
        </el-menu-item>
      </template>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MenuItem } from '@/services/menuService'

interface Props {
  menuItems: MenuItem[]
  isCollapse?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isCollapse: false
})

const route = useRoute()
const router = useRouter()

// 当前激活的菜单
const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu as string
  }
  return path
})

// 处理菜单点击
const handleMenuClick = (menuItem: MenuItem) => {
  if (menuItem.path) {
    router.push(menuItem.path)
  }
}
</script>

<style scoped>
.menu-tree {
  height: 100%;
}

.menu-container {
  border: none;
  height: 100%;
  overflow-y: auto;
}

/* 滚动条样式 */
.menu-container::-webkit-scrollbar {
  width: 6px;
}

.menu-container::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.menu-container::-webkit-scrollbar-track {
  background-color: transparent;
}
</style>