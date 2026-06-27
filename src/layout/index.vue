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
        <template v-for="menu in permissionStore.menus" :key="menu.path">
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
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link user-profile">
              管理员 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { usePermissionStore } from '@/store/modules/permission';
import { Menu, Document, ArrowDown } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const permissionStore = usePermissionStore();

// --- 方法 ---

// 智能拼接父子路径，消除双斜杠
const resolvePath = (parentPath: string, childPath: string) => {
  let fullPath = childPath.startsWith('/') ? childPath : `${parentPath}/${childPath}`;
  return fullPath.replace(/\/\//g, '/');
};

// 处理顶部下拉菜单命令
const handleCommand = (command: string) => {
  if (command === 'logout') {
    localStorage.removeItem('access_token');
    // 退出后回到登录页，并带上当前路径以便重新登录后跳回
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
.user-profile {
  cursor: pointer;
  color: #606266;
  display: flex;
  align-items: center;
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