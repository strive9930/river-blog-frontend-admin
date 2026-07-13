import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import Layout from '@/layout/index.vue';
import PortalLayout from '@/views/portal/layout/index.vue';

export const constantRoutes: Array<RouteRecordRaw> = [
  // ==========================================
  // 🌟 前台 Portal (公开访问)
  // ==========================================
  {
    path: '/',
    component: PortalLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/portal/home/index.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'article/:id',
        name: 'ArticleDetail',
        component: () => import('@/views/portal/article/index.vue'),
        meta: { title: '文章详情' }
      },
      {
        path: 'search',
        name: 'Search',
        component: () => import('@/views/portal/search/index.vue'),
        meta: { title: '搜索' }
      },
      {
        path: 'archives',
        name: 'Archives',
        component: () => import('@/views/portal/archives/index.vue'),
        meta: { title: '归档' }
      },
      {
        path: 'friend',
        name: 'Links',
        component: () => import('@/views/portal/links/index.vue'),
        meta: { title: '友情链接' }
      },
      {
        path: 'wall',
        name: 'MessageWall',
        component: () => import('@/views/portal/wall/index.vue'),
        meta: { title: '留言墙' }
      },
      {
        path: 'record',
        name: 'Records',
        component: () => import('@/views/portal/record/index.vue'),
        meta: { title: '说说' }
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/portal/about/index.vue'),
        meta: { title: '关于我' }
      }
    ]
  },

  // ==========================================
  // 🛡️ 后台 Admin (需登录)
  // ==========================================
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { hidden: true }
  },
  {
    path: '/admin',
    name: 'Layout', // permission.ts 全靠它来挂载子菜单！
    component: Layout,
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' }
      }
    ]
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/error/404.vue'),
    meta: { hidden: true }
  },
  {
    path: '/redirect/:path(.*)',
    name: 'Redirect',
    component: () => import('@/views/redirect/index.vue'),
    meta: { hidden: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { hidden: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes
});

export default router;