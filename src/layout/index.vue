<template>
  <el-container class="app-wrapper">
    <el-aside width="210px" class="sidebar-container">
      <div class="logo">RiverLi Blog Admin</div>
      <el-menu
        :default-active="route.path"
        class="el-menu-vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
        unique-opened
      >
        <template v-for="menu in permissionStore.routes" :key="menu.path">
          <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="menu.path">
            <template #title>
              <el-icon><Menu /></el-icon>
              <span>{{ menu.title }}</span>
            </template>
            <el-menu-item 
              v-for="child in menu.children" 
              :key="child.path" 
              :index="resolvePath(menu.path, child.path)"
            >
              {{ child.title }}
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item v-else :index="menu.path">
            <el-icon><Document /></el-icon>
            <template #title>{{ menu.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container class="main-container">
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ route.meta.title || '工作台' }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-button size="small" icon="HomeFilled" @click="$router.push('/')" title="前往博客前台">
            前台
          </el-button>
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-trigger">
              <el-avatar :size="28" class="user-avatar">
                {{ (userStore.userInfo?.realName || userStore.userInfo?.username || 'U').charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="user-name">{{ userStore.userInfo?.realName || userStore.userInfo?.username || '用户' }}</span>
              <el-icon class="arrow-icon"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled class="dropdown-info">
                  <span style="color:#909399;font-size:12px">{{ userStore.userInfo?.username || '' }}</span>
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <tags-view />

      <el-main class="app-main">
        <router-view v-slot="{ Component, route: currentRoute }">
          <transition name="fade-transform" mode="out-in">
            <keep-alive :include="tabsStore.cachedViews">
              <component :is="Component" :key="currentRoute.fullPath" />
            </keep-alive>
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePermissionStore } from '@/store/modules/permission';
import { useTabsStore } from '@/store/modules/tabs';
import { Menu, Document, ArrowDown, HomeFilled, SwitchButton } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/modules/user';
import TagsView from '@/components/TagsView/index.vue';

const route = useRoute();
const router = useRouter();
const permissionStore = usePermissionStore();
const tabsStore = useTabsStore();
const userStore = useUserStore();

onMounted(() => {
  tabsStore.initTabs();
});
// --- 方法 ---

// 智能拼接父子路径，消除双斜杠
const resolvePath = (parentPath: string, childPath: string) => {
  let fullPath = childPath.startsWith('/') ? childPath : `${parentPath}/${childPath}`;
  return fullPath.replace(/\/\//g, '/');
};

const handleCommand = (command: string) => {
  if (command === 'logout') {
    localStorage.removeItem('token');
    userStore.resetToken(); 
    
    // 🌟 核心修复：把前面的 // 删掉，让这几行代码真正生效！
    const permissionStore = usePermissionStore();
    permissionStore.isRoutesGenerated = false;
    permissionStore.routes = [];
    permissionStore.addRoutes = [];
    tabsStore.resetTabs();

    router.push(`/login?redirect=${route.path}`);
  }
};
</script>

<style scoped>
.app-wrapper {
  height: 100vh;
  width: 100%;
}
.sidebar-container {
  background-color: #304156;
  transition: width 0.28s;
}
.logo {
  height: 50px;
  line-height: 50px;
  text-align: center;
  color: #fff;
  font-weight: 600;
  font-size: 16px;
  border-bottom: 1px solid #1f2d3d;
}
.el-menu-vertical {
  border-right: none;
}
.header {
  height: 50px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}
.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 20px;
  transition: background 0.2s;
}
.user-trigger:hover {
  background: #f0f2f5;
}
.user-avatar {
  flex-shrink: 0;
}
.user-name {
  font-size: 14px;
  color: #303133;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.arrow-icon {
  font-size: 12px;
  color: #909399;
}
.dropdown-info {
  cursor: default !important;
}
.app-main {
  background-color: #f0f2f5;
  padding: 20px;
  /* 确保主内容区可以独立滚动 */
  overflow-y: auto; 
}

/* Vue 3 页面切换过渡动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}
.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>