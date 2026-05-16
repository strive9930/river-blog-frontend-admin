import axios from 'axios'
import { ElMessage } from 'element-plus'

// 菜单接口定义
export interface MenuItem {
  id: string
  name: string
  code: string
  type: 'group' | 'menu'
  icon?: string
  path?: string
  component?: string
  parentId?: string | null
  children?: MenuItem[]
  isVisible: boolean
  sortOrder: number
}

// 菜单API服务
class MenuService {
  private baseUrl = '/api/auth/menu'

  /**
   * 获取当前用户的菜单列表
   */
  async getCurrentUserMenus(): Promise<MenuItem[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/current-user`)
      return response.data
    } catch (error) {
      console.error('获取用户菜单失败:', error)
      ElMessage.error('获取菜单数据失败')
      throw error
    }
  }

  /**
   * 获取所有菜单（管理员专用）
   */
  async getAllMenus(): Promise<MenuItem[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/all`)
      return response.data
    } catch (error) {
      console.error('获取所有菜单失败:', error)
      ElMessage.error('获取菜单数据失败')
      throw error
    }
  }

  /**
   * 获取菜单树结构
   */
  async getMenuTree(): Promise<MenuItem[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/tree`)
      return response.data
    } catch (error) {
      console.error('获取菜单树失败:', error)
      ElMessage.error('获取菜单树失败')
      throw error
    }
  }

  /**
   * 创建菜单
   */
  async createMenu(menuData: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    try {
      const response = await axios.post(this.baseUrl, menuData)
      ElMessage.success('菜单创建成功')
      return response.data
    } catch (error) {
      console.error('创建菜单失败:', error)
      ElMessage.error('菜单创建失败')
      throw error
    }
  }

  /**
   * 更新菜单
   */
  async updateMenu(id: string, menuData: Partial<MenuItem>): Promise<MenuItem> {
    try {
      const response = await axios.put(`${this.baseUrl}/${id}`, menuData)
      ElMessage.success('菜单更新成功')
      return response.data
    } catch (error) {
      console.error('更新菜单失败:', error)
      ElMessage.error('菜单更新失败')
      throw error
    }
  }

  /**
   * 删除菜单
   */
  async deleteMenu(id: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/${id}`)
      ElMessage.success('菜单删除成功')
    } catch (error) {
      console.error('删除菜单失败:', error)
      ElMessage.error('菜单删除失败')
      throw error
    }
  }

  /**
   * 为用户分配菜单权限
   */
  async assignMenusToUser(userId: string, menuIds: string[]): Promise<void> {
    try {
      await axios.post(`/api/auth/user/${userId}/menus`, { menuIds })
      ElMessage.success('菜单权限分配成功')
    } catch (error) {
      console.error('分配菜单权限失败:', error)
      ElMessage.error('菜单权限分配失败')
      throw error
    }
  }

  /**
   * 获取用户的菜单权限
   */
  async getUserMenus(userId: string): Promise<MenuItem[]> {
    try {
      const response = await axios.get(`/api/auth/user/${userId}/menus`)
      return response.data
    } catch (error) {
      console.error('获取用户菜单权限失败:', error)
      ElMessage.error('获取用户菜单权限失败')
      throw error
    }
  }
}

// 创建服务实例
export const menuService = new MenuService()

// 默认菜单配置（用于开发环境或API不可用时）
export const defaultMenus: MenuItem[] = [
  {
    id: 'dashboard-group',
    name: '仪表盘',
    code: 'dashboard',
    type: 'group',
    icon: 'Odometer',
    isVisible: true,
    sortOrder: 1,
    children: [
      {
        id: 'dashboard-overview',
        name: '概览',
        code: 'dashboard.overview',
        type: 'menu',
        icon: 'Odometer',
        path: '/dashboard',
        component: 'views/dashboard/index.vue',
        isVisible: true,
        sortOrder: 1
      }
    ]
  },
  {
    id: 'system-group',
    name: '系统管理',
    code: 'system',
    type: 'group',
    icon: 'Setting',
    isVisible: true,
    sortOrder: 2,
    children: [
      {
        id: 'system-users',
        name: '用户管理',
        code: 'system.users',
        type: 'menu',
        icon: 'User',
        path: '/system/users',
        component: 'views/system/users/index.vue',
        isVisible: true,
        sortOrder: 1
      },
      {
        id: 'system-roles',
        name: '角色管理',
        code: 'system.roles',
        type: 'menu',
        icon: 'UserFilled',
        path: '/system/roles',
        component: 'views/system/roles/index.vue',
        isVisible: true,
        sortOrder: 2
      },
      {
        id: 'system-permissions',
        name: '权限管理',
        code: 'system.permissions',
        type: 'menu',
        icon: 'Lock',
        path: '/system/permissions',
        component: 'views/system/permissions/index.vue',
        isVisible: true,
        sortOrder: 3
      },
      {
        id: 'system-menus',
        name: '菜单管理',
        code: 'system.menus',
        type: 'menu',
        icon: 'Menu',
        path: '/system/menus',
        component: 'views/system/menus/index.vue',
        isVisible: true,
        sortOrder: 4
      }
    ]
  },
  {
    id: 'content-group',
    name: '内容管理',
    code: 'content',
    type: 'group',
    icon: 'Document',
    isVisible: true,
    sortOrder: 3,
    children: [
      {
        id: 'content-articles',
        name: '文章管理',
        code: 'content.articles',
        type: 'menu',
        icon: 'Document',
        path: '/content/articles',
        component: 'views/content/articles/index.vue',
        isVisible: true,
        sortOrder: 1
      },
      {
        id: 'content-categories',
        name: '分类管理',
        code: 'content.categories',
        type: 'menu',
        icon: 'Collection',
        path: '/content/categories',
        component: 'views/content/categories/index.vue',
        isVisible: true,
        sortOrder: 2
      }
    ]
  },
  {
    id: 'analytics-group',
    name: '数据分析',
    code: 'analytics',
    type: 'group',
    icon: 'PieChart',
    isVisible: true,
    sortOrder: 4,
    children: [
      {
        id: 'analytics-overview',
        name: '数据概览',
        code: 'analytics.overview',
        type: 'menu',
        icon: 'PieChart',
        path: '/analytics/overview',
        component: 'views/analytics/overview.vue',
        isVisible: true,
        sortOrder: 1
      },
      {
        id: 'analytics-users',
        name: '用户分析',
        code: 'analytics.users',
        type: 'menu',
        icon: 'User',
        path: '/analytics/users',
        component: 'views/analytics/users.vue',
        isVisible: true,
        sortOrder: 2
      }
    ]
  }
]

// 构建菜单树结构的辅助函数
export function buildMenuTree(menus: MenuItem[]): MenuItem[] {
  const menuMap = new Map<string, MenuItem>()
  const rootMenus: MenuItem[] = []

  // 创建映射
  menus.forEach(menu => {
    menuMap.set(menu.id, { ...menu, children: [] })
  })

  // 构建树结构
  menus.forEach(menu => {
    if (menu.parentId) {
      const parent = menuMap.get(menu.parentId)
      if (parent && parent.children) {
        parent.children.push(menuMap.get(menu.id)!)
      }
    } else {
      rootMenus.push(menuMap.get(menu.id)!)
    }
  })

  // 按排序字段排序
  rootMenus.sort((a, b) => a.sortOrder - b.sortOrder)
  rootMenus.forEach(menu => {
    if (menu.children) {
      menu.children.sort((a, b) => a.sortOrder - b.sortOrder)
    }
  })

  return rootMenus
}