<template>
  <div class="menu-management">
    <!-- 操作栏 -->
    <el-card class="filter-card mb-20">
      <div class="filter-container">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索菜单名称或标题"
          style="width: 200px; margin-right: 15px;"
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
          placeholder="按名称搜索"
          style="width: 150px; margin-right: 15px;"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="searchForm.title"
          placeholder="按标题搜索"
          style="width: 150px; margin-right: 15px;"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="searchForm.menuGroupId"
          placeholder="菜单组"
          style="width: 200px; margin-right: 15px;"
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
          style="width: 150px; margin-right: 15px;"
          clearable
          @change="handleSearch"
        >
          <el-option label="普通菜单" :value="1" />
          <el-option label="分组标题" :value="2" />
          <el-option label="分隔符" :value="3" />
          <el-option label="外部链接" :value="4" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="resetSearch">重置</el-button>
        <div class="right-actions">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增菜单
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 菜单树形表格 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>菜单列表</span>
          <div class="header-actions">
            <span class="total-count">共 {{ pagination.total }} 个菜单项</span>
            <el-button link type="primary" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table 
        :data="menuList"
        v-loading="loading"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        default-expand-all
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="菜单名称" min-width="150">
          <template #default="scope">
            <div class="menu-name-cell">
              <el-icon v-if="scope.row.icon" class="menu-icon">
                <component :is="scope.row.icon" />
              </el-icon>
              <strong>{{ scope.row.name }}</strong>
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
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          :current-page="pagination.currentPage"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
      
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
    </el-card>

    <!-- 菜单详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="dialogTitle"
      width="800px"
      :before-close="handleDialogClose"
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
const menuGroups = ref<MenuGroup[]>([])
const permissions = ref([]) // 添加权限选项数据
const selectedMenus = ref<Menu[]>([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  menuGroupId: undefined,
  menuType: undefined,
  name: '',
  title: ''
})

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
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
  return flattenMenuTree(menuList.value).filter(menu => menu.id !== menuForm.id)
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

// API 调用函数
const fetchMenus = async (): Promise<Menu[]> => {
  // 使用分页API获取菜单数据
  const params = {
    pageIndex: pagination.currentPage,
    pageSize: pagination.pageSize,
    menuGroupId: searchForm.menuGroupId,
    menuType: searchForm.menuType,
    keyword: searchForm.keyword
  }
  
  const response = await MenuApiService.getPagedList(params)
  
  if (response.success) {
    // 根据后端返回格式：分页信息在根级别，数据在 response.data 中
    pagination.total = response.totalCount || 0
    return response.data || []
  } else {
    throw new Error(response.message || '获取菜单列表失败')
  }
}

const fetchMenuGroups = async (): Promise<MenuGroup[]> => {
  const response = await MenuApiService.getMenuGroups()
  
  if (response.success) {
    // 为兼容分页和非分页数据格式，检查是否有data.data结构
    if (response.data  && Array.isArray(response.data)) {
      // 分页数据格式
      return response.data || []
    } else if (response.data && Array.isArray(response.data)) {
      // 非分页数据格式
      return response.data || []
    } else {
      // 默认返回空数组
      return []
    }
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
    menuList.value = menus
    menuGroups.value = groups
  } catch (err: any) {
    error('加载数据失败: ' + err.message)
  } finally {
    stopLoading()
  }
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  pagination.currentPage = 1  // 回到第一页
  loadData()
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  loadData()
}

const handleSearch = () => {
  loadData()
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.menuGroupId = undefined
  searchForm.menuType = undefined
  loadData()
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

// 添加加载权限的方法
const loadPermissions = async () => {
  try {
    const response = await import('@/services/permission.service').then(mod => mod.PermissionService.getList())
    if (response.success) {
      // 处理API返回的不同数据结构
      let permissionList = []
      if (response.data && Array.isArray(response.data)) {
        permissionList = response.data
      } else if (response.data && Array.isArray(response.data)) {
        permissionList = response.data
      } else {
        permissionList = []
      }
      
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
.menu-management {
  padding: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}

.filter-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.filter-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.right-actions {
  margin-left: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.total-count {
  font-size: 14px;
  color: #606266;
}

.menu-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-icon {
  font-size: 16px;
  color: #409EFF;
}

.text-muted {
  color: #909399;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #f5f7fa;
  border-top: 1px solid #ebeef5;
  margin-top: 20px;
  border-radius: 0 0 4px 4px;
}

.batch-info {
  font-size: 14px;
  color: #606266;
}

.batch-buttons {
  display: flex;
  gap: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .right-actions {
    margin-left: 0;
    display: flex;
    justify-content: center;
  }
  
  .filter-container > * {
    width: 100%;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-start;
}

.icon-picker {
  padding: 10px;
}

.icon-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.icon-item:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.icon-item.active {
  border-color: #409eff;
  background-color: #ecf5ff;
  color: #409eff;
}

.icon-name {
  margin-top: 5px;
  font-size: 12px;
  word-break: break-all;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>