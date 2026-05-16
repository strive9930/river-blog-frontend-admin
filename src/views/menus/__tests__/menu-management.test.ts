import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import MenuManagement from '@/views/menus/MenuManagement.vue'
import MenuGroupManagement from '@/views/menus/MenuGroupManagement.vue'
import { useLoading, useFeedback } from '@/services'

// Mock services
vi.mock('@/services', () => ({
  useLoading: vi.fn(),
  useFeedback: vi.fn()
}))

vi.mock('@/api/menu', () => ({
  default: {
    getMenus: vi.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: '1',
          name: 'Dashboard',
          title: '仪表盘',
          path: '/dashboard',
          icon: 'Odometer',
          sort: 1,
          menuType: 1,
          isEnabled: true,
          isVisible: true,
          createTime: '2024-01-01 10:00:00'
        }
      ]
    }),
    getMenuGroups: vi.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: 'g1',
          name: '系统管理',
          code: 'SYSTEM',
          description: '系统基础管理功能',
          sort: 1,
          isEnabled: true
        }
      ]
    }),
    createMenu: vi.fn().mockResolvedValue({ success: true }),
    updateMenu: vi.fn().mockResolvedValue({ success: true }),
    deleteMenu: vi.fn().mockResolvedValue({ success: true })
  }
}))

describe('MenuManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock service returns
    (useLoading as any).mockReturnValue({
      loading: { value: false },
      start: vi.fn(),
      stop: vi.fn()
    })
    
    (useFeedback as any).mockReturnValue({
      success: vi.fn(),
      error: vi.fn(),
      confirmDelete: vi.fn().mockResolvedValue(true)
    })
  })

  it('should render menu management component', () => {
    const wrapper = mount(MenuManagement, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          'el-table': true,
          'el-table-column': true,
          'el-dialog': true,
          'el-form': true
        }
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })

  it('should display search functionality', () => {
    const wrapper = mount(MenuManagement, {
      global: {
        plugins: [createTestingPinia()]
      }
    })
    
    // 检查搜索输入框是否存在
    const searchInput = wrapper.find('input[placeholder*="搜索"]')
    expect(searchInput.exists()).toBe(true)
  })

  it('should have menu table', () => {
    const wrapper = mount(MenuManagement, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          'el-table': true
        }
      }
    })
    
    const table = wrapper.findComponent({ name: 'ElTable' })
    expect(table.exists()).toBe(true)
  })
})

describe('MenuGroupManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    (useLoading as any).mockReturnValue({
      loading: { value: false },
      start: vi.fn(),
      stop: vi.fn()
    })
    
    (useFeedback as any).mockReturnValue({
      success: vi.fn(),
      error: vi.fn(),
      confirmDelete: vi.fn().mockResolvedValue(true)
    })
  })

  it('should render menu group management component', () => {
    const wrapper = mount(MenuGroupManagement, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          'el-table': true,
          'el-dialog': true,
          'el-form': true
        }
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })

  it('should display group creation button', () => {
    const wrapper = mount(MenuGroupManagement, {
      global: {
        plugins: [createTestingPinia()]
      }
    })
    
    const addButton = wrapper.find('button:contains("新增菜单组")')
    expect(addButton.exists()).toBe(true)
  })
})

// API Service Tests
describe('MenuApiService', () => {
  it('should have all required methods', async () => {
    const MenuApiService = (await import('@/api/menu')).default
    
    expect(typeof MenuApiService.getMenus).toBe('function')
    expect(typeof MenuApiService.createMenu).toBe('function')
    expect(typeof MenuApiService.updateMenu).toBe('function')
    expect(typeof MenuApiService.deleteMenu).toBe('function')
    expect(typeof MenuApiService.getMenuGroups).toBe('function')
  })

  it('should handle successful API responses', async () => {
    const MenuApiService = (await import('@/api/menu')).default
    
    const response = await MenuApiService.getMenus()
    expect(response.success).toBe(true)
    expect(Array.isArray(response.data)).toBe(true)
  })
})