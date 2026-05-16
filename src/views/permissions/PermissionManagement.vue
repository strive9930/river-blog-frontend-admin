<template>
  <div class="permission-management">
    <!-- 权限列表管理 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>权限管理</span>
          <el-button type="primary" @click="refreshData">
            <el-icon><Refresh /></el-icon>刷新
          </el-button>
        </div>
      </template>
      
      <el-row :gutter="20" class="toolbar">
        <el-col :span="6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索权限名称或编码"
            clearable
            @keyup.enter="searchPermissions"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="searchForm.group"
            placeholder="权限组筛选"
            clearable
            style="width: 100%"
          >
            <el-option label="系统管理" value="system"></el-option>
            <el-option label="用户管理" value="user"></el-option>
            <el-option label="内容管理" value="content"></el-option>
          </el-select>
        </el-col>
        <el-col :span="14" class="actions">
          <el-button type="primary" @click="searchPermissions">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="success" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>新建权限
          </el-button>
        </el-col>
      </el-row>
      
      <el-table
        :data="permissionList"
        v-loading="loading"
        stripe
        style="width: 100%"
        row-key="id"
      >
        <el-table-column label="序号" width="60" align="center">
          <template #default="{ $index }">
            {{ ($index + 1) + (pagination.currentPage - 1) * pagination.pageSize }}
          </template>
        </el-table-column>
        <el-table-column prop="name" label="权限名称" width="150"></el-table-column>
        <el-table-column prop="code" label="权限编码" width="150"></el-table-column>
        <el-table-column prop="group" label="权限组" width="120">
          <template #default="{ row }">
            <el-tag :type="getGroupTagType(row.group)">
              {{ getGroupName(row.group) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip></el-table-column>
        <el-table-column prop="roles" label="关联角色" width="150">
          <template #default="{ row }">
            <template v-if="Array.isArray(row.roles) && row.roles.length > 0">
              <el-tag
                v-for="role in row.roles.slice(0, 2)"
                :key="role.id"
                size="small"
                style="margin: 2px;"
              >
                {{ role.name }}
              </el-tag>
              <el-tag v-if="row.roles.length > 2" size="small" type="info">
                +{{ row.roles.length - 2 }}
              </el-tag>
            </template>
            <template v-else>
              <el-tag size="small" type="info">无关联角色</el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="isEnabled" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.isEnabled"
              @change="toggleStatus(row)"
              active-text="启用"
              inactive-text="禁用"
            />
          </template>
        </el-table-column>
        <el-table-column prop="CreateTime" label="创建时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDate(row.CreateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetails(row)">查看</el-button>
            <el-button size="small" type="primary" @click="editPermission(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deletePermission(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑权限对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :before-close="handleDialogClose"
    >
      <el-form
        :model="permissionForm"
        :rules="formRules"
        ref="permissionFormRef"
        label-width="100px"
      >
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="permissionForm.name" placeholder="请输入权限名称"></el-input>
        </el-form-item>
        <el-form-item label="权限编码" prop="code">
          <el-input v-model="permissionForm.code" placeholder="请输入权限编码"></el-input>
        </el-form-item>
        <el-form-item label="权限组" prop="group">
          <el-select v-model="permissionForm.group" placeholder="请选择权限组" style="width: 100%">
            <el-option label="系统管理" value="system"></el-option>
            <el-option label="用户管理" value="user"></el-option>
            <el-option label="内容管理" value="content"></el-option>
            <el-option label="数据管理" value="data"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="permissionForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入权限描述"
          ></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="permissionForm.isEnabled"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelDialog">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 查看权限详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="权限详情"
      width="600px"
      :before-close="closeDetailDialog"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="权限名称">{{ currentPermission.name }}</el-descriptions-item>
        <el-descriptions-item label="权限编码">{{ currentPermission.code }}</el-descriptions-item>
        <el-descriptions-item label="权限组">
          <el-tag :type="getGroupTagType(currentPermission.group)">
            {{ getGroupName(currentPermission.group) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentPermission.isEnabled ? 'success' : 'danger'">
            {{ currentPermission.isEnabled ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">
          {{ currentPermission.description || '暂无描述' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(currentPermission.CreateTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ currentPermission.UpdateTime ? formatDate(currentPermission.UpdateTime) : '暂无更新记录' }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDetailDialog">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Refresh } from '@element-plus/icons-vue'
import { PermissionService } from '@/api/permissionService'
import type { Permission } from '@/types/permission'

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const detailDialogVisible = ref(false)
const currentPermission = ref<Partial<Permission>>({})

// 权限列表数据
const permissionList = ref<Permission[]>([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  group: ''
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 权限表单
const permissionForm = reactive({
  id: '',
  name: '',
  code: '',
  group: '',
  description: '',
  isEnabled: true
})

// 表单引用
const permissionFormRef = ref()

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入权限编码', trigger: 'blur' },
    // { pattern: /^[a-zA-Z0-9:_-]+$/, message: '只能包含字母、数字、冒号、下划线和横线', trigger: 'blur' }
  ],
  group: [
    { required: true, message: '请选择权限组', trigger: 'change' }
  ]
}

// 方法
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      pageIndex: pagination.currentPage,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      group: searchForm.group || undefined
    }
    
    const response = await PermissionService.getPagedList(params)
    if (response && response.success) {
      // 处理扁平的权限数据
      if (Array.isArray(response.data)) {
        // 直接使用API返回的扁平权限数据
        const permissions: Permission[] = response.data.map(permission => ({
          id: permission.id,
          name: permission.name,
          code: permission.code,
          group: permission.group || '默认分组',
          description: permission.description || '',
          isEnabled: permission.isEnabled !== undefined ? permission.isEnabled : true,
          isAssigned: permission.isAssigned || false,
          CreateTime: permission.CreateTime || new Date().toISOString(),
          UpdateTime: permission.UpdateTime || undefined,
          roles: [] // API未返回角色信息
        }));
        permissionList.value = permissions;
        pagination.total = response.totalCount;
      } else {
        permissionList.value = [];
        pagination.total = 0;
      }
    } else {
      ElMessage.error(response?.message || '获取权限列表失败')
      permissionList.value = []
    }
  } catch (error: any) {
    console.error('获取权限列表失败:', error)
    ElMessage.error('获取权限列表失败: ' + (error?.message || '未知错误'))
    permissionList.value = []
  } finally {
    loading.value = false
  }
}

const searchPermissions = () => {
  pagination.currentPage = 1
  loadData()
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.group = ''
  pagination.currentPage = 1
  loadData()
}

const refreshData = () => {
  loadData()
}

const showCreateDialog = () => {
  dialogTitle.value = '创建权限'
  resetPermissionForm()
  dialogVisible.value = true
}

const editPermission = (permission: Permission) => {
  dialogTitle.value = '编辑权限'
  Object.assign(permissionForm, {
    id: permission.id,
    name: permission.name,
    code: permission.code,
    group: permission.group,
    description: permission.description || '',
    isEnabled: permission.isEnabled
  })
  dialogVisible.value = true
}

const viewDetails = (permission: Permission) => {
  currentPermission.value = { ...permission }
  detailDialogVisible.value = true
}

const closeDetailDialog = () => {
  detailDialogVisible.value = false
  currentPermission.value = {}
}

const deletePermission = async (permission: Permission) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除权限 "${permission.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await PermissionService.delete(permission.id)
    if (response && response.success) {
      ElMessage.success('删除成功')
      loadData()
    } else {
      ElMessage.error(response?.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除权限失败:', error)
      ElMessage.error('删除失败: ' + (error?.message || '未知错误'))
    }
  }
}

const toggleStatus = async (permission: Permission) => {
  try {
    const action = permission.isEnabled ? '启用' : '禁用'
    await ElMessageBox.confirm(
      `确定要${action}权限 "${permission.name}" 吗？`,
      '状态变更确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await PermissionService.update(permission.id, { isEnabled: permission.isEnabled,code: permission.code, name: permission.name, group: permission.group, description: permission.description })
    if (response && response.success) {
      permission.isEnabled = !permission.isEnabled
      ElMessage.success(`${action}成功`)
      loadData();
    } else {
      ElMessage.error(response?.message || `${action}失败`)
      // 回滚状态
      permission.isEnabled = !permission.isEnabled
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('更新权限状态失败:', error)
      ElMessage.error('状态更新失败: ' + (error?.message || '未知错误'))
      // 回滚状态
      permission.isEnabled = !permission.isEnabled
    }
  }
}

const submitForm = async () => {
  if (!permissionFormRef.value) return
  
  try {
    await permissionFormRef.value.validate()
    submitLoading.value = true
    
    let response
    if (permissionForm.id) {
      // 编辑
      response = await PermissionService.update(permissionForm.id, permissionForm)
    } else {
      // 创建
      const createTimea = {
        name: permissionForm.name,
        code: permissionForm.code,
        group: permissionForm.group,
        description: permissionForm.description,
        isEnabled: permissionForm.isEnabled
      }
      response = await PermissionService.create(createTimea)
    }
    
    if (response && response.success) {
      ElMessage.success(permissionForm.id ? '编辑成功' : '创建成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(response?.message || (permissionForm.id ? '编辑失败' : '创建失败'))
    }
  } catch (error: any) {
    console.error('提交表单失败:', error)
    ElMessage.error('操作失败: ' + (error?.message || '未知错误'))
  } finally {
    submitLoading.value = false
  }
}

const cancelDialog = () => {
  dialogVisible.value = false
  resetPermissionForm()
}

const handleDialogClose = () => {
  cancelDialog()
}

const resetPermissionForm = () => {
  Object.assign(permissionForm, {
    id: '',
    name: '',
    code: '',
    group: '',
    description: '',
    isEnabled: true
  })
  permissionFormRef.value?.clearValidate()
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  pagination.currentPage = 1
  loadData()
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  loadData()
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

const getGroupTagType = (group: string) => {
  const types: Record<string, string> = {
    'system': 'danger',
    'user': 'primary',
    'content': 'success',
    'data': 'warning'
  }
  return types[group] || 'info'
}

const getGroupName = (group: string) => {
  const names: Record<string, string> = {
    'system': '系统管理',
    'user': '用户管理',
    'content': '内容管理',
    'data': '数据管理'
  }
  return names[group] || group
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.permission-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-footer {
  text-align: right;
}
</style>