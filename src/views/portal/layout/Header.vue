<template>
  <header class="portal-header">
    <div class="header-inner">
      <!-- 移动端汉堡菜单 -->
      <div class="mobile-toggle" @click="mobileMenuOpen = !mobileMenuOpen">
        <el-icon :size="22"><component :is="mobileMenuOpen ? 'Close' : 'Menu'" /></el-icon>
      </div>

      <div class="logo" @click="$router.push('/')">
        {{ siteStore.siteName }}
        <span class="logo-subtitle" v-if="siteStore.siteSubtitle">{{ siteStore.siteSubtitle }}</span>
      </div>

      <!-- 桌面端导航 -->
      <el-menu
        :default-active="activeIndex"
        class="nav-menu desktop-nav"
        mode="horizontal"
        :ellipsis="false"
      >
        <template v-for="nav in navList" :key="nav.id">
          <el-sub-menu v-if="nav.children && nav.children.length > 0" :index="nav.id">
            <template #title>
              <el-icon v-if="nav.icon"><component :is="nav.icon" /></el-icon>
              <span>{{ nav.title }}</span>
            </template>
            <el-menu-item
              v-for="child in nav.children"
              :key="child.id"
              :index="child.id"
              @click="handleNavigate(child)"
            >
              <el-icon v-if="child.icon"><component :is="child.icon" /></el-icon>
              {{ child.title }}
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item v-else :index="nav.id" @click="handleNavigate(nav)">
            <el-icon v-if="nav.icon"><component :is="nav.icon" /></el-icon>
            {{ nav.title }}
          </el-menu-item>
        </template>
      </el-menu>

      <!-- 右侧操作区 -->
      <div class="header-actions">
        <!-- 搜索框 -->
        <div class="search-area">
          <el-input
            v-model="searchKeyword"
            size="small"
            placeholder="搜索文章..."
            :prefix-icon="Search"
            class="search-input"
            clearable
            @keyup.enter="doSearch"
            @clear="searchKeyword = ''"
          />
        </div>

        <!-- RSS 链接 -->
        <a
          v-if="feedUrl"
          :href="feedUrl"
          target="_blank"
          rel="noopener"
          class="rss-link"
          title="RSS 订阅"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-3.83A11.73 11.73 0 0 0 4 8.27V4.44m0 7.83a7.73 7.73 0 0 1 7.73 7.73H7.95A3.95 3.95 0 0 0 4 16.05v-3.78z"/></svg>
        </a>

        <!-- Dark Mode 切换 -->
        <el-button class="dark-toggle" circle size="small" @click="toggleDark">
          <el-icon :size="16"><Moon v-if="!isDark" /><Sunny v-else /></el-icon>
        </el-button>

        <!-- 右侧用户区 -->
        <div class="user-area">
          <el-button v-if="!userStore.token" size="small" round @click="$router.push('/login')">
            登录
          </el-button>

          <el-dropdown v-else trigger="click" @command="handleUserCommand">
            <span class="user-trigger">
              <el-avatar :size="32" :src="userAvatar" class="user-avatar">
                {{ displayName.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="user-name">{{ displayName }}</span>
              <el-icon class="arrow-icon"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled class="dropdown-info">
                  <span style="color:#909399;font-size:12px">{{ userStore.userInfo?.username || '' }}</span>
                </el-dropdown-item>
                <el-dropdown-item v-if="isAdmin" command="admin" divided>
                  <el-icon><Monitor /></el-icon> 管理后台
                </el-dropdown-item>
                <el-dropdown-item command="logout" :divided="!isAdmin">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 移动端下拉菜单 -->
    <transition name="slide-down">
      <div v-show="mobileMenuOpen" class="mobile-nav-dropdown">
        <template v-for="nav in navList" :key="nav.id">
          <div class="mobile-nav-item" @click="handleNavigate(nav); mobileMenuOpen = false">
            <el-icon v-if="nav.icon"><component :is="nav.icon" /></el-icon>
            <span>{{ nav.title }}</span>
          </div>
          <div
            v-for="child in (nav.children || [])"
            :key="child.id"
            class="mobile-nav-item mobile-nav-child"
            @click="handleNavigate(child); mobileMenuOpen = false"
          >
            <span>{{ child.title }}</span>
          </div>
        </template>
      </div>
    </transition>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowDown, Monitor, SwitchButton, Search, Moon, Sunny } from '@element-plus/icons-vue';
import { getPublicNavigations } from '@/api/portal';
import { useUserStore } from '@/store/modules/user';
import { useSiteStore } from '@/store/modules/site';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const siteStore = useSiteStore();

const navList = ref<any[]>([]);
const activeIndex = ref('');
const searchKeyword = ref('');
const mobileMenuOpen = ref(false);

// RSS Feed URL — 可通过站点配置的 socialLinks 中包含 RSS 平台来设置
const feedUrl = computed(() => {
  const rss = siteStore.socialLinks?.find((l: any) =>
    l.platform === 'RSS' || l.platform === 'Feed'
  );
  return rss?.url || '/api/blog/seo/rss';
});

const doSearch = () => {
  const q = searchKeyword.value.trim();
  if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
};

// Dark Mode
const isDark = ref(localStorage.getItem('theme') === 'dark');
const applyDark = (dark: boolean) => {
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('theme', dark ? 'dark' : 'light');
};
applyDark(isDark.value);
const toggleDark = () => { isDark.value = !isDark.value; applyDark(isDark.value); };

const isAdmin = computed(() =>
  userStore.roles?.some((r: string) => r.toLowerCase() === 'admin')
);

const displayName = computed(() =>
  userStore.userInfo?.realName || userStore.userInfo?.username || '用户'
);

const userAvatar = computed(() => userStore.userInfo?.avatar || '');

onMounted(async () => {
  try {
    const res = await getPublicNavigations();
    navList.value = res.data;
  } catch {
    console.error('获取导航失败');
  }
});

const handleNavigate = (nav: any) => {
  if (nav.linkUrl?.startsWith('http') || nav.target === '_blank') {
    window.open(nav.linkUrl, nav.target);
    return;
  }
  router.push(nav.linkUrl);
};

const handleUserCommand = (cmd: string) => {
  if (cmd === 'admin') {
    router.push('/admin/dashboard');
  } else if (cmd === 'logout') {
    localStorage.removeItem('token');
    userStore.resetToken();
    router.push('/');
  }
};
</script>

<style scoped>
.portal-header {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #eaecef;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(18, 18, 18, 0.1);
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

/* 移动端切换按钮 — 默认隐藏 */
.mobile-toggle {
  display: none;
  cursor: pointer;
  color: #4e5969;
  padding: 4px;
  margin-right: 8px;
  border-radius: 4px;
  transition: background .2s;
}
.mobile-toggle:hover { background: #f0f2f5; }

.logo {
  font-size: 22px;
  font-weight: bold;
  color: #2c3e50;
  cursor: pointer;
  margin-right: 40px;
  white-space: nowrap;
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.logo-subtitle {
  font-size: 12px;
  font-weight: 400;
  color: #8a919f;
  white-space: nowrap;
}

/* 桌面导航 */
.desktop-nav {
  flex: 1;
  border-bottom: none !important;
}

/* 右侧操作区 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  flex-shrink: 0;
}

/* 搜索 */
.search-area { /* margin handled by header-actions gap */ }
.search-input { width: 180px; }

/* RSS 链接 */
.rss-link {
  display: flex;
  align-items: center;
  color: #f59e0b;
  transition: color .2s, transform .2s;
  padding: 4px;
  border-radius: 4px;
}
.rss-link:hover { color: #d97706; transform: scale(1.1); }

/* 用户区 */
.user-area { flex-shrink: 0; }
.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background 0.2s;
}
.user-trigger:hover { background: #f0f2f5; }
.user-avatar { flex-shrink: 0; }
.user-name {
  font-size: 14px;
  color: #303133;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.arrow-icon { font-size: 12px; color: #909399; }
.dropdown-info { cursor: default !important; }

/* 移动端下拉导航 */
.mobile-nav-dropdown {
  display: none;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  box-shadow: 0 4px 12px rgba(0,0,0,.08);
  padding: 8px 0;
}
.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 15px;
  color: #1d2129;
  cursor: pointer;
  transition: background .15s;
}
.mobile-nav-item:hover { background: #f4f5f5; color: #1e80ff; }
.mobile-nav-child {
  padding-left: 48px;
  font-size: 14px;
  color: #4e5969;
}

/* 下拉过渡动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all .25s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ========== 响应式 ========== */
@media (max-width: 900px) {
  .desktop-nav { display: none !important; }
  .search-input { width: 130px; }
  .logo { font-size: 18px; margin-right: 0; }
  .logo-subtitle { display: none; }
  .mobile-toggle { display: flex; }
  .mobile-nav-dropdown { display: block; }
}
@media (max-width: 600px) {
  .search-area { display: none; }
  .header-inner { padding: 0 12px; }
  .logo { font-size: 16px; }
}
</style>
