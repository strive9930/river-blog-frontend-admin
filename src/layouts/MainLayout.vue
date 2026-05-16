<template>
  <div class="main-layout">
    <!-- 侧边栏 -->
    <el-aside :width="sidebarWidth" class="sidebar-container">
      <div class="logo-container">
        <h1 class="logo-text">River Blog</h1>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        :collapse="isCollapse"
        :unique-opened="true"
        :collapse-transition="false"
        mode="vertical"
      >
        <!-- 重构后的动态菜单渲染 -->
        <template v-for="route in permissionStore.routes" :key="route.path">
          <!-- 过滤掉隐藏路由和特殊路由 -->
          <template v-if="route && !route.meta?.hidden && route.path !== '/login' && route.path !== '/404'">
            <!-- 有子路由的情况 -->
            <template v-if="route.children && route.children.length > 0">
              <el-sub-menu 
                :index="route.path"
              >
                <template #title>
                  <el-icon v-if="route.meta?.icon">
                    <component :is="route.meta.icon" />
                  </el-icon>
                  <span>{{ route.meta?.title }}</span>
                </template>
                
                <!-- 遍历子路由 -->
                <template v-for="child in route.children.filter(c => c && !c.meta?.hidden && c.name && c.path)" :key="`${route.path}/${child.path}`">
                  <el-menu-item 
                    :index="`${route.path}/${child.path}`"
                    @click="handleMenuClick({ path: `${route.path}/${child.path}`, name: child.name })"
                    class="sub-menu-item"
                  >
                    <el-icon v-if="child.meta?.icon">
                      <component :is="child.meta.icon" />
                    </el-icon>
                    <template #title>{{ child.meta?.title }}</template>
                  </el-menu-item>
                </template>
              </el-sub-menu>
            </template>
            
            <!-- 没有子路由的顶级路由 -->
            <el-menu-item 
              v-else-if="route.name && route.path !== '/'"
              :key="route.path"
              :index="route.path"
              @click="handleMenuClick(route)"
            >
              <el-icon v-if="route.meta?.icon">
                <component :is="route.meta.icon" />
              </el-icon>
              <template #title>{{ route.meta?.title }}</template>
            </el-menu-item>
          </template>
        </template>
      </el-menu>
    </el-aside>

    <!-- 主体区域 -->
    <div class="main-container">
      <!-- 头部导航 -->
      <div class="navbar">
        <div class="navbar-left">
          <el-icon class="collapse-icon" @click="toggleSidebar">
            <Expand v-if="isCollapse" />
            <Fold v-else />
          </el-icon>
          <breadcrumb class="breadcrumb-container" />
        </div>
        
        <div class="navbar-right">
          <el-dropdown @command="handleCommand">
            <div class="user-dropdown">
              <el-avatar :size="32" :src="userStore.avatar">
                {{ userStore.nickName?.charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ userStore.nickName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="settings">设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 标签页 -->
      <tags-view />

      <!-- 内容区域 -->
      <section class="app-main">
        <router-view v-slot="{ Component, route }">
          <transition name="fade-transform" mode="out-in">
            <keep-alive :include="cachedViews">
              <component :is="Component" :key="route.fullPath" />
            </keep-alive>
          </transition>
        </router-view>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePermissionStore } from '../store/modules/permission'
import { useUserStore } from '../store/modules/user'
import { useTagsViewStore } from '../store/modules/tagsView'

const route = useRoute()
const router = useRouter()
const permissionStore = usePermissionStore()
const userStore = useUserStore()
const tagsViewStore = useTagsViewStore()

// 响应式数据
const isCollapse = ref(false)
const sidebarWidth = computed(() => isCollapse.value ? '64px' : '220px')

// 计算属性
const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu as string
  }
  return path
})

const cachedViews = computed(() => {
  return tagsViewStore.cachedViewsList
})

// 计算属性：过滤后的菜单路由
const menuRoutes = computed(() => {
  const routes = permissionStore.routes || []
  console.log('原始路由数据:', routes)
  
  const filtered = routes.filter(route => 
    route && 
    !route.meta?.hidden && 
    route.path !== '/login' && 
    route.path !== '/404'
  )
  
  console.log('过滤后的菜单路由:', filtered)
  return filtered
})

// 方法
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

const handleMenuClick = (menuItem: any) => {
  console.log('菜单点击:', menuItem);
  console.log('菜单路径:', menuItem.path);
  console.log('菜单名称:', menuItem.name);
  
  if (menuItem.path) {
    // 直接使用传入的路径
    const fullPath = menuItem.path.startsWith('/') ? menuItem.path : `/${menuItem.path}`;
    console.log('跳转到:', fullPath);
    router.push(fullPath).catch(err => {
      console.error('路由跳转失败:', err);
    });
  }
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      userStore.logout()
      router.push('/login')
      break
  }
}


// 初始化权限路由
const initPermissionRoutes = async () => {
  console.log('开始初始化权限路由...')
  console.log('用户登录状态:', userStore.isLoggedIn)
  console.log('当前权限:', userStore.permissions)
  
  if (userStore.isLoggedIn) {
    if (userStore.permissions.length > 0) {
      console.log('已有权限数据，重新生成路由')
      // 如果已经有权限数据，重新生成路由
      await permissionStore.generateRoutes(userStore.permissions)
    } else {
      console.log('无权限数据，重新获取用户信息')
      // 页面刷新后需要重新获取用户信息和权限
      try {
        await userStore.initUserState()
        console.log('重新获取权限后:', userStore.permissions)
        if (userStore.permissions.length > 0) {
          await permissionStore.generateRoutes(userStore.permissions)
        }
      } catch (error) {
        console.error('初始化权限路由失败:', error)
        // 如果初始化失败，跳转到登录页
        userStore.logout()
      }
    }
    
    console.log('最终路由:', permissionStore.routes)
    console.log('路由数量:', permissionStore.routes.length)
    console.log('路由路径:', permissionStore.routes.map(r => r.path))
    console.log('菜单路由:', menuRoutes.value)
    console.log('菜单路由数量:', menuRoutes.value.length)
  } else {
    console.log('用户未登录')
  }
}

// 组件挂载时初始化
onMounted(async () => {
  console.log('=== 主布局初始化诊断 ===')
  console.log('localStorage中的access_token:', localStorage.getItem('access_token'))
  console.log('localStorage中的user_info:', localStorage.getItem('user_info'))
  console.log('主布局挂载，用户登录状态:', userStore.isLoggedIn)
  console.log('用户信息:', userStore.userInfo)
  console.log('昵称:', userStore.nickName)
  console.log('邮箱:', userStore.email)
  console.log('头像:', userStore.avatar)
  
  await initPermissionRoutes()
})

// 监听用户信息变化
watch(() => userStore.userInfo, (newVal, oldVal) => {
  console.log('用户信息发生变化:', { newVal, oldVal })
  console.log('新的昵称:', userStore.nickName)
}, { deep: true })

watch(() => userStore.nickName, (newVal, oldVal) => {
  console.log('昵称发生变化:', { newVal, oldVal })
})

</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.sidebar-container {
  background-color: #304156;
  transition: width 0.28s;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
  z-index: 1001;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b2f3a;
  border-bottom: 1px solid #3d4657;
}

.logo-text {
  color: white;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-menu {
  border: none;
  height: calc(100% - 60px);
  overflow-y: auto;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.navbar {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  z-index: 1000;
}

.navbar-left {
  display: flex;
  align-items: center;
}

.collapse-icon {
  font-size: 20px;
  cursor: pointer;
  margin-right: 20px;
  transition: transform 0.3s;
}

.collapse-icon:hover {
  transform: scale(1.1);
}

.navbar-right {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: #f5f7fa;
}

.user-name {
  margin: 0 8px;
  font-size: 14px;
  color: #606266;
}

.app-main {
  flex: 1;
  overflow: auto;
  padding: 20px;
  background-color: #f0f2f5;
}
</style>