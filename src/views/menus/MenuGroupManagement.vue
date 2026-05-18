<template>
  <div class="menu-group-management">
    <!-- 操作栏 -->
    <el-card class="filter-card mb-20">
      <div class="filter-container">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索菜单组名称或编码"
          style="width: 300px; margin-right: 15px;"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="resetSearch">重置</el-button>
        <div class="right-actions">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增菜单组
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 菜单组列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>菜单组列表</span>
          <div class="header-actions">
            <span class="total-count">共 {{ pagination.total }} 个菜单组</span>
            <el-button link type="primary" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table 
        :data="menuGroups"
        v-loading="loading"
        style="width: 100%"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" :index="getIndex" label="序号" width="80" align="center" />
        <el-table-column prop="name" label="菜单组名称" min-width="150">
          <template #default="scope">
            <div class="group-name-cell">
              <el-icon v-if="scope.row.icon" class="group-icon">
                <component :is="scope.row.icon" />
              </el-icon>
              <strong>{{ scope.row.name }}</strong>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="编码" width="150">
          <template #default="scope">
            <el-tag type="info">{{ scope.row.code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.isEnabled ? 'success' : 'danger'" size="small">
              {{ scope.row.isEnabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="menuCount" label="菜单数" width="100" align="center">
          <template #default="scope">
            <el-tag type="primary">{{ scope.row.menuCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
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
              :disabled="scope.row.menuCount > 0"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; text-align: right"
      />

      <!-- 批量操作 -->
      <div v-if="selectedGroups.length > 0" class="batch-actions">
        <div class="batch-info">
          已选择 {{ selectedGroups.length }} 个菜单组
        </div>
        <div class="batch-buttons">
          <el-button @click="handleBatchEnable" :disabled="!canBatchEnable">
            批量启用
          </el-button>
          <el-button @click="handleBatchDisable" :disabled="!canBatchDisable">
            批量禁用
          </el-button>
          <el-button type="danger" @click="handleBatchDelete" :disabled="hasGroupsInUse">
            批量删除
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 菜单组详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="dialogTitle"
      width="600px"
      :before-close="handleDialogClose"
    >
      <el-form
        ref="groupFormRef"
        :model="groupForm"
        :rules="groupFormRules"
        label-width="120px"
        v-loading="formLoading"
      >
        <el-form-item label="菜单组名称" prop="name">
          <el-input v-model="groupForm.name" placeholder="请输入菜单组名称" />
        </el-form-item>
        
        <el-form-item label="编码" prop="code">
          <el-input v-model="groupForm.code" placeholder="请输入唯一编码，如：SYSTEM" />
          <div class="form-tip">编码用于系统内部标识，请确保唯一性</div>
        </el-form-item>
        
        <el-form-item label="图标" prop="icon">
          <el-input v-model="groupForm.icon" placeholder="请输入图标名称，如：Setting" />
        </el-form-item>
        
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="groupForm.sort" :min="0" :max="999" style="width: 100%;" />
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input 
            v-model="groupForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入菜单组描述"
          />
        </el-form-item>
        
        <el-form-item label="是否启用">
          <el-switch v-model="groupForm.isEnabled" />
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
import MenuApiService, { type MenuGroup } from '@/api/menu'

interface MenuGroup {
  id: string
  name: string
  code: string
  description?: string
  icon?: string
  sort: number
  isEnabled: boolean
  menuCount: number
  createTime: string
}

// 使用加载和反馈服务
const { loading, start: startLoading, stop: stopLoading } = useLoading()
const { success, error, confirmDelete } = useFeedback()

// 响应式数据
const menuGroups = ref<MenuGroup[]>([])
const selectedGroups = ref<MenuGroup[]>([])

// 分页相关
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 搜索表单
const searchForm = reactive({
  keyword: ''
})

// 表单相关
const groupFormRef = ref()
const dialogTitle = ref('')
const detailDialogVisible = ref(false)
const formLoading = ref(false)
const submitLoading = ref(false)

// 菜单组表单
const groupForm = reactive({
  id: '',
  name: '',
  code: '',
  description: '',
  icon: '',
  sort: 0,
  isEnabled: true
})

// 表单验证规则
const groupFormRules = {
  name: [
    { required: true, message: '请输入菜单组名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入编码', trigger: 'blur' },
    { pattern: /^[A-Z_]+$/, message: '编码只能包含大写字母和下划线', trigger: 'blur' }
  ]
}

// 计算属性
const canBatchEnable = computed(() => {
  return selectedGroups.value.some(group => !group.isEnabled)
})

const canBatchDisable = computed(() => {
  return selectedGroups.value.some(group => group.isEnabled)
})

const hasGroupsInUse = computed(() => {
  return selectedGroups.value.some(group => group.menuCount > 0)
})

// 获取表格序号，考虑分页情况
const getIndex = (index: number) => {
  return (pagination.currentPage - 1) * pagination.pageSize + index + 1
}

// API 调用函数 - 使用分页接口
const fetchMenuGroups = async (): Promise<{data: MenuGroup[], totalCount: number}> => {
  const params = {
    pageIndex: pagination.currentPage,
    pageSize: pagination.pageSize,
    keyword: searchForm.keyword
  }
  
  console.log('请求参数:', params)
  const response = await MenuApiService.getMenuGroupPagedList(params)
  console.log('API 响应:', response)
  
  if (response.success) {
    // 根据后端返回格式：分页信息在根级别，数据在 response.data 中
    // 响应结构：{ success, message, code, timestamp, pageIndex, pageSize, totalCount, totalPages, data: [...] }
    const result = {
      data: response.data || [], // response.data 是实际的菜单组列表
      totalCount: response.totalCount || 0 // response.totalCount 在根级别
    }
    console.log('解析后的数据:', result)
    return result
  } else {
    throw new Error(response.message || '获取菜单组列表失败')
  }
}

// 操作函数
const loadData = async () => {
  startLoading()
  try {
    const result = await fetchMenuGroups()
    console.log('加载菜单组数据:', result)
    menuGroups.value = result.data
    pagination.total = result.totalCount
    console.log('分页信息 - 当前页:', pagination.currentPage, '每页大小:', pagination.pageSize, '总数:', pagination.total)
  } catch (err: any) {
    console.error('加载菜单组失败:', err)
    error('加载数据失败: ' + err.message)
  } finally {
    stopLoading()
  }
}

const handleSearch = () => {
  pagination.currentPage = 1
  loadData()
}

const resetSearch = () => {
  searchForm.keyword = ''
  pagination.currentPage = 1
  loadData()
}

const refreshData = () => {
  loadData()
}

const handleAdd = () => {
  dialogTitle.value = '新增菜单组'
  resetForm()
  detailDialogVisible.value = true
}

const handleView = (row: MenuGroup) => {
  dialogTitle.value = '查看菜单组'
  Object.assign(groupForm, row)
  detailDialogVisible.value = true
}

const handleEdit = (row: MenuGroup) => {
  dialogTitle.value = '编辑菜单组'
  Object.assign(groupForm, row)
  detailDialogVisible.value = true
}

const handleDelete = async (row: MenuGroup) => {
  if (row.menuCount > 0) {
    error('该菜单组下还有菜单项，无法删除')
    return
  }
  
  if (await confirmDelete(`菜单组 "${row.name}"`)) {
    try {
      const response = await MenuApiService.deleteMenuGroup(row.id)
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
  if (!groupFormRef.value) return
  
  try {
    await groupFormRef.value.validate()
    submitLoading.value = true
    
    let response
    if (groupForm.id) {
      // 更新菜单组
      const updateTimea = { ...groupForm }
      delete updateTimea.id
      response = await MenuApiService.updateMenuGroup(groupForm.id, updateTimea)
    } else {
      // 创建菜单组
      const createTimea = { ...groupForm }
      delete createTimea.id
      response = await MenuApiService.createMenuGroup(createTimea)
    }
    
    if (response.success) {
      success(dialogTitle.value === '新增菜单组' ? '创建成功' : '更新成功')
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
  Object.assign(groupForm, {
    id: '',
    name: '',
    code: '',
    description: '',
    icon: '',
    sort: 0,
    isEnabled: true
  })
  groupFormRef.value?.resetFields()
}

const handleSelectionChange = (selection: MenuGroup[]) => {
  selectedGroups.value = selection
}

const handleToggleStatus = async (row: MenuGroup) => {
  try {
    const action = row.isEnabled ? '禁用' : '启用'
    await ElMessageBox.confirm(`确定要${action}菜单组 "${row.name}" 吗？`, '确认操作')
    
    // 更新菜单组状态，同时传递name和code以确保数据一致性
    const response = await MenuApiService.updateMenuGroup(row.id, {
      name: row.name,
      code: row.code,
      isEnabled: !row.isEnabled
    })
    
    if (response.success) {
      row.isEnabled = !row.isEnabled
      success(`${action}成功`)
      // 重新加载数据以更新计数
      loadData()
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
    await ElMessageBox.confirm(`确定要启用选中的 ${selectedGroups.value.length} 个菜单组吗？`, '批量启用')
    
    // 这里需要逐个更新，传递完整的数据以确保一致性
    const promises = selectedGroups.value.map(group => 
      MenuApiService.updateMenuGroup(group.id, { 
        name: group.name,
        code: group.code,
        isEnabled: true
      })
    )
    
    const results = await Promise.all(promises)
    const successCount = results.filter(r => r.success).length
    
    if (successCount === selectedGroups.value.length) {
      success('批量启用成功')
    } else {
      success(`部分启用成功 (${successCount}/${selectedGroups.value.length})`)
    }
    
    loadData()
  } catch (err: any) {
    if (err !== 'cancel') {
      error('操作失败: ' + err.message)
    }
  }
}

const handleBatchDisable = async () => {
  try {
    await ElMessageBox.confirm(`确定要禁用选中的 ${selectedGroups.value.length} 个菜单组吗？`, '批量禁用')
    
    // 这里需要逐个更新，传递完整的数据以确保一致性
    const promises = selectedGroups.value.map(group => 
      MenuApiService.updateMenuGroup(group.id, { 
        name: group.name,
        code: group.code,
        isEnabled: false
      })
    )
    
    const results = await Promise.all(promises)
    const successCount = results.filter(r => r.success).length
    
    if (successCount === selectedGroups.value.length) {
      success('批量禁用成功')
    } else {
      success(`部分禁用成功 (${successCount}/${selectedGroups.value.length})`)
    }
    
    loadData()
  } catch (err: any) {
    if (err !== 'cancel') {
      error('操作失败: ' + err.message)
    }
  }
}

const handleBatchDelete = async () => {
  if (hasGroupsInUse.value) {
    error('选中的菜单组中包含正在使用的组，无法删除')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedGroups.value.length} 个菜单组吗？此操作不可撤销！`, 
      '批量删除', 
      { type: 'error' }
    )
    
    // 这里需要逐个删除
    const promises = selectedGroups.value.map(group => 
      MenuApiService.deleteMenuGroup(group.id)
    )
    
    const results = await Promise.all(promises)
    const successCount = results.filter(r => r.success).length
    
    if (successCount === selectedGroups.value.length) {
      success('批量删除成功')
    } else {
      success(`部分删除成功 (${successCount}/${selectedGroups.value.length})`)
    }
    
    loadData()
  } catch (err: any) {
    if (err !== 'cancel') {
      error('操作失败: ' + err.message)
    }
  }
}

// 分页相关方法
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  loadData()
}

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  loadData()
}

// 组件挂载
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.menu-group-management {
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

.group-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-icon {
  font-size: 16px;
  color: #409EFF;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
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
</style>