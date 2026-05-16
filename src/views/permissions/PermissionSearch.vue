<template>
  <div class="permission-search">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>权限搜索中心</span>
          <el-button type="primary" @click="showAdvancedSearch = !showAdvancedSearch">
            <el-icon><Search /></el-icon>
            {{ showAdvancedSearch ? '收起筛选' : '高级搜索' }}
          </el-button>
        </div>
      </template>

      <!-- 搜索条件区域 -->
      <div v-show="showAdvancedSearch" class="search-filters">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索权限名称、编码或描述..."
              clearable
              @keyup.enter="performSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="6">
            <el-select 
              v-model="searchForm.group" 
              placeholder="选择分组" 
              clearable
              style="width: 100%;"
            >
              <el-option label="全部分组" value="" />
              <el-option 
                v-for="group in allGroups" 
                :key="group" 
                :label="group" 
                :value="group" 
              />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select 
              v-model="searchForm.status" 
              placeholder="选择状态" 
              clearable
              style="width: 100%;"
            >
              <el-option label="全部状态" value="" />
              <el-option label="启用" value="enabled" />
              <el-option label="禁用" value="disabled" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="performSearch">搜索</el-button>
          </el-col>
        </el-row>

        <!-- 高级筛选条件 -->
        <el-row :gutter="20" style="margin-top: 15px;">
          <el-col :span="8">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              start-placeholder="创建开始日期"
              end-placeholder="创建结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%;"
            />
          </el-col>
          <el-col :span="8">
            <el-select 
              v-model="searchForm.assignedRole" 
              placeholder="分配给角色" 
              clearable
              style="width: 100%;"
            >
              <el-option label="全部角色" value="" />
              <el-option 
                v-for="role in allRoles" 
                :key="role.id" 
                :label="role.name" 
                :value="role.id" 
              />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-select 
              v-model="searchForm.sortBy" 
              placeholder="排序方式" 
              style="width: 100%;"
            >
              <el-option label="默认排序" value="" />
              <el-option label="按名称排序" value="name" />
              <el-option label="按创建时间排序" value="createTime" />
              <el-option label="按使用频率排序" value="usage" />
            </el-select>
          </el-col>
        </el-row>

        <!-- 快速筛选标签 -->
        <div class="quick-filters" style="margin-top: 15px;">
          <span style="margin-right: 10px;">快速筛选：</span>
          <el-tag 
            v-for="filter in quickFilters" 
            :key="filter.key"
            :type="activeQuickFilters.includes(filter.key) ? 'primary' : 'info'"
            @click="toggleQuickFilter(filter.key)"
            style="cursor: pointer; margin-right: 8px;"
          >
            {{ filter.label }}
          </el-tag>
        </div>
      </div>

      <!-- 搜索结果统计 -->
      <div class="search-results-summary">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic title="搜索结果" :value="searchResults.length" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="总权限数" :value="totalPermissions" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="已分配权限" :value="assignedPermissions" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="搜索耗时" :value="searchDuration" suffix="ms" />
          </el-col>
        </el-row>
      </div>

      <!-- 搜索结果展示 -->
      <div class="search-results">
        <!-- 结果视图切换 -->
        <div class="results-toolbar">
          <div class="view-options">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="list">列表视图</el-radio-button>
              <el-radio-button label="grid">网格视图</el-radio-button>
              <el-radio-button label="tree">树形视图</el-radio-button>
            </el-radio-group>
          </div>
          
          <div class="result-actions">
            <el-button 
              type="primary" 
              :disabled="selectedPermissions.length === 0"
              @click="handleBatchAssign"
            >
              批量分配
            </el-button>
            <el-button 
              type="warning" 
              :disabled="selectedPermissions.length === 0"
              @click="handleBatchExport"
            >
              批量导出
            </el-button>
            <el-button @click="clearSearch">清空搜索</el-button>
          </div>
        </div>

        <!-- 列表视图 -->
        <div v-if="viewMode === 'list'" class="list-view">
          <el-table 
            :data="paginatedResults" 
            style="width: 100%"
            v-loading="searching"
            @selection-change="handleSelectionChange"
            stripe
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="name" label="权限名称" width="180">
              <template #default="scope">
                <div class="permission-name-cell">
                  <strong>{{ scope.row.name }}</strong>
                  <el-tag 
                    v-if="scope.row.isNew" 
                    size="small" 
                    type="success" 
                    style="margin-left: 5px;"
                  >
                    新
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="code" label="权限编码" width="200">
              <template #default="scope">
                <el-tag type="info">{{ scope.row.code }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="group" label="分组" width="120">
              <template #default="scope">
                <el-tag 
                  :type="getGroupTagType(scope.row.group)"
                  effect="plain"
                >
                  {{ scope.row.group || '未分组' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" show-overflow-tooltip />
            <el-table-column prop="assignedRoles" label="分配角色" width="150">
              <template #default="scope">
                <div class="role-tags">
                  <el-tag 
                    v-for="role in scope.row.assignedRoles.slice(0, 2)" 
                    :key="role.id"
                    size="small"
                    style="margin-right: 3px; margin-bottom: 3px;"
                  >
                    {{ role.name }}
                  </el-tag>
                  <el-tag 
                    v-if="scope.row.assignedRoles.length > 2"
                    size="small"
                    type="info"
                  >
                    +{{ scope.row.assignedRoles.length - 2 }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="180" />
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-switch
                  v-model="scope.row.enabled"
                  :active-value="true"
                  :inactive-value="false"
                  @change="handleStatusChange(scope.row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button size="small" type="primary" @click="handleViewDetail(scope.row)">
                  查看详情
                </el-button>
                <el-button size="small" @click="handleAssign(scope.row)">
                  分配权限
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 网格视图 -->
        <div v-else-if="viewMode === 'grid'" class="grid-view">
          <el-row :gutter="20">
            <el-col 
              v-for="permission in paginatedResults" 
              :key="permission.id"
              :span="8"
            >
              <el-card class="permission-card" shadow="hover">
                <div class="card-header">
                  <div class="permission-title">
                    <strong>{{ permission.name }}</strong>
                    <el-tag 
                      v-if="permission.isNew" 
                      size="small" 
                      type="success"
                    >
                      新
                    </el-tag>
                  </div>
                  <el-tag type="info">{{ permission.code }}</el-tag>
                </div>
                
                <div class="card-content">
                  <div class="permission-group">
                    <el-tag 
                      :type="getGroupTagType(permission.group)"
                      effect="plain"
                    >
                      {{ permission.group || '未分组' }}
                    </el-tag>
                  </div>
                  
                  <div class="permission-desc">
                    {{ permission.description }}
                  </div>
                  
                  <div class="permission-meta">
                    <div class="meta-item">
                      <span class="label">创建时间:</span>
                      <span>{{ permission.createTime }}</span>
                    </div>
                    <div class="meta-item">
                      <span class="label">分配角色:</span>
                      <span>{{ permission.assignedRoles.length }}个</span>
                    </div>
                  </div>
                </div>
                
                <div class="card-actions">
                  <el-switch
                    v-model="permission.enabled"
                    :active-value="true"
                    :inactive-value="false"
                    size="small"
                    @change="handleStatusChange(permission)"
                  />
                  <el-button size="small" type="primary" @click="handleViewDetail(permission)">
                    查看详情
                  </el-button>
                  <el-button size="small" @click="handleAssign(permission)">
                    分配
                  </el-button>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 树形视图 -->
        <div v-else-if="viewMode === 'tree'" class="tree-view">
          <el-tree
            :data="treeData"
            :props="treeProps"
            :expand-on-click-node="false"
            default-expand-all
          >
            <template #default="{ node, data }">
              <div v-if="data.type === 'group'" class="tree-group-node">
                <el-tag type="primary">{{ data.label }}</el-tag>
                <span class="group-count">({{ data.children?.length || 0 }}个权限)</span>
              </div>
              <div v-else class="tree-permission-node">
                <div class="permission-info">
                  <strong>{{ data.name }}</strong>
                  <el-tag type="info" size="small">{{ data.code }}</el-tag>
                </div>
                <div class="permission-actions">
                  <el-button size="small" type="primary" @click="handleViewDetail(data)">
                    查看
                  </el-button>
                  <el-button size="small" @click="handleAssign(data)">
                    分配
                  </el-button>
                </div>
              </div>
            </template>
          </el-tree>
        </div>

        <!-- 分页 -->
        <div class="pagination-container" style="margin-top: 20px; text-align: right;">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[12, 24, 48, 96]"
            :total="searchResults.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty 
        v-if="searchResults.length === 0 && !searching" 
        description="未找到匹配的权限"
        :image-size="100"
      >
        <el-button type="primary" @click="clearSearch">清空搜索条件</el-button>
      </el-empty>
    </el-card>

    <!-- 权限详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="currentPermission?.name"
      width="700px"
    >
      <div v-if="currentPermission" class="permission-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="权限名称">
            {{ currentPermission.name }}
          </el-descriptions-item>
          <el-descriptions-item label="权限编码">
            <el-tag type="info">{{ currentPermission.code }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="所属分组">
            <el-tag :type="getGroupTagType(currentPermission.group)">
              {{ currentPermission.group || '未分组' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentPermission.enabled ? 'success' : 'danger'">
              {{ currentPermission.enabled ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ currentPermission.createTime }}
          </el-descriptions-item>
          <el-descriptions-item label="创建人">
            {{ currentPermission.creator }}
          </el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 20px;">
          <strong>权限描述：</strong>
          <p>{{ currentPermission.description }}</p>
        </div>

        <div style="margin-top: 20px;">
          <strong>分配给以下角色：</strong>
          <div class="role-list">
            <el-tag 
              v-for="role in currentPermission.assignedRoles" 
              :key="role.id"
              style="margin: 5px;"
            >
              {{ role.name }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

interface Permission {
  id: number
  name: string
  code: string
  description: string
  group: string
  createTime: string
  creator: string
  enabled: boolean
  assignedRoles: Role[]
  isNew?: boolean
}

interface Role {
  id: number
  name: string
}

interface TreeNode {
  id: string
  label: string
  type: 'group' | 'permission'
  children?: TreeNode[]
  [key: string]: any
}

interface SearchForm {
  keyword: string
  group: string
  status: string
  dateRange: string[] | null
  assignedRole: number | null
  sortBy: string
}

const showAdvancedSearch = ref(true)
const searching = ref(false)
const viewMode = ref('list')
const currentPage = ref(1)
const pageSize = ref(12)
const searchDuration = ref(0)
const detailDialogVisible = ref(false)
const currentPermission = ref<Permission | null>(null)
const selectedPermissions = ref<Permission[]>([])

// 搜索表单
const searchForm = ref<SearchForm>({
  keyword: '',
  group: '',
  status: '',
  dateRange: null,
  assignedRole: null,
  sortBy: ''
})

// 快速筛选
const activeQuickFilters = ref<string[]>([])
const quickFilters = [
  { key: 'recent', label: '最近创建' },
  { key: 'popular', label: '高频使用' },
  { key: 'unassigned', label: '未分配' },
  { key: 'system', label: '系统权限' }
]

// 模拟数据
const allPermissions = ref<Permission[]>([
  {
    id: 1,
    name: '用户查看',
    code: 'user.view',
    description: '查看用户列表和详情信息',
    group: '用户管理',
    createTime: '2024-01-10 09:00:00',
    creator: '系统管理员',
    enabled: true,
    assignedRoles: [
      { id: 1, name: '超级管理员' },
      { id: 2, name: '用户管理员' }
    ],
    isNew: true
  },
  {
    id: 2,
    name: '用户创建',
    code: 'user.create',
    description: '创建新用户账户',
    group: '用户管理',
    createTime: '2024-01-09 14:30:00',
    creator: '系统管理员',
    enabled: true,
    assignedRoles: [
      { id: 1, name: '超级管理员' }
    ]
  }
])

const allGroups = ref(['用户管理', '系统管理', '内容管理', '数据分析'])
const allRoles = ref<Role[]>([
  { id: 1, name: '超级管理员' },
  { id: 2, name: '用户管理员' },
  { id: 3, name: '内容编辑' }
])

// 计算属性
const searchResults = computed<Permission[]>(() => {
  let results = [...allPermissions.value]
  
  // 关键词搜索
  if (searchForm.value.keyword) {
    const keyword = searchForm.value.keyword.toLowerCase()
    results = results.filter(p => 
      p.name.toLowerCase().includes(keyword) ||
      p.code.toLowerCase().includes(keyword) ||
      p.description.toLowerCase().includes(keyword)
    )
  }
  
  // 分组筛选
  if (searchForm.value.group) {
    results = results.filter(p => p.group === searchForm.value.group)
  }
  
  // 状态筛选
  if (searchForm.value.status) {
    const enabled = searchForm.value.status === 'enabled'
    results = results.filter(p => p.enabled === enabled)
  }
  
  // 时间范围筛选
  if (searchForm.value.dateRange && searchForm.value.dateRange.length === 2) {
    const [startDate, endDate] = searchForm.value.dateRange
    results = results.filter(p => {
      const createTime = new Date(p.createTime)
      return createTime >= new Date(startDate) && createTime <= new Date(endDate)
    })
  }
  
  // 排序
  if (searchForm.value.sortBy) {
    switch (searchForm.value.sortBy) {
      case 'name':
        results.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'createTime':
        results.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
        break
      case 'usage':
        // 按使用频率排序（模拟）
        results.sort((a, b) => b.assignedRoles.length - a.assignedRoles.length)
        break
    }
  }
  
  return results
})

const paginatedResults = computed<Permission[]>(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return searchResults.value.slice(start, end)
})

const treeData = computed<TreeNode[]>(() => {
  const groups: Record<string, Permission[]> = {}
  
  searchResults.value.forEach(permission => {
    const group = permission.group || '未分组'
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(permission)
  })
  
  return Object.entries(groups).map(([groupName, permissions]) => ({
    id: `group-${groupName}`,
    label: groupName,
    type: 'group',
    children: permissions.map(p => ({
      id: `perm-${p.id}`,
      label: p.name,
      type: 'permission',
      ...p
    }))
  }))
})

const treeProps = {
  children: 'children',
  label: 'label'
}

const totalPermissions = computed(() => allPermissions.value.length)
const assignedPermissions = computed(() => 
  allPermissions.value.filter(p => p.assignedRoles.length > 0).length
)

// 方法
const performSearch = async () => {
  searching.value = true
  const startTime = Date.now()
  
  try {
    // 模拟搜索延迟
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 这里应该调用实际的搜索API
    // const response = await permissionApi.search(searchForm.value)
    // searchResults.value = response.data
    
    searchDuration.value = Date.now() - startTime
    ElMessage.success(`找到 ${searchResults.value.length} 个匹配的权限`)
  } catch (error) {
    ElMessage.error('搜索失败')
  } finally {
    searching.value = false
  }
}

const toggleQuickFilter = (filterKey: string) => {
  const index = activeQuickFilters.value.indexOf(filterKey)
  if (index > -1) {
    activeQuickFilters.value.splice(index, 1)
  } else {
    activeQuickFilters.value.push(filterKey)
  }
  
  // 应用快速筛选逻辑
  applyQuickFilters()
}

const applyQuickFilters = () => {
  // 根据激活的快速筛选器调整搜索条件
  if (activeQuickFilters.value.includes('recent')) {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    searchForm.value.dateRange = [oneWeekAgo.toISOString().split('T')[0], new Date().toISOString().split('T')[0]]
  }
  
  if (activeQuickFilters.value.includes('unassigned')) {
    // 筛选未分配的权限（模拟）
    // 在实际实现中，这会通过API参数传递
  }
}

const handleSelectionChange = (selection: Permission[]) => {
  selectedPermissions.value = selection
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

const handleViewDetail = (permission: Permission) => {
  currentPermission.value = permission
  detailDialogVisible.value = true
}

const handleAssign = (permission: Permission) => {
  ElMessage.info(`分配权限 "${permission.name}" 功能待实现`)
}

const handleBatchAssign = () => {
  if (selectedPermissions.value.length === 0) return
  ElMessage.info(`批量分配 ${selectedPermissions.value.length} 个权限功能待实现`)
}

const handleBatchExport = () => {
  if (selectedPermissions.value.length === 0) return
  ElMessage.success('权限导出功能已触发')
}

const handleStatusChange = async (permission: Permission) => {
  try {
    // 调用API更新权限状态
    // await permissionApi.updateStatus(permission.id, permission.enabled)
    ElMessage.success(`权限"${permission.name}"状态已更新`)
  } catch (error) {
    ElMessage.error('状态更新失败')
    // 回滚状态
    permission.enabled = !permission.enabled
  }
}

const clearSearch = () => {
  searchForm.value = {
    keyword: '',
    group: '',
    status: '',
    dateRange: null,
    assignedRole: null,
    sortBy: ''
  }
  activeQuickFilters.value = []
  currentPage.value = 1
  performSearch()
}

const getGroupTagType = (group: string) => {
  const types = ['primary', 'success', 'warning', 'danger', 'info']
  const index = Math.abs((group || '').hashCode ? (group || '').hashCode() : 0) % types.length
  return types[index] || 'info'
}

// 初始化
onMounted(() => {
  performSearch()
})
</script>

<style scoped>
.permission-search {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-filters {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 20px;
}

.search-results-summary {
  margin: 20px 0;
  padding: 15px;
  background-color: #f0f9ff;
  border-radius: 4px;
}

.results-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.result-actions {
  display: flex;
  gap: 10px;
}

.permission-name-cell {
  display: flex;
  align-items: center;
}

.role-tags {
  display: flex;
  flex-wrap: wrap;
}

.list-view {
  margin-top: 20px;
}

.grid-view {
  margin-top: 20px;
}

.permission-card {
  margin-bottom: 20px;
  height: 200px;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.permission-title {
  display: flex;
  align-items: center;
  gap: 5px;
}

.card-content {
  flex: 1;
}

.permission-group {
  margin-bottom: 8px;
}

.permission-desc {
  color: #606266;
  font-size: 14px;
  margin-bottom: 10px;
  line-height: 1.4;
}

.permission-meta {
  font-size: 12px;
  color: #909399;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3px;
}

.label {
  font-weight: bold;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
}

.tree-view {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.tree-group-node {
  display: flex;
  align-items: center;
  gap: 10px;
}

.group-count {
  color: #909399;
  font-size: 14px;
}

.tree-permission-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 5px 0;
}

.permission-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.permission-actions {
  display: flex;
  gap: 5px;
}

.permission-detail :deep(.el-descriptions__body) {
  background-color: #f5f7fa;
}

.role-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
}
</style>