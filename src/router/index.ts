/**
 * 路由配置
 */
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 布局组件
const MainLayout = () => import('@/layouts/MainLayout.vue')

// 页面组件
const Dashboard = () => import('@/views/dashboard/Index.vue')
const PermissionManagement = () => import('@/views/permissions/PermissionManagement.vue')
const RoleManagement = () => import('@/views/roles/RoleManagement.vue')
const UserManagement = () => import('@/views/users/UserManagement.vue')
const Login = () => import('@/views/auth/Login.vue')
const Profile = () => import('@/views/profile/Profile.vue')
// ↓ 新增
const FrontendRouteManagement = () => import('@/views/routes/FrontendRouteManagement.vue')
const RouteGroupManagement = () => import('@/views/routes/RouteGroupManagement.vue')

// 路由守卫
const beforeEach = async (to: any, from: any, next: any) => {
  const requiresAuth = to.matched.some((record: any) => record.meta.requiresAuth)
  const token = localStorage.getItem('access_token')
  if (requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录', hideInMenu: true }
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '仪表盘', icon: 'Odometer', affix: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile,
        meta: { title: '个人中心', icon: 'User', permission: 'profile:view' }
      },

      // ==================== 权限管理 ====================
      {
        path: 'permissions',
        redirect: '/permissions/list',
        meta: { title: '权限管理', icon: 'Lock', permission: 'permissions:view' },
        children: [
          {
            path: 'list',
            name: 'PermissionList',
            component: PermissionManagement,
            meta: { title: '权限列表', icon: 'List' }
          }
        ]
      },

      // ==================== 角色管理 ====================
      {
        path: 'roles',
        redirect: '/roles/list',
        meta: { title: '角色管理', icon: 'User', permission: 'roles:view' },
        children: [
          {
            path: 'list',
            name: 'RoleList',
            component: RoleManagement,
            meta: { title: '角色列表', icon: 'User' }
          }
        ]
      },

      // ==================== 用户管理 ====================
      {
        path: 'users',
        redirect: '/users/list',
        meta: { title: '用户管理', icon: 'UserFilled', permission: 'users:view' },
        children: [
          {
            path: 'list',
            name: 'UserList',
            component: UserManagement,
            meta: { title: '用户列表', icon: 'User' }
          }
        ]
      },

      // ==================== 菜单管理 ====================
      {
        path: 'menus',
        redirect: '/menus/list',
        meta: { 
          title: '菜单管理',
          icon: 'Menu',
          permission: 'menus:view'
        },
        children: [
          {
            path: 'list',
            component: () => import('@/views/menus/MenuManagement.vue'),
            name: 'MenuList',
            meta: { 
              title: '菜单列表',
              icon: 'List'
            }
          },
          // {
          //   path: 'management',
          //   component: () => import('@/views/menus/MenuManagement.vue'),
          //   name: 'MenuManagement',
          //   meta: { 
          //     title: '菜单管理',
          //     icon: 'Menu'
          //   }
          // },
          {
            path: 'group',
            component: () => import('@/views/menus/MenuGroupManagement.vue'),
            name: 'MenuGroupManagement',
            meta: { 
              title: '菜单组管理',
              icon: 'FolderOpened'
            }
          },
          // {
          //   path: 'import-export',
          //   component: () => import('@/views/menus/ImportExport.vue'),
          //   name: 'MenuImportExport',
          //   meta: { 
          //     title: '导入导出',
          //     icon: 'Download'
          //   }
          // }
        ]
      },
      // ==================== 路由管理（新增） ====================
      {
        path: 'routes',
        redirect: '/routes/frontend',
        meta: {
          title: '路由管理',
          icon: 'Connection',
          permission: 'routes:view'
        },
        children: [
          {
            path: 'frontend',
            name: 'FrontendRouteManagement',
            component: FrontendRouteManagement,
            meta: { title: '前端路由', icon: 'Connection' }
          },
          {
            path: 'groups',
            name: 'RouteGroupManagement',
            component: RouteGroupManagement,
            meta: { title: '路由分组', icon: 'FolderOpened' }
          }
        ]
      },
      {
        path: 'enhanced-demo',
        name: 'EnhancedFeaturesDemo',
        component: () => import('@/views/demo/EnhancedFeaturesDemo.vue'),
        meta: { title: '增强功能演示', icon: 'MagicStick', permission: 'demo:view' }
      },
      {
        path: 'test-permission',
        name: 'TestPermission',
        component: () => import('@/views/TestPermissionView.vue'),
        meta: { title: '权限测试', icon: 'Setting', permission: 'test:view' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面未找到', hideInMenu: true }
  }
]

const router = createRouter({
  history: createWebHistory((import.meta as any).env.BASE_URL),
  routes
})

router.beforeEach(beforeEach)

router.afterEach((to) => {
  document.title = `${to.meta.title || ''} - River Blog 管理后台`
  window.scrollTo(0, 0)
})

export default router