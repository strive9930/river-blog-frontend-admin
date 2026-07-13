import router from './router';
import NProgress from 'nprogress'; // 进度条插件
import 'nprogress/nprogress.css'; // 进度条样式
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/modules/user';
import { usePermissionStore } from '@/store/modules/permission';
import { useTabsStore } from '@/store/modules/tabs';

// NProgress 配置
NProgress.configure({ showSpinner: false });

// 白名单路由：不需要登录就能访问的路径
const whiteList = ['/login', '/register', '/404', '/401'];

// Portal 前台公开路径 (无需 Token)
const isPublicPortal = (path: string) => {
  if (path === '/') return true;
  if (path.startsWith('/article/')) return true;
  if (path.startsWith('/search')) return true;
  if (path === '/archives') return true;
  if (path === '/links') return true;
  if (path === '/about') return true;
  return false;
};

// 默认网页标题前缀
const defaultTitle = 'RiverLi Blog 系统';

router.beforeEach(async (to, from, next) => {
  // 开启进度条
  NProgress.start();

  // 初始化 Pinia store
  const userStore = useUserStore();
  const permissionStore = usePermissionStore();

  // 判断是否有 token (代表已登录)
  if (userStore.token) {
    if (to.path === '/login') {
      // 已经登录的情况下访问 login，直接重定向到后台首页
      next({ path: '/admin/dashboard' });
      NProgress.done();
    } else if (isPublicPortal(to.path)) {
      // Portal 前台页面 — 无论是否登录都直接放行
      next();
    } else {
      // 判断是否已经拉取过用户的动态路由/菜单
      // 这里通过判断 permissionStore 中的 routes 数组是否为空来决定是否需要重新拉取
      const hasRoutes = permissionStore.isRoutesGenerated;

      if (hasRoutes) {
        // 如果路由已经生成过，直接放行
        next();
      } else {
        try {
          // 🌟 补充 1：每次刷新页面初始化路由时，强制同步一次最新的接口权限字典！
          // 防止管理员在后台修改权限后，前端依然使用本地旧缓存。
          await userStore.getUserPermissions();

          // 🌟 核心：向后端请求当前用户的专属菜单，并生成可用的 Vue Router 对象
          console.log('[守卫] 准备拉取菜单...');
          const accessRoutes = await permissionStore.generateRoutes();
          console.log('[守卫] 菜单拉取成功，准备挂载路由...');

          // 将生成的动态路由挂载到 Vue Router 实例上
          accessRoutes.forEach((route: any) => {
            router.addRoute(route);
          });

          // 🌟 魔法配置：确保 404 兜底路由是整个应用最后挂载的路由！
          // 防止由于动态路由还没加载完，就被静态的 404 给拦截了
          router.addRoute({ 
            path: '/:pathMatch(.*)*', 
            redirect: '/404', 
            name: 'NotFound',
            meta: { hidden: true }
          });

          // 🌟 魔法配置：中断当前导航，带着最新的路由表重新触发一次跳转
          // replace: true 可以防止在浏览器历史记录中留下多余的 404 记录
          console.log(`[守卫] 挂载完毕，准备重定向到: ${to.path}`);
          next({ path: to.path, query: to.query, replace: true });
        } catch (error: any) {
          console.error('[守卫] 发生致命错误:', error);
          console.error('动态路由生成异常:', error);
          
          // 获取路由或用户信息失败时：清除 token，踢回登录页
          await userStore.resetToken();
          useTabsStore().resetTabs();
          ElMessage.error(error.message || '系统路由初始化失败，请重新登录');
          
          // 🌟 补充 2：使用 fullPath 保留所有参数，让 vue-router 自动 encode
          next({ path: '/login', query: { redirect: to.fullPath } });
          NProgress.done();
        }
      }
    }
  } else {
    // 没有 token 的情况
    if (whiteList.indexOf(to.path) !== -1 || isPublicPortal(to.path)) {
      // 在免登录白名单或 Portal 公开路径，直接放行
      next();
    } else {
      // 🌟 补充 2：其他所有没有权限的页面，重定向到登录页面，并携带原本要访问的完整路径(含参数)
      next({ path: '/login', query: { redirect: to.fullPath } });
      NProgress.done();
    }
  }
});

router.afterEach((to) => {
  // 结束进度条
  NProgress.done();

  // 🌟 补充 3：动态设置浏览器标签页的标题
  if (to.meta && to.meta.title) {
    document.title = `${to.meta.title} - ${defaultTitle}`;
  } else {
    document.title = defaultTitle;
  }

  // 同步标签页
  const tabsStore = useTabsStore();
  if (!to.meta?.hidden) {
    tabsStore.addView(to);
  }
});