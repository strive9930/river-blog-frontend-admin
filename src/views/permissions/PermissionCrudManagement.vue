<template>
  <div class="permission-crud-management">
    <!-- 页面头部 -->
    <el-card class="header-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div>
            <h2>权限管理</h2>
            <p>完整的权限CRUD操作和状态管理</p>
          </div>
          <div class="header-actions">
            <el-button-group>
              <el-button type="primary" @click="showCreateDialog">
                <el-icon><Plus /></el-icon>新建权限
              </el-button>
              <el-button @click="showImportDialog">
                <el-icon><Upload /></el-icon>导入权限
              </el-button>
              <el-button @click="exportPermissions">
                <el-icon><Download /></el-icon>导出权限
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <!-- 统计信息 -->
      <el-row :gutter="20" class="statistics-row">
        <el-col :span="6">
          <el-statistic title="总权限数" :value="statistics.totalPermissions" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="分组数" :value="statistics.totalGroups" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="启用权限" :value="statistics.enabledPermissions" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="最近更新" :value="statistics.lastUpdated" />
        </el-col>
      </el-row>
    </el-card>

    <!-- 搜索和筛选区域 -->
    <el-card class="filter-card" shadow="never">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索权限名称或编码"
            clearable
            @keyup.enter="loadData"
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
            <el-option
              v-for="group in permissionGroups"
              :key="group.code"
              :label="group.name"
              :value="group.name"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="searchForm.status"
            placeholder="状态筛选"
            clearable
            style="width: 100%"
          >
            <el-option label="启用" value="enabled" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-col>
        <el-col :span="10" class="filter-actions">
          <el-button type="primary" @click="loadData">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="success" @click="showBatchDialog" :disabled="selectedPermissions.length === 0">
            <el-icon><Edit /></el-icon>批量操作
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 权限列表 -->
    <el-card class="list-card" shadow="never">
      <el-table
        :data="paginatedPermissions"
        v-loading="loading"
        row-key="id"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="权限名称" min-width="150">
          <template #default="{ row }">
            <div class="permission-name-cell">
              <strong>{{ row.name }}</strong>
              <el-tag size="small" type="info" style="margin-left: 8px;">
                {{ row.code }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="group" label="权限组" width="120">
          <template #default="{ row }">
            <el-tag :type="getGroupTagType(row.group)">
              {{ row.group || '未分组' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            <span class="description-text">{{ row.description || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="isEnabled" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.isEnabled"
              :active-value="true"
              :inactive-value="false"
              @change="toggleStatus(row)"
              inline-prompt
              active-text="启用"
              inactive-text="禁用"
            />
          </template>
        </el-table-column>
        <el-table-column prop="CreateTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.CreateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group size="small">
              <el-button type="primary" @click="editPermission(row)">
                编辑
              </el-button>
              <el-button type="info" @click="viewDetails(row)">
                详情
              </el-button>
              <el-button type="danger" @click="deletePermission(row)">
                删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredPermissions.length"
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
        ref="formRef"
        label-width="100px"
      >
        <el-form-item label="权限名称" prop="name">
          <el-input
            v-model="permissionForm.name"
            placeholder="请输入权限名称"
          />
        </el-form-item>
        <el-form-item label="权限编码" prop="code">
          <el-input
            v-model="permissionForm.code"
            placeholder="请输入权限编码（唯一标识）"
          />
        </el-form-item>
        <el-form-item label="权限组" prop="group">
          <el-select
            v-model="permissionForm.group"
            placeholder="请选择权限组"
            style="width: 100%"
            filterable
            allow-create
          >
            <el-option
              v-for="group in permissionGroups"
              :key="group.code"
              :label="group.name"
              :value="group.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="权限描述" prop="description">
          <el-input
            v-model="permissionForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入权限描述"
          />
        </el-form-item>
        <el-form-item label="声明类型" prop="claimType">
          <el-input
            v-model="permissionForm.claimType"
            placeholder="默认为 Permission"
          />
        </el-form-item>
        <el-form-item label="声明值" prop="claimValue">
          <el-input
            v-model="permissionForm.claimValue"
            placeholder="默认为权限编码"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>

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
            <el-tag :type="currentPermission.isEnabled ? 'success' : 'danger'">
              {{ currentPermission.isEnabled ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(currentPermission.CreateTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ currentPermission.UpdateTime ? formatDate(currentPermission.UpdateTime) : '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 20px;">
          <strong>权限描述：</strong>
          <p>{{ currentPermission.description || '暂无描述' }}</p>
        </div>

        <div style="margin-top: 20px;">
          <strong>关联角色：</strong>
          <div class="related-items">
            <el-tag
              v-for="role in currentPermission.assignedRoles"
              :key="role.id"
              style="margin: 4px;"
            >
              {{ role.name }}
            </el-tag>
            <span v-if="!currentPermission.assignedRoles?.length">暂无关联角色</span>
          </div>
        </div>

        <div style="margin-top: 20px;">
          <strong>关联用户：</strong>
          <div class="related-items">
            <el-tag
              v-for="user in currentPermission.assignedUsers"
              :key="user.id"
              style="margin: 4px;"
            >
              {{ user.userName }}
            </el-tag>
            <span v-if="!currentPermission.assignedUsers?.length">暂无关联用户</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 批量操作对话框 -->
    <el-dialog
      v-model="batchDialogVisible"
      title="批量操作"
      width="500px"
    >
      <div class="batch-operation">
        <p>已选择 {{ selectedPermissions.length }} 个权限</p>
        <el-radio-group v-model="batchOperationType" style="margin: 20px 0;">
          <el-radio label="enable">批量启用</el-radio>
          <el-radio label="disable">批量禁用</el-radio>
          <el-radio label="delete">批量删除</el-radio>
        </el-radio-group>
        
        <el-alert
          v-if="batchOperationType === 'delete'"
          title="警告：删除操作不可恢复，请谨慎操作！"
          type="warning"
          show-icon
          :closable="false"
        />
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="batchDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="executeBatchOperation"
            :loading="batchSubmitting"
          >
            确定执行
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 导入权限对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入权限"
      width="600px"
    >
      <div class="import-area">
        <el-upload
          ref="uploadRef"
          class="upload-demo"
          drag
          :auto-upload="false"
          :on-change="handleFileChange"
          :limit="1"
          accept=".json"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              只能上传 JSON 文件，且不超过 10MB
            </div>
          </template>
        </el-upload>

        <div v-if="importPreview.length > 0" class="preview-area">
          <h4>预览数据 ({{ importPreview.length }} 条)</h4>
          <el-table :data="importPreview.slice(0, 5)" max-height="200">
            <el-table-column prop="name" label="权限名称" />
            <el-table-column prop="code" label="权限编码" />
            <el-table-column prop="group" label="权限组" />
          </el-table>
          <p v-if="importPreview.length > 5" style="text-align: center; margin-top: 10px;">
            还有 {{ importPreview.length - 5 }} 条数据...
          </p>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="executeImport"
            :disabled="importPreview.length === 0"
            :loading="importing"
          >
            开始导入
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, UploadFile } from 'element-plus'
import { 
  Plus, 
  Search, 
  Edit, 
  Upload, 
  Download, 
  UploadFilled 
} from '@element-plus/icons-vue'
import PermissionService from '@/api/permissionService'
import type { 
  Permission, 
  PermissionDetail, 
  PermissionGroup, 
  CreatePermissionRequest,
  UpdatePermissionRequest,
  ImportPermission
} from '@/api/permissionService'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const batchSubmitting = ref(false)
const importing = ref(false)
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const importDialogVisible = ref(false)
const dialogTitle = ref('创建权限')
const currentPermission = ref<PermissionDetail | null>(null)
const selectedPermissions = ref<Permission[]>([])
const batchOperationType = ref('enable')
const importPreview = ref<ImportPermission[]>([])
const uploadRef = ref()

// 表单引用
const formRef = ref<FormInstance>()

// 搜索表单
const searchForm = reactive({
  keyword: '',
  group: '',
  status: ''
})

// 权限表单
const permissionForm = reactive({
  id: '',
  name: '',
  code: '',
  group: '',
  description: '',
  claimType: 'Permission',
  claimValue: ''
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 统计信息
const statistics = reactive({
  totalPermissions: 0,
  totalGroups: 0,
  enabledPermissions: 0,
  lastUpdated: '-'
})

// 数据列表
const permissions = ref<Permission[]>([])
const permissionGroups = ref<PermissionGroup[]>([])

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入权限编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_.-]+$/, message: '只能包含字母、数字、下划线、点和横线', trigger: 'blur' }
  ],
  group: [
    { required: true, message: '请选择权限组', trigger: 'change' }
  ]
}

// 计算属性
const filteredPermissions = computed(() => {
  let result = [...permissions.value]
  
  // 关键词筛选
  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase()
    result = result.filter(p => 
      p.name.toLowerCase().includes(keyword) ||
      p.code.toLowerCase().includes(keyword) ||
      (p.description && p.description.toLowerCase().includes(keyword))
    )
  }
  
  // 分组筛选
  if (searchForm.group) {
    result = result.filter(p => p.group === searchForm.group)
  }
  
  // 状态筛选
  if (searchForm.status) {
    const isEnabled = searchForm.status === 'enabled'
    result = result.filter(p => p.isEnabled === isEnabled)
  }
  
  return result
})

const paginatedPermissions = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredPermissions.value.slice(start, end)
})

// 生命周期
onMounted(() => {
  loadData()
  loadGroups()
  loadStatistics()
})

// 方法定义
const loadData = async () => {
  try {
    loading.value = true
    const response = await PermissionService.getList({
      group: searchForm.group || undefined,
      keyword: searchForm.keyword || undefined
    })
    
    if (response.success) {
      permissions.value = response.data || []
      pagination.total = permissions.value.length
    } else {
      ElMessage.error(response.message || '获取权限列表失败')
    }
  } catch (error) {
    console.error('获取权限列表失败:', error)
    ElMessage.error('获取权限列表失败')
  } finally {
    loading.value = false
  }
}

const loadGroups = async () => {
  try {
    const response = await PermissionService.getGroups()
    if (response.success) {
      permissionGroups.value = response.data || []
    }
  } catch (error) {
    console.error('获取权限分组失败:', error)
  }
}

const loadStatistics = async () => {
  try {
    const response = await PermissionService.getStatistics()
    if (response.success) {
      const stats = response.data
      statistics.totalPermissions = stats.totalPermissions
      statistics.totalGroups = Object.keys(stats.permissionsByGroup).length
      statistics.enabledPermissions = stats.totalPermissions // 暂时显示总数
      statistics.lastUpdated = new Date(stats.lastUpdated).toLocaleDateString()
    }
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

const showCreateDialog = () => {
  dialogTitle.value = '创建权限'
  resetForm()
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
    claimType: permission.claimType || 'Permission',
    claimValue: permission.claimValue || permission.code
  })
  dialogVisible.value = true
}

const viewDetails = async (permission: Permission) => {
  try {
    const response = await PermissionService.getById(permission.id)
    if (response.success) {
      currentPermission.value = response.data
      detailDialogVisible.value = true
    } else {
      ElMessage.error(response.message || '获取权限详情失败')
    }
  } catch (error) {
    console.error('获取权限详情失败:', error)
    ElMessage.error('获取权限详情失败')
  }
}

const deletePermission = async (permission: Permission) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除权限 "${permission.name}" 吗？此操作不可恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await PermissionService.delete(permission.id)
    if (response.success) {
      ElMessage.success('删除成功')
      loadData()
      loadStatistics()
    } else {
      ElMessage.error(response.message || '删除失败')
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
    const response = permission.isEnabled 
      ? await PermissionService.enable(permission.id)
      : await PermissionService.disable(permission.id)
      
    if (response.success) {
      ElMessage.success(`${action}成功`)
      loadStatistics()
    } else {
      // 恢复原状态
      permission.isEnabled = !permission.isEnabled
      ElMessage.error(response.message || `${action}失败`)
    }
  } catch (error) {
    // 恢复原状态
    permission.isEnabled = !permission.isEnabled
    console.error('更新权限状态失败:', error)
    ElMessage.error('更新状态失败')
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    let response
    if (permissionForm.id) {
      // 更新权限
      const updateTimea: UpdatePermissionRequest = {
        id: permissionForm.id,
        name: permissionForm.name,
        code: permissionForm.code,
        group: permissionForm.group,
        description: permissionForm.description,
        claimType: permissionForm.claimType,
        claimValue: permissionForm.claimValue
      }
      response = await PermissionService.update(permissionForm.id, updateTimea)
    } else {
      // 创建权限
      const createTimea: CreatePermissionRequest = {
        name: permissionForm.name,
        code: permissionForm.code,
        group: permissionForm.group,
        description: permissionForm.description,
        claimType: permissionForm.claimType,
        claimValue: permissionForm.claimValue
      }
      response = await PermissionService.create(createTimea)
    }
    
    if (response.success) {
      ElMessage.success(permissionForm.id ? '更新成功' : '创建成功')
      dialogVisible.value = false
      loadData()
      loadStatistics()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error: any) {
    if (error?.field) {
      // 表单验证错误
      return
    }
    console.error('提交表单失败:', error)
    ElMessage.error('操作失败: ' + (error?.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  Object.assign(permissionForm, {
    id: '',
    name: '',
    code: '',
    group: '',
    description: '',
    claimType: 'Permission',
    claimValue: ''
  })
  formRef.value?.resetFields()
}

const handleDialogClose = () => {
  dialogVisible.value = false
  resetForm()
}

const handleSelectionChange = (selection: Permission[]) => {
  selectedPermissions.value = selection
}

const showBatchDialog = () => {
  batchDialogVisible.value = true
}

const executeBatchOperation = async () => {
  try {
    batchSubmitting.value = true
    
    const permissionIds = selectedPermissions.value.map(p => p.id)
    
    switch (batchOperationType.value) {
      case 'enable':
        const enableResponse = await PermissionService.batchUpdateStatus({
          permissionIds,
          isEnabled: true
        })
        if (enableResponse.success) {
          ElMessage.success('批量启用成功')
          loadData()
        }
        break
        
      case 'disable':
        const disableResponse = await PermissionService.batchUpdateStatus({
          permissionIds,
          isEnabled: false
        })
        if (disableResponse.success) {
          ElMessage.success('批量禁用成功')
          loadData()
        }
        break
        
      case 'delete':
        await ElMessageBox.confirm(
          `确定要删除选中的 ${permissionIds.length} 个权限吗？此操作不可恢复！`,
          '批量删除确认',
          { type: 'warning' }
        )
        
        // 逐个删除（可以根据需要改为批量删除API）
        let successCount = 0
        for (const id of permissionIds) {
          try {
            const response = await PermissionService.delete(id)
            if (response.success) {
              successCount++
            }
          } catch (error) {
            console.error(`删除权限 ${id} 失败:`, error)
          }
        }
        
        ElMessage.success(`成功删除 ${successCount} 个权限`)
        loadData()
        loadStatistics()
        break
    }
    
    batchDialogVisible.value = false
    selectedPermissions.value = []
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('批量操作失败:', error)
      ElMessage.error('批量操作失败: ' + (error?.message || '未知错误'))
    }
  } finally {
    batchSubmitting.value = false
  }
}

const exportPermissions = async () => {
  try {
    const blob = await PermissionService.export(searchForm.group || undefined)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `permissions_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出权限失败:', error)
    ElMessage.error('导出失败')
  }
}

const showImportDialog = () => {
  importPreview.value = []
  importDialogVisible.value = true
}

const handleFileChange = (file: UploadFile) => {
  if (!file.raw) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const data = JSON.parse(content)
      
      // 解析导入数据
      if (data.Permissions && Array.isArray(data.Permissions)) {
        importPreview.value = data.Permissions.map((item: any) => ({
          name: item.Name || item.name,
          code: item.Code || item.code,
          description: item.Description || item.description,
          group: item.Group || item.group,
          claimType: item.ClaimType || item.claimType,
          claimValue: item.ClaimValue || item.claimValue
        }))
      } else if (Array.isArray(data)) {
        importPreview.value = data
      } else {
        ElMessage.error('文件格式不正确')
        return
      }
      
      ElMessage.success(`成功解析 ${importPreview.value.length} 条权限数据`)
    } catch (error) {
      ElMessage.error('文件解析失败')
      console.error('文件解析错误:', error)
    }
  }
  reader.readAsText(file.raw)
}

const executeImport = async () => {
  if (importPreview.value.length === 0) return
  
  try {
    importing.value = true
    const response = await PermissionService.import({
      permissions: importPreview.value
    })
    
    if (response.success) {
      ElMessage.success(response.message || '导入成功')
      importDialogVisible.value = false
      loadData()
      loadStatistics()
    } else {
      ElMessage.error(response.message || '导入失败')
    }
  } catch (error) {
    console.error('导入权限失败:', error)
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

const resetFilters = () => {
  searchForm.keyword = ''
  searchForm.group = ''
  searchForm.status = ''
  pagination.currentPage = 1
  loadData()
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  pagination.currentPage = 1
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getGroupTagType = (group: string) => {
  const types = ['primary', 'success', 'warning', 'danger', 'info']
  const index = Math.abs(group.hashCode()) % types.length
  return types[index]
}

// 字符串哈希函数（用于颜色分配）
String.prototype.hashCode = function() {
  let hash = 0
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  return hash
}
</script>

<style scoped>
.permission-crud-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.card-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.statistics-row {
  margin-top: 20px;
}

.filter-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
}

.permission-name-cell {
  display: flex;
  align-items: center;
}

.description-text {
  color: #606266;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.permission-detail .related-items {
  margin-top: 8px;
}

.batch-operation {
  text-align: center;
}

.upload-demo {
  margin-bottom: 20px;
}

.preview-area {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  background-color: #fafafa;
}

.preview-area h4 {
  margin-top: 0;
  color: #606266;
}
</style>