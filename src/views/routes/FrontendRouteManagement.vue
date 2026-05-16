<template>
  <div class="route-management">
    <!-- 顶部操作栏 -->
    <el-card class="search-card" shadow="never">
      <el-row :gutter="16" align="middle">
        <el-col :span="5">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索路由名称/路径"
            clearable
            @keyup.enter="loadData"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.isEnabled" placeholder="状态筛选" clearable style="width:100%">
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.isMenu" placeholder="菜单筛选" clearable style="width:100%">
            <el-option label="显示在菜单" :value="true" />
            <el-option label="不显示在菜单" :value="false" />
          </el-select>
        </el-col>
        <el-col :span="11" style="display:flex;gap:8px">
          <el-button type="primary" @click="loadData"><el-icon><Search /></el-icon>搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="success" @click="openCreateDialog(null)">
            <el-icon><Plus /></el-icon>新建路由
          </el-button>
          <el-button type="primary" plain @click="expandAll = !expandAll">
            {{ expandAll ? '折叠全部' : '展开全部' }}
          </el-button>
          <el-button @click="loadData"><el-icon><Refresh /></el-icon></el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 分页路由表格 -->
    <el-card shadow="never" style="margin-top:16px">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon style="color:#409eff"><Connection /></el-icon>
            前端路由管理
            <el-tag type="info" size="small" style="margin-left:8px">{{ pagination.total }} 条</el-tag>
          </span>
          <el-tooltip content="路由以树形展示，父路由下可嵌套子路由">
            <el-icon style="color:#909399;cursor:pointer"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
      </template>

      <el-table
        :data="routes"
        v-loading="loading"
        row-key="id"
        :tree-props="{ children: 'children' }"
        stripe
        style="width:100%"
      >
        <el-table-column prop="title" label="路由标题" min-width="180">
          <template #default="{ row }">
            <div style="display:flex;align-items:center;gap:8px">
              <el-icon v-if="row.icon" style="color:#409eff"><component :is="row.icon" /></el-icon>
              <el-icon v-else style="color:#c0c4cc"><Document /></el-icon>
              <span>{{ row.title }}</span>
              <el-tag v-if="row.children?.length" size="small" type="info">
                {{ row.children.length }} 个子路由
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="路由名称" width="160">
          <template #default="{ row }">
            <el-tag type="warning" size="small">{{ row.name }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="path" label="路由路径" width="200">
          <template #default="{ row }">
            <code style="background:#f5f7fa;padding:2px 6px;border-radius:3px;font-size:12px;color:#606266">
              {{ row.path }}
            </code>
          </template>
        </el-table-column>

        <el-table-column prop="component" label="组件路径" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span style="color:#909399;font-size:12px">{{ row.component }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="sort" label="排序" width="70" align="center" />

        <el-table-column prop="isMenu" label="显示菜单" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isMenu ? 'success' : 'info'" size="small">
              {{ row.isMenu ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="requiredPermission" label="所需权限" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag v-if="row.requiredPermission" type="danger" size="small">
              {{ row.requiredPermission }}
            </el-tag>
            <span v-else style="color:#c0c4cc">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="isEnabled" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.isEnabled"
              @change="toggleStatus(row)"
              size="small"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openCreateDialog(row)">
              <el-icon><Plus /></el-icon>子路由
            </el-button>
            <el-button size="small" type="warning" link @click="openEditDialog(row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-popconfirm
              :title="`确认删除路由「${row.title}」？`"
              @confirm="deleteRoute(row)"
              width="260"
            >
              <template #reference>
                <el-button size="small" type="danger" link>
                  <el-icon><Delete /></el-icon>删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; text-align: right"
      />
    </el-card>

    <!-- 新建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? (parentRoute ? `新建子路由 — ${parentRoute.title}` : '新建前端路由') : `编辑路由 — ${editingRoute?.title}`"
      width="680px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="110px"
        label-position="right"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="路由标题" prop="title">
              <el-input v-model="form.title" placeholder="例: 用户管理" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="路由名称" prop="name">
              <el-input v-model="form.name" placeholder="例: UserManagement" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="路由路径" prop="path">
          <el-input v-model="form.path" placeholder="例: /users 或 /admin/users">
            <template #prefix>/</template>
          </el-input>
        </el-form-item>

        <el-form-item label="组件路径" prop="component">
          <el-input v-model="form.component" placeholder="例: views/users/UserManagement" />
          <div class="form-tip">前端组件相对路径，不含 .vue 扩展名</div>
        </el-form-item>

        <el-row :gutter="16">
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
                    v-model="form.icon" 
                    placeholder="请选择图标" 
                    readonly
                  >
                    <template #append>
                      <el-button>
                        <el-icon v-if="form.icon">
                          <component :is="form.icon" />
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
                        :class="{ active: form.icon === icon.name }"
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
            <el-form-item label="排序号">
              <el-input-number v-model="form.sort" :min="0" :max="9999" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="所需权限">
          <el-select 
            v-model="form.requiredPermission" 
            placeholder="请选择权限" 
            style="width:100%"
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
          <div class="form-tip">访问此路由所需的权限码，留空则无限制</div>
        </el-form-item>

        <el-form-item label="路由分组">
          <el-select v-model="form.routeGroupId" placeholder="选择路由分组" clearable style="width:100%">
            <el-option
              v-for="group in routeGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="路由描述信息（可选）" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="显示在菜单">
              <el-switch v-model="form.isMenu" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="启用状态">
              <el-switch v-model="form.isEnabled" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">
          {{ dialogMode === 'create' ? '创建路由' : '保存修改' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 关联后端路由抽屉 -->
    <el-drawer
      v-model="backendDrawerVisible"
      title="关联后端路由"
      size="500px"
      destroy-on-close
    >
      <div v-if="currentRoute" style="padding:0 8px">
        <el-alert :title="`当前路由: ${currentRoute.title} (${currentRoute.path})`" type="info" :closable="false" style="margin-bottom:16px" />
        <el-checkbox-group v-model="selectedBackendRoutes">
          <div
            v-for="route in sysRoutes"
            :key="route.id"
            style="padding:8px 0;border-bottom:1px solid #f0f0f0"
          >
            <el-checkbox :value="route.id">
              <div>
                <el-tag :type="methodColor(route.method)" size="small" style="width:60px;text-align:center">
                  {{ route.method }}
                </el-tag>
                <span style="margin-left:8px;font-size:13px">{{ route.path }}</span>
              </div>
              <div style="color:#909399;font-size:12px;margin-left:68px">{{ route.description }}</div>
            </el-checkbox>
          </div>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="backendDrawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="saveBackendRoutes">保存关联</el-button>
      </template>
    </el-drawer>

    <!-- 图标选择器 -->
    <el-drawer
      v-model="iconPickerVisible"
      title="选择图标"
      size="500px"
      destroy-on-close
    >
      <div style="padding:0 8px">
        <el-row :gutter="16">
          <el-col :span="4" v-for="icon in icons" :key="icon.name">
            <el-button type="plain" @click="selectIcon(icon.name)">
              <el-icon><component :is="icon.component" /></el-icon>
            </el-button>
          </el-col>
        </el-row>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Search, Plus, Refresh, Connection, QuestionFilled, Document } from '@element-plus/icons-vue'
import { FrontendRouteApi, RouteGroupApi, SysRouteApi } from '@/api/route'
import type { FrontendRoute, RouteGroup, SysRoute } from '@/api/route'
import { PermissionService } from '@/services/permission.service'

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

// ==================== 状态 ====================

const loading = ref(false)
const submitting = ref(false)
const routes = ref<FrontendRoute[]>([])
const expandAll = ref(false)
const treeRoutes = ref<FrontendRoute[]>([])
const flatRoutes = ref<FrontendRoute[]>([])
const routeGroups = ref<RouteGroup[]>([])
const permissions = ref([]) // 添加权限选项数据
const sysRoutes = ref<SysRoute[]>([])
const selectedBackendRoutes = ref<string[]>([])
const currentRoute = ref<FrontendRoute | null>(null)
const backendDrawerVisible = ref(false)
const iconPickerVisible = ref(false)

// 分页相关
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

const searchForm = reactive({
  keyword: '',
  isEnabled: undefined as boolean | undefined,
  isMenu: undefined as boolean | undefined
})

// 对话框
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const parentRoute = ref<FrontendRoute | null>(null)
const editingRoute = ref<FrontendRoute | null>(null)
const formRef = ref<FormInstance>()

const defaultForm = () => ({
  path: '',
  name: '',
  component: '',
  title: '',
  icon: '',
  sort: 0,
  parentId: undefined as string | undefined,
  routeGroupId: undefined as string | undefined,
  isMenu: true,
  isEnabled: true,
  requiredPermission: '',
  description: ''
})

const form = reactive(defaultForm())

const formRules: FormRules = {
  title: [{ required: true, message: '请填写路由标题', trigger: 'blur' }],
  name: [{ required: true, message: '请填写路由名称', trigger: 'blur' }],
  path: [{ required: true, message: '请填写路由路径', trigger: 'blur' }],
  component: [{ required: true, message: '请填写组件路径', trigger: 'blur' }]
}

// ==================== 计算属性 ====================
const filteredRoutes = computed(() => {
  if (!searchForm.keyword && searchForm.isEnabled === undefined && searchForm.isMenu === undefined) {
    return treeRoutes.value
  }
  // 简单过滤：对平铺数据过滤后重新构建树（此处简化为平铺显示）
  return flatRoutes.value.filter(r => {
    const kw = searchForm.keyword.toLowerCase()
    const matchKeyword = !kw || r.title.toLowerCase().includes(kw) || r.path.toLowerCase().includes(kw) || r.name.toLowerCase().includes(kw)
    const matchEnabled = searchForm.isEnabled === undefined || r.isEnabled === searchForm.isEnabled
    const matchMenu = searchForm.isMenu === undefined || r.isMenu === searchForm.isMenu
    return matchKeyword && matchEnabled && matchMenu
  })
})

// 添加计算属性来过滤图标
const filteredIcons = computed(() => {
  if (!searchIcon.value) return icons
  return icons.filter(icon => 
    icon.name.toLowerCase().includes(searchIcon.value.toLowerCase())
  )
})

// ==================== 方法 ====================

async function loadData() {
  loading.value = true
  try {
    // 使用分页接口而不是getAll
    const params = {
      pageIndex: pagination.currentPage,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      isEnabled: searchForm.isEnabled,
      isMenu: searchForm.isMenu
    }
    
    const response = await FrontendRouteApi.getPaged(params)
    routes.value = response.data || []
    pagination.total = response?.totalCount || 0
    //权限分组
    const [treeRes, flatRes, groupRes] = await Promise.all([
      FrontendRouteApi.getTree(),
      FrontendRouteApi.getAll(),
      RouteGroupApi.getAll({ groupType: 1 })
    ])
    treeRoutes.value = treeRes.data || []
    flatRoutes.value = flatRes.data || []
    routeGroups.value = groupRes.data || []
  } catch (e) {
    ElMessage.error('加载数据失败')
    console.error(e)
  } finally {
    loading.value = false
  }
}

// 分页大小改变
function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.currentPage = 1
  loadData()
}

// 当前页改变
function handleCurrentChange(page: number) {
  pagination.currentPage = page
  loadData()
}

function resetSearch() {
  searchForm.keyword = ''
  searchForm.isEnabled = undefined
  searchForm.isMenu = undefined
  pagination.currentPage = 1
  loadData()
}

function openCreateDialog(parent: FrontendRoute | null) {
  dialogMode.value = 'create'
  parentRoute.value = parent
  editingRoute.value = null
  Object.assign(form, defaultForm())
  if (parent) {
    form.parentId = parent.id
  }
  dialogVisible.value = true
}

function openEditDialog(route: FrontendRoute) {
  dialogMode.value = 'edit'
  editingRoute.value = route
  parentRoute.value = null
  // 确保路由分组数据已加载后再设置表单值
  nextTick(() => {
    Object.assign(form, {
      path: route.path,
      name: route.name,
      component: route.component,
      title: route.title,
      icon: route.icon || '',
      sort: route.sort,
      parentId: route.parentId,
      routeGroupId: route.routeGroupId || undefined, // 确保正确处理路由分组ID
      isMenu: route.isMenu,
      isEnabled: route.isEnabled,
      requiredPermission: route.requiredPermission || '',
      description: route.description || ''
    })
    dialogVisible.value = true
  })
}

async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate(async valid => {
    if (!valid) return
    submitting.value = true
    try {
      const payload = {
        path: form.path,
        name: form.name,
        component: form.component,
        title: form.title,
        icon: form.icon || undefined,
        sort: form.sort,
        parentId: form.parentId,
        routeGroupId: form.routeGroupId,
        isMenu: form.isMenu,
        isEnabled: form.isEnabled,
        requiredPermission: form.requiredPermission || undefined,
        description: form.description || undefined
      }
      if (dialogMode.value === 'create') {
        await FrontendRouteApi.create(payload)
        ElMessage.success('路由创建成功')
      } else {
        await FrontendRouteApi.update(editingRoute.value!.id, payload)
        ElMessage.success('路由更新成功')
      }
      dialogVisible.value = false
      loadData()
    } catch (e) {
      ElMessage.error(dialogMode.value === 'create' ? '创建失败' : '更新失败')
    } finally {
      submitting.value = false
    }
  })
}

async function deleteRoute(route: FrontendRoute) {
  try {
    await FrontendRouteApi.delete(route.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {
    ElMessage.error('删除失败')
  }
}

async function toggleStatus(route: FrontendRoute) {
  try {
    await FrontendRouteApi.update(route.id, { isEnabled: route.isEnabled })
    ElMessage.success(`已${route.isEnabled ? '启用' : '禁用'}路由`)
  } catch {
    route.isEnabled = !route.isEnabled
    ElMessage.error('操作失败')
  }
}

async function openBackendDrawer(route: FrontendRoute) {
  currentRoute.value = route
  selectedBackendRoutes.value = []
  backendDrawerVisible.value = true
  try {
    const res = await SysRouteApi.getActive()
    sysRoutes.value = res.data || []
  } catch {
    ElMessage.error('加载后端路由失败')
  }
}

async function saveBackendRoutes() {
  if (!currentRoute.value) return
  submitting.value = true
  try {
    await FrontendRouteApi.associateBackendRoutes(currentRoute.value.id, {
      backendRouteIds: selectedBackendRoutes.value
    })
    ElMessage.success('关联成功')
    backendDrawerVisible.value = false
  } catch {
    ElMessage.error('关联失败')
  } finally {
    submitting.value = false
  }
}

function methodColor(method: string) {
  const map: Record<string, string> = { GET: 'success', POST: 'primary', PUT: 'warning', DELETE: 'danger', PATCH: 'warning' }
  return (map[method?.toUpperCase()] as any) || 'info'
}

// 添加加载权限的方法
async function loadPermissions() {
  try {
    const response = await PermissionService.getList()
    if (response.success) {
      // 处理API返回的不同数据结构
      let permissionList = []
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        permissionList = response.data.data
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
  form.icon = iconName
  iconPickerVisible.value = false
}

// ==================== 生命周期 ====================
onMounted(() => {
  loadData()
  loadPermissions() // 加载权限数据
})
</script>

<style scoped>
.route-management {
  padding: 16px;
}

.search-card {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  margin-top: 4px;
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
</style>