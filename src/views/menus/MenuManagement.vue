<template>
  <div class="menu-management">
    <!-- 页面标题栏 -->
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="page-title">菜单管理</h2>
        <span class="page-subtitle">{{ filteredCount }} 个菜单项</span>
      </div>
      <div class="page-header-right">
        <el-tooltip content="刷新数据" placement="bottom">
          <el-button class="btn-icon" @click="refreshData">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
        <el-button type="primary" size="large" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增菜单
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选栏 -->
    <div class="filter-bar">
      <div class="filter-bar-left">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索菜单名称或标题..."
          class="filter-input filter-input-search"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-input
          v-model="searchForm.name"
          placeholder="菜单名称"
          class="filter-input filter-input-sm"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="searchForm.title"
          placeholder="显示标题"
          class="filter-input filter-input-sm"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="searchForm.menuGroupId"
          placeholder="菜单组"
          class="filter-select"
          clearable
          @change="handleSearch"
        >
          <el-option
            v-for="group in menuGroups"
            :key="group.id"
            :label="group.name"
            :value="group.id"
          />
        </el-select>
        <el-select
          v-model="searchForm.menuType"
          placeholder="菜单类型"
          class="filter-select"
          clearable
          @change="handleSearch"
        >
          <el-option label="普通菜单" :value="1" />
          <el-option label="分组标题" :value="2" />
          <el-option label="分隔符" :value="3" />
          <el-option label="外部链接" :value="4" />
        </el-select>
      </div>
      <div class="filter-bar-right">
        <el-button @click="resetSearch">重置</el-button>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
    </div>

    <!-- 菜单树形表格 -->
    <div class="table-card">
      
      <el-table
        :data="menuList"
        v-loading="loading"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :row-class-name="getRowClassName"
        default-expand-all
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="菜单名称" min-width="220">
          <template #default="scope">
            <div class="menu-name-cell">
              <!-- 树形连接线 -->
              <span
                v-for="(guide, gi) in getTreeGuides(scope.row)"
                :key="gi"
                :class="['tree-guide', `tree-guide-${guide}`]"
              ></span>
              <el-icon v-if="scope.row.icon" class="menu-icon">
                <component :is="scope.row.icon" />
              </el-icon>
              <strong :class="{ 'parent-name': scope.row.children && scope.row.children.length > 0 }">{{ scope.row.name }}</strong>
              <el-tag
                v-if="scope.row.menuType === 2"
                size="small"
                type="warning"
                style="margin-left: 8px;"
              >
                分组
              </el-tag>
              <el-tag
                v-else-if="scope.row.menuType === 3"
                size="small"
                type="info"
                style="margin-left: 8px;"
              >
                分隔符
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="显示标题" width="150" />
        <el-table-column prop="path" label="路由路径" width="200">
          <template #default="scope">
            <el-tag v-if="scope.row.path" type="info">{{ scope.row.path }}</el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="menuGroup" label="所属组" width="120">
          <template #default="scope">
            <el-tag 
              v-if="scope.row.menuGroup" 
              :type="getGroupTagType(scope.row.menuGroup.name)"
            >
              {{ scope.row.menuGroup.name }}
            </el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="状态" width="120" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.isEnabled ? 'success' : 'danger'" size="small">
              {{ scope.row.isEnabled ? '启用' : '禁用' }}
            </el-tag>
            <el-tag 
              v-if="!scope.row.isVisible" 
              type="warning" 
              size="small" 
              style="margin-left: 5px;"
            >
              隐藏
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="requiredPermission" label="所需权限" width="150">
          <template #default="scope">
            <el-tag v-if="scope.row.requiredPermission" type="primary" size="small">
              {{ scope.row.requiredPermission }}
            </el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button size="small" @click="handleView(scope.row)">
                <el-icon><View /></el-icon>
                查看
              </el-button>
              <el-button size="small" @click="handleEdit(scope.row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button 
                size="small" 
                :type="scope.row.isEnabled ? 'warning' : 'success'"
                @click="handleToggleStatus(scope.row)"
              >
                <el-icon><Refresh /></el-icon>
                {{ scope.row.isEnabled ? '禁用' : '启用' }}
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="handleDelete(scope.row)"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 批量操作 -->
      <div v-if="selectedMenus.length > 0" class="batch-actions">
        <div class="batch-info">
          已选择 {{ selectedMenus.length }} 个菜单项
        </div>
        <div class="batch-buttons">
          <el-button @click="handleBatchEnable" :disabled="!canBatchEnable">
            批量启用
          </el-button>
          <el-button @click="handleBatchDisable" :disabled="!canBatchDisable">
            批量禁用
          </el-button>
          <el-button type="danger" @click="handleBatchDelete">
            批量删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 菜单详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="dialogTitle"
      width="720px"
      :before-close="handleDialogClose"
      class="menu-dialog"
    >
      <el-form
        ref="menuFormRef"
        :model="menuForm"
        :rules="menuFormRules"
        label-width="120px"
        v-loading="formLoading"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="菜单名称" prop="name">
              <el-input v-model="menuForm.name" placeholder="请输入菜单名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示标题" prop="title">
              <el-input v-model="menuForm.title" placeholder="请输入显示标题" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="菜单类型" prop="menuType">
              <el-select v-model="menuForm.menuType" placeholder="请选择菜单类型" style="width: 100%;">
                <el-option label="普通菜单项" :value="1" />
                <el-option label="分组标题" :value="2" />
                <el-option label="分隔符" :value="3" />
                <el-option label="外部链接" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属菜单组" prop="menuGroupId">
              <el-select v-model="menuForm.menuGroupId" placeholder="请选择菜单组" style="width: 100%;" clearable>
                <el-option
                  v-for="group in menuGroups"
                  :key="group.id"
                  :label="group.name"
                  :value="group.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="路由路径" prop="path">
          <el-input v-model="menuForm.path" placeholder="请输入路由路径，如：/users" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="图标">
              <el-popover
                v-model:visible="iconPickerVisible"
                placement="bottom"
                :width="400"
                trigger="click"
              >
                <template #reference>
                  <el-input 
                    v-model="menuForm.icon" 
                    placeholder="请选择图标" 
                    readonly
                  >
                    <template #append>
                      <el-button>
                        <el-icon v-if="menuForm.icon">
                          <component :is="menuForm.icon" />
                        </el-icon>
                        <span v-else>选择</span>
                      </el-button>
                    </template>
                  </el-input>
                </template>
                
                <div class="icon-picker">
                  <el-input
                    v-model="searchIcon"
                    placeholder="搜索图标"
                    clearable
                    style="margin-bottom: 10px"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                  
                  <el-scrollbar height="200px">
                    <div class="icon-list">
                      <div
                        v-for="icon in filteredIcons"
                        :key="icon.name"
                        class="icon-item"
                        :class="{ active: menuForm.icon === icon.name }"
                        @click="selectIcon(icon.name)"
                      >
                        <el-icon :size="20">
                          <component :is="icon.name" />
                        </el-icon>
                        <span class="icon-name">{{ icon.name }}</span>
                      </div>
                    </div>
                  </el-scrollbar>
                </div>
              </el-popover>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="menuForm.sort" :min="0" :max="999" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="父级菜单" prop="parentId">
              <el-select v-model="menuForm.parentId" placeholder="请选择父级菜单" style="width: 100%;" clearable>
                <el-option
                  v-for="menu in parentMenuOptions"
                  :key="menu.id"
                  :label="menu.title"
                  :value="menu.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所需权限" prop="requiredPermission">
              <el-select 
                v-model="menuForm.requiredPermission" 
                placeholder="请选择权限" 
                style="width: 100%;"
                clearable
                filterable
              >
                <el-option
                  v-for="permission in permissions"
                  :key="permission.id"
                  :label="`${permission.name} (${permission.code})`"
                  :value="permission.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否启用">
              <el-switch v-model="menuForm.isEnabled" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否可见">
              <el-switch v-model="menuForm.isVisible" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="描述">
          <el-input 
            v-model="menuForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入菜单描述"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { 
  Search, Plus, Refresh, View, Edit, Delete 
} from '@element-plus/icons-vue'
import { useLoading, useFeedback } from '@/services'
import MenuApiService, { type Menu, type MenuGroup } from '@/api/menu'

// 图标列表
const icons = [
  'User', 'Lock', 'Unlock', 'UserFilled', 'Avatar', 'Bell', 'Message', 'ChatLineRound', 
  'Position', 'Monitor', 'Menu', 'Grid', 'SetUp', 'Tools', 'Document', 'DocumentAdd', 
  'Reading', 'Collection', 'Tickets', 'EditPen', 'Delete', 'DeleteFilled', 'Search', 
  'Share', 'Download', 'Upload', 'Crop', 'Memo', 'Postcard', 'MessageBox', 'ChatDotSquare', 
  'Film', 'Headset', 'Iphone', 'Camera', 'PictureRounded', 'Key', 'CoffeeCup', 'Odometer', 
  'ColdDrink', 'WaterCup', 'IceTea', 'Soccer', 'Baseball', 'Bell', 'Lightning', 'Sunrise', 
  'Sunny', 'Sunset', 'Timer', 'Watch', 'Wallet', 'CreditCard', 'Coin', 'Money', 'Present', 
  'Apple', 'Orange', 'Pear', 'Cherry', 'Grape', 'Van', 'Bicycle', 'Truck', 'Ship', 'Aim', 
  'Brush', 'BrushFill', 'Camera', 'VideoCamera', 'Headset', 'Phone', 'Ipad', 'Monitor', 
  'Cellphone', 'Womens', 'Guide', 'Help', 'Warning', 'InfoFilled', 'CircleCheck', 'CircleClose', 
  'CircleCheckFilled', 'CircleCloseFilled', 'WarningFilled', 'QuestionFilled', 'InfoFilled', 
  'Star', 'StarFilled', 'Medal', 'Trophy', 'Award', 'Flag', 'MuteNotification', 'Close', 
  'Check', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'D-arrow-right', 'D-arrow-left', 
  'Back', 'Right', 'Bottom', 'Top', 'Minus', 'Plus', 'CirclePlus', 'Remove', 'CircleMinus', 
  'ZoomIn', 'ZoomOut', 'Finished', 'Delete', 'Edit', 'EditPen', 'CopyDocument', 'Folder', 
  'FolderOpened', 'FolderAdd', 'FolderRemove', 'FolderDelete', 'Tickets', 'Document', 
  'DocumentAdd', 'DocumentChecked', 'DocumentCopy', 'DocumentDelete', 'ScaleToOriginal', 
  'Histogram', 'DataAnalysis', 'PieChart', 'TrendCharts', 'Goods', 'SoldOut', 'ShoppingCartFull', 
  'ShoppingCart', 'Money', 'Coin', 'Wallet', 'Discount', 'PriceTag', 'Chicken', 'View', 
  'Hide', 'Loading', 'Lock', 'Unlock', 'Timer', 'Clock', 'Sunrise', 'Sunny', 'Sunset', 
  'Phone', 'PhoneFilled', 'Monitor', 'Search', 'Connection', 'Crop', 'House', 'Menu', 'More'
].map(name => ({ name, component: name }))

// 添加搜索图标变量
const searchIcon = ref('')
const iconPickerVisible = ref(false)

// 使用加载和反馈服务
const { loading, start: startLoading, stop: stopLoading } = useLoading()
const { success, error, confirmDelete } = useFeedback()

// 响应式数据
const menuList = ref<Menu[]>([])
const allMenus = ref<Menu[]>([]) // 完整菜单树，用于客户端过滤
const menuGroups = ref<MenuGroup[]>([])
const permissions = ref([])
const selectedMenus = ref<Menu[]>([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  menuGroupId: undefined,
  menuType: undefined,
  name: '',
  title: ''
})

// 表单相关
const menuFormRef = ref()
const dialogTitle = ref('')
const detailDialogVisible = ref(false)
const formLoading = ref(false)
const submitLoading = ref(false)

// 菜单表单
const menuForm = reactive({
  id: '',
  name: '',
  title: '',
  path: '',
  icon: '',
  sort: 0,
  parentId: undefined as string | undefined,
  menuType: 1,
  menuGroupId: undefined as string | undefined,
  requiredPermission: '',
  description: '',
  isEnabled: true,
  isVisible: true
})

// 表单验证规则
const menuFormRules = {
  name: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  title: [
    { required: true, message: '请输入显示标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  menuType: [
    { required: true, message: '请选择菜单类型', trigger: 'change' }
  ]
}

// 计算属性
const parentMenuOptions = computed(() => {
  return flattenMenuTree(allMenus.value).filter(menu => menu.id !== menuForm.id)
})

const canBatchEnable = computed(() => {
  return selectedMenus.value.some(menu => !menu.isEnabled)
})

const canBatchDisable = computed(() => {
  return selectedMenus.value.some(menu => menu.isEnabled)
})

// 工具函数
const flattenMenuTree = (menus: Menu[]): Menu[] => {
  const result: Menu[] = []
  const traverse = (items: Menu[]) => {
    items.forEach(item => {
      result.push(item)
      if (item.children && item.children.length > 0) {
        traverse(item.children)
      }
    })
  }
  traverse(menus)
  return result
}

const getGroupTagType = (groupName: string) => {
  const typeMap: Record<string, any> = {
    '系统管理': 'primary',
    '内容管理': 'success',
    '用户管理': 'warning',
    '数据分析': 'danger'
  }
  return typeMap[groupName] || 'info'
}

const depthMap = ref<Record<string, number>>({})
// treeLineMap: nodeId -> boolean[]，每个元素表示该层级是否为最后一个子节点
// 最后一个元素是当前节点自身，前面是各级祖先
const treeLineMap = ref<Record<string, boolean[]>>({})

const buildDepthMap = (menus: Menu[], depth = 0, ancestorLastFlags: boolean[] = []) => {
  menus.forEach((menu, index) => {
    depthMap.value[menu.id] = depth
    const isLast = index === menus.length - 1

    if (depth > 0) {
      treeLineMap.value[menu.id] = [...ancestorLastFlags, isLast]
    }

    if (menu.children && menu.children.length > 0) {
      buildDepthMap(menu.children, depth + 1, [...ancestorLastFlags, isLast])
    }
  })
}

type TreeGuideType = 'blank' | 'line' | 'fork' | 'corner'

const getTreeGuides = (row: Menu): TreeGuideType[] => {
  const flags = treeLineMap.value[row.id]
  if (!flags || flags.length === 0) return []

  return flags.map((isLast: boolean, i: number) => {
    if (i < flags.length - 1) {
      return isLast ? 'blank' : 'line'
    }
    return isLast ? 'corner' : 'fork'
  })
}

const getRowClassName = ({ row }: { row: Menu }) => {
  const depth = depthMap.value[row.id] ?? 0
  const hasChildren = row.children && row.children.length > 0
  const classes = [`depth-${depth}`]
  if (hasChildren) classes.push('parent-row')
  if (!row.parentId) classes.push('root-row')
  if (!hasChildren && row.parentId) classes.push('leaf-row')
  return classes.join(' ')
}

// 客户端过滤：递归过滤菜单树，保留匹配节点及其所有祖先路径上的节点
const filterMenuTree = (menus: Menu[], keyword: string, name: string, title: string, menuGroupId: string | undefined, menuType: number | undefined): Menu[] => {
  const matchNode = (menu: Menu): boolean => {
    if (keyword) {
      const kw = keyword.toLowerCase()
      if (!menu.name.toLowerCase().includes(kw) && !menu.title.toLowerCase().includes(kw)) return false
    }
    if (name && !menu.name.toLowerCase().includes(name.toLowerCase())) return false
    if (title && !menu.title.toLowerCase().includes(title.toLowerCase())) return false
    if (menuGroupId && menu.menuGroupId !== menuGroupId) return false
    if (menuType !== undefined && menu.menuType !== menuType) return false
    return true
  }

  return menus.reduce((acc: Menu[], menu: Menu) => {
    const children = menu.children ? filterMenuTree(menu.children, keyword, name, title, menuGroupId, menuType) : []
    if (matchNode(menu) || children.length > 0) {
      acc.push({ ...menu, children: children.length > 0 ? children : menu.children })
    }
    return acc
  }, [])
}

const filteredCount = computed(() => {
  return flattenMenuTree(menuList.value).length
})

// API 调用函数
const fetchMenus = async (): Promise<Menu[]> => {
  const response = await MenuApiService.getMenuTree()
  if (response.success) {
    return response.data || []
  } else {
    throw new Error(response.message || '获取菜单列表失败')
  }
}

const fetchMenuGroups = async (): Promise<MenuGroup[]> => {
  const response = await MenuApiService.getMenuGroups()
  if (response.success) {
    if (Array.isArray(response.data)) {
      return response.data
    }
    return []
  } else {
    throw new Error(response.message || '获取菜单组失败')
  }
}

// 操作函数
const loadData = async () => {
  startLoading()
  try {
    const [menus, groups] = await Promise.all([
      fetchMenus(),
      fetchMenuGroups()
    ])
    allMenus.value = menus
    menuGroups.value = groups
    buildDepthMap(menus)
    applyFilters()
  } catch (err: any) {
    error('加载数据失败: ' + err.message)
  } finally {
    stopLoading()
  }
}

const applyFilters = () => {
  menuList.value = filterMenuTree(
    allMenus.value,
    searchForm.keyword,
    searchForm.name,
    searchForm.title,
    searchForm.menuGroupId,
    searchForm.menuType
  )
}

const handleSearch = () => {
  applyFilters()
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.name = ''
  searchForm.title = ''
  searchForm.menuGroupId = undefined
  searchForm.menuType = undefined
  applyFilters()
  ElMessage.success('搜索条件已重置')
}

const refreshData = () => {
  loadData()
}

const handleAdd = () => {
  dialogTitle.value = '新增菜单'
  resetForm()
  detailDialogVisible.value = true
}

const handleView = (row: Menu) => {
  dialogTitle.value = '查看菜单'
  Object.assign(menuForm, row)
  detailDialogVisible.value = true
}

const handleEdit = (row: Menu) => {
  dialogTitle.value = '编辑菜单'
  Object.assign(menuForm, row)
  detailDialogVisible.value = true
}

const handleDelete = async (row: Menu) => {
  if (await confirmDelete(`菜单 "${row.name}"`)) {
    try {
      const response = await MenuApiService.deleteMenu(row.id)
      if (response.success) {
        success('删除成功')
        loadData()
      } else {
        error('删除失败: ' + response.message)
      }
    } catch (err: any) {
      error('删除失败: ' + err.message)
    }
  }
}

const handleSubmit = async () => {
  if (!menuFormRef.value) return
  
  try {
    await menuFormRef.value.validate()
    submitLoading.value = true
    
    let response
    if (menuForm.id) {
      // 更新菜单
      const updateTimea = { ...menuForm }
      //delete updateTimea.id
      response = await MenuApiService.updateMenu(menuForm.id, updateTimea)
    } else {
      // 创建菜单
      const createTimea = { ...menuForm }
      delete createTimea.id
      response = await MenuApiService.createMenu(createTimea)
    }
    
    if (response.success) {
      success(dialogTitle.value === '新增菜单' ? '创建成功' : '更新成功')
      detailDialogVisible.value = false
      loadData()
    } else {
      error('操作失败: ' + response.message)
    }
  } catch (err: any) {
    error('操作失败: ' + err.message)
  } finally {
    submitLoading.value = false
  }
}

const handleDialogClose = () => {
  detailDialogVisible.value = false
  resetForm()
}

const resetForm = () => {
  Object.assign(menuForm, {
    id: '',
    name: '',
    title: '',
    path: '',
    icon: '',
    sort: 0,
    parentId: undefined,
    menuType: 1,
    menuGroupId: undefined,
    requiredPermission: '',
    description: '',
    isEnabled: true,
    isVisible: true
  })
  menuFormRef.value?.resetFields()
}

const handleSelectionChange = (selection: Menu[]) => {
  selectedMenus.value = selection
}

const handleToggleStatus = async (row: Menu) => {
  try {
    const action = row.isEnabled ? '禁用' : '启用'
    await ElMessageBox.confirm(`确定要${action}菜单 "${row.name}" 吗？`, '确认操作')
    
    const response = await MenuApiService.updateMenu(row.id, {
      id: row.id,
      isEnabled: !row.isEnabled,
      name: row.name,
      title: row.title,
    })
    
    if (response.success) {
      row.isEnabled = !row.isEnabled
      success(`${action}成功`)
    } else {
      error(`${action}失败: ` + response.message)
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      error('操作失败: ' + err.message)
    }
  }
}

const handleBatchEnable = async () => {
  try {
    await ElMessageBox.confirm(`确定要启用选中的 ${selectedMenus.value.length} 个菜单吗？`, '批量启用')
    
    const response = await MenuApiService.batchUpdateMenuStatus({
      ids: selectedMenus.value.map(menu => menu.id),
      isEnabled: true
    })
    
    if (response.success) {
      success('批量启用成功')
      loadData()
    } else {
      error('批量启用失败: ' + response.message)
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      error('操作失败: ' + err.message)
    }
  }
}

const handleBatchDisable = async () => {
  try {
    await ElMessageBox.confirm(`确定要禁用选中的 ${selectedMenus.value.length} 个菜单吗？`, '批量禁用')
    
    const response = await MenuApiService.batchUpdateMenuStatus({
      ids: selectedMenus.value.map(menu => menu.id),
      isEnabled: false
    })
    
    if (response.success) {
      success('批量禁用成功')
      loadData()
    } else {
      error('批量禁用失败: ' + response.message)
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      error('操作失败: ' + err.message)
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedMenus.value.length} 个菜单吗？此操作不可撤销！`, 
      '批量删除', 
      { type: 'error' }
    )
    
    const response = await MenuApiService.batchDeleteMenus({
      ids: selectedMenus.value.map(menu => menu.id)
    })
    
    if (response.success) {
      success('批量删除成功')
      loadData()
    } else {
      error('批量删除失败: ' + response.message)
    }
  } catch (err: any) {
    if (err !== 'cancel') {
      error('操作失败: ' + err.message)
    }
  }
}

// 在组件挂载时加载数据
onMounted(() => {
  loadData()
  loadPermissions() // 加载权限数据
})

const loadPermissions = async () => {
  try {
    const response = await import('@/services/permission.service').then(mod => mod.PermissionService.getList())
    if (response.success) {
      const permissionList = response.data && Array.isArray(response.data) ? response.data : []
      permissions.value = permissionList.map((permission: any) => ({
        id: permission.id,
        name: permission.name,
        code: permission.code
      }))
    } else {
      console.warn('获取权限列表失败:', response?.message)
      permissions.value = []
    }
  } catch (error: any) {
    console.error('加载权限失败:', error?.message || error)
    permissions.value = []
  }
}

// 添加选择图标的函数
const selectIcon = (iconName: string) => {
  menuForm.icon = iconName
  iconPickerVisible.value = false
}

// 添加计算属性来过滤图标
const filteredIcons = computed(() => {
  if (!searchIcon.value) return icons
  return icons.filter(icon => 
    icon.name.toLowerCase().includes(searchIcon.value.toLowerCase())
  )
})

</script>

<style scoped>
/* ===== 页面容器 ===== */
.menu-management {
  padding: 24px;
  min-height: calc(100vh - 64px);
  background: #f1f5f9;
}

/* ===== 页面标题栏 ===== */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: -0.3px;
}

.page-subtitle {
  font-size: 14px;
  color: #94a3b8;
}

.page-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-icon {
  width: 38px;
  height: 38px;
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #64748b;
  transition: all 0.2s;
}

.btn-icon:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
}

/* ===== 搜索筛选栏 ===== */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.filter-bar-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  flex: 1;
}

.filter-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.filter-input {
  width: 220px;
}

.filter-input-search {
  width: 240px;
}

.filter-input-sm {
  width: 140px;
}

.filter-select {
  width: 150px;
}

/* ===== 表格卡片 ===== */
.table-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

/* ===== Element Plus 全局覆盖 ===== */
/* 按钮圆角 */
:deep(.el-button) {
  border-radius: 8px;
}

:deep(.el-button--primary) {
  background: #3b82f6;
  border-color: #3b82f6;
}

:deep(.el-button--primary:hover) {
  background: #2563eb;
  border-color: #2563eb;
}

/* 输入框圆角 */
:deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #cbd5e1 inset;
}

:deep(.el-input.is-focus .el-input__wrapper),
:deep(.el-select .el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px #3b82f6 inset;
}

:deep(.el-input__inner) {
  font-size: 14px;
}

:deep(.el-input__inner::placeholder) {
  color: #94a3b8;
}

/* Select 下拉框 */
:deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

/* Tag 圆角 */
:deep(.el-tag) {
  border-radius: 6px;
}

/* 表格 */
:deep(.el-table) {
  --el-table-border-color: #f1f5f9;
  --el-table-header-bg-color: #f8fafc;
  --el-table-row-hover-bg-color: #f8fafc;
  font-size: 14px;
}

:deep(.el-table th.el-table__cell) {
  background: #f8fafc;
  color: #64748b;
  font-weight: 600;
  font-size: 13px;
  text-transform: none;
  letter-spacing: 0;
  border-bottom: 1px solid #e2e8f0;
}

:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}

:deep(.el-table__body tr:hover > td) {
  background-color: #f8fafc;
}

:deep(.el-table__header) {
  border-radius: 0;
}

/* ===== 树形层级可视化（showLine 风格） ===== */

/* 隐藏 el-table 默认树形缩进，改用自定义 guide */
:deep(.el-table__indent) {
  width: 0 !important;
  padding: 0 !important;
}

:deep(.el-table__placeholder) {
  display: none;
}

/* 表格单元格内容垂直居中 */
:deep(.el-table .cell) {
  display: flex;
  align-items: center;
}

/* 展开/折叠图标 */
:deep(.el-table__expand-icon) {
  width: 20px;
  height: 20px;
  font-size: 10px;
  color: #288eff;
  border: none;
  border-radius: 0;
  background: transparent;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  margin-right: 4px;
}

:deep(.el-table__expand-icon:hover) {
  color: #1a6fd4;
}

:deep(.el-table__expand-icon .el-icon) {
  font-size: 12px;
  font-weight: bold;
}

:deep(.el-table__expand-icon--expanded) {
  color: #288eff;
}

/* ===== 自定义树形连接线 ===== */
.tree-guide {
  display: inline-block;
  width: 28px;
  height: 48px;
  position: relative;
  flex-shrink: 0;
  vertical-align: middle;
}

/* 竖线 - 祖先层级延续 */
.tree-guide-line::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  border-left: 1px solid #d9d9d9;
}

/* 分叉 - T型（当前层级，非末尾，竖线向下+右横线） */
.tree-guide-fork::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  border-left: 1px solid #d9d9d9;
}

.tree-guide-fork::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  right: 0;
  height: 0;
  border-top: 1px solid #d9d9d9;
}

/* 拐角 - L型（末尾子节点，竖线到一半+右横线） */
.tree-guide-corner::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 50%;
  left: 50%;
  border-left: 1px solid #d9d9d9;
}

.tree-guide-corner::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  right: 0;
  height: 0;
  border-top: 1px solid #d9d9d9;
}

/* 空白占位 */
.tree-guide-blank {
  visibility: hidden;
}

/* ===== 行样式 ===== */
:deep(tr.parent-row) {
  background-color: #fafbfc;
}

:deep(tr.parent-row > td.el-table__cell) {
  border-bottom: 1px solid #e5e7eb;
}

:deep(tr.parent-row .cell strong) {
  font-weight: 600;
  color: #1e293b;
}

/* ===== 悬停效果 ===== */
:deep(.el-table__body tr:hover > td.el-table__cell) {
  background-color: #f8fafc !important;
}

:deep(tr.parent-row:hover > td.el-table__cell) {
  background-color: #f1f5f9 !important;
}

/* ===== 批量操作栏 ===== */
.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.batch-info {
  font-size: 13px;
  color: #64748b;
}

.batch-buttons {
  display: flex;
  gap: 8px;
}

/* ===== 对话框 ===== */
:deep(.menu-dialog .el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.menu-dialog .el-dialog__header) {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f1f5f9;
}

:deep(.menu-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

:deep(.menu-dialog .el-dialog__body) {
  padding: 20px 24px;
}

:deep(.menu-dialog .el-dialog__footer) {
  padding: 12px 24px 20px;
}

:deep(.menu-dialog .el-form-item__label) {
  font-weight: 500;
  color: #475569;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* ===== 菜单名称列 ===== */
.menu-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.parent-name {
  color: #1e293b;
  font-weight: 600;
}

.menu-icon {
  font-size: 16px;
  color: #3b82f6;
}

.text-muted {
  color: #94a3b8;
}

/* ===== 图标选择器 ===== */
.icon-picker {
  padding: 10px;
}

.icon-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.icon-item:hover {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.icon-item.active {
  border-color: #3b82f6;
  background-color: #dbeafe;
  color: #3b82f6;
}

.icon-name {
  margin-top: 4px;
  font-size: 11px;
  word-break: break-all;
}

/* ===== 操作按钮组 ===== */
.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-start;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .menu-management {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-bar-left {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-bar-right {
    justify-content: flex-end;
  }

  .filter-input,
  .filter-input-search,
  .filter-input-sm,
  .filter-select {
    width: 100%;
  }
}
</style>