/**
 * 权限 Store — 在 asyncRoutes 中新增路由管理模块
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

// 静态路由
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { hidden: true }
  },
  {
    path: '/404',
    component: () => import('@/views/error/404.vue'),
    meta: { hidden: true }
  }
]

// 异步路由（含新增路由管理）
export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/dashboard/Index.vue'),
        name: 'Dashboard',
        meta: { title: '仪表盘', icon: 'Odometer', affix: true }
      }
    ]
  },
  {
    path: '/permissions',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/permissions/list',
    meta: { title: '权限管理', icon: 'Lock', permission: 'permissions:view' },
    children: [
      {
        path: 'list',
        component: () => import('@/views/permissions/PermissionManagement.vue'),
        name: 'PermissionList',
        meta: { title: '权限列表', icon: 'List' }
      }
    ]
  },
  {
    path: '/roles',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/roles/list',
    meta: { title: '角色管理', icon: 'User', permission: 'roles:view' },
    children: [
      {
        path: 'list',
        component: () => import('@/views/roles/RoleManagement.vue'),
        name: 'RoleList',
        meta: { title: '角色列表', icon: 'User' }
      }
    ]
  },
  {
    path: '/users',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/users/list',
    meta: { title: '用户管理', icon: 'UserFilled', permission: 'users:view' },
    children: [
      {
        path: 'list',
        component: () => import('@/views/users/UserManagement.vue'),
        name: 'UserList',
        meta: { title: '用户列表', icon: 'User' }
      }
    ]
  },
  {
    path: '/menus',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/menus/list',
    meta: { title: '菜单管理', icon: 'Menu', permission: 'menus:view' },
    children: [
      {
        path: 'list',
        component: () => import('@/views/menus/index.vue'),
        name: 'MenuManagement',
        meta: { title: '菜单列表', icon: 'Menu' }
      },
      {
        path: 'group',
        component: () => import('@/views/menus/MenuGroupManagement.vue'),
        name: 'MenuGroupManagement',
        meta: { title: '菜单组管理', icon: 'FolderOpened' }
      }
    ]
  },

  // ==================== 新增：路由管理 ====================
  {
    path: '/routes',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/routes/frontend',
    meta: {
      title: '路由管理',
      icon: 'Connection',
      permission: 'routes:view'
    },
    children: [
      {
        path: 'frontend',
        component: () => import('@/views/routes/FrontendRouteManagement.vue'),
        name: 'FrontendRouteManagement',
        meta: { title: '前端路由', icon: 'Connection' }
      },
      {
        path: 'groups',
        component: () => import('@/views/routes/RouteGroupManagement.vue'),
        name: 'RouteGroupManagement',
        meta: { title: '路由分组', icon: 'FolderOpened' }
      }
    ]
  }
  // ==================== 新增结束 ====================
]

export const usePermissionStore = defineStore('permission', () => {
  const routes = ref<RouteRecordRaw[]>(JSON.parse(localStorage.getItem('routes') || '[]'))
  const addRoutes = ref<RouteRecordRaw[]>([])
  const defaultRoutes = ref<RouteRecordRaw[]>([])

  const sidebarRoutes = computed(() => routes.value.filter(route => !route.meta?.hidden))

  const hasPermission = (permissions: string[], route: RouteRecordRaw) => {
    if (permissions.includes('admin')) return true
    if (route.meta?.permission) return permissions.includes(route.meta.permission as string)
    return true
  }

  const filterAsyncRoutes = (routes: RouteRecordRaw[], permissions: string[]) => {
    const res: RouteRecordRaw[] = []
    routes.forEach(route => {
      const tmp = { ...route }
      if (hasPermission(permissions, tmp)) {
        if (tmp.children) tmp.children = filterAsyncRoutes(tmp.children, permissions)
        res.push(tmp)
      }
    })
    return res
  }

  const generateRoutes = (permissions: string[]) => {
    return new Promise<RouteRecordRaw[]>((resolve) => {
      const accessedRoutes = permissions.includes('admin')
        ? asyncRoutes || []
        : filterAsyncRoutes(asyncRoutes, permissions)
      routes.value = constantRoutes.concat(accessedRoutes)
      addRoutes.value = accessedRoutes
      defaultRoutes.value = [...routes.value]
      localStorage.setItem('routes', JSON.stringify(routes.value))
      resolve(accessedRoutes)
    })
  }

  const resetRoutes = () => {
    routes.value = []
    addRoutes.value = []
    defaultRoutes.value = []
    localStorage.removeItem('routes')
  }

  const initRoutes = (permissions: string[]) => {
    const storedRoutes = localStorage.getItem('routes')
    if (storedRoutes) {
      try {
        routes.value = JSON.parse(storedRoutes)
        addRoutes.value = routes.value.filter(r => !constantRoutes.includes(r))
        defaultRoutes.value = [...routes.value]
        return Promise.resolve(routes.value)
      } catch {
        localStorage.removeItem('routes')
      }
    }
    return generateRoutes(permissions)
  }

  return { routes, addRoutes, defaultRoutes, sidebarRoutes, generateRoutes, resetRoutes, initRoutes }
})