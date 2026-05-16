<template>
  <div class="role-management">
    <!-- 搜索和操作区域 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索角色名称或描述"
            clearable
            @keyup.enter="searchRoles"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="searchForm.status"
            placeholder="状态筛选"
            clearable
            style="width: 100%"
          >
            <el-option label="启用" value="enabled"></el-option>
            <el-option label="禁用" value="disabled"></el-option>
          </el-select>
        </el-col>
        <el-col :span="14">
          <el-button type="primary" @click="searchRoles">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="success" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>新建角色
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 角色列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>角色列表</span>
          <div>
            <el-button type="primary" link @click="refreshData">
              <el-icon><Refresh /></el-icon>刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table
        :data="roleList"
        v-loading="loading"
        stripe
        style="width: 100%"
        row-key="id"
      >
        <el-table-column label="序号" width="80" align="center">
          <template #default="{ $index }">
            {{ ($index + 1) + (pagination.currentPage - 1) * pagination.pageSize }}
          </template>
        </el-table-column>
        <el-table-column prop="name" label="角色名称" width="150"></el-table-column>
        <el-table-column prop="code" label="角色编码" width="150"></el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip></el-table-column>
        <el-table-column prop="userCount" label="用户数" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ row.userCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="permissionCount" label="权限数" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="success">{{ row.permissionCount || 0 }}</el-tag>
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
            <el-button size="small" type="primary" @click="editRole(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteRole(row)">删除</el-button>
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
    </el-card>

    <!-- 创建/编辑角色对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :before-close="handleDialogClose"
    >
      <el-form
        :model="roleForm"
        :rules="formRules"
        ref="roleFormRef"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称"></el-input>
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="roleForm.code" placeholder="请输入角色编码"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="roleForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          ></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="roleForm.isEnabled"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        <el-form-item label="权限分配">
          <el-select
            v-model="roleForm.permissionIds"
            multiple
            filterable
            placeholder="请选择权限"
            style="width: 100%"
          >
            <el-option
              v-for="permission in permissionOptions"
              :key="permission.id"
              :label="permission.name"
              :value="permission.id"
            >
            </el-option>
          </el-select>
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

    <!-- 角色详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="角色详情"
      width="800px"
      :before-close="handleDetailDialogClose"
    >
      <div v-if="currentRole" class="role-detail">
        <el-tabs v-model="activeDetailTab">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="角色名称">{{ currentRole.name }}</el-descriptions-item>
              <el-descriptions-item label="角色编码">{{ currentRole.code }}</el-descriptions-item>
              <el-descriptions-item label="描述" :span="2">{{ currentRole.description }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="currentRole.isEnabled ? 'success' : 'danger'">
                  {{ currentRole.isEnabled ? '启用' : '禁用' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ formatDate(currentRole.CreateTime) }}
              </el-descriptions-item>
              <el-descriptions-item label="用户数">
                <el-tag type="info">{{ currentRole.userCount || 0 }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="权限数">
                <el-tag type="success">{{ currentRole.permissionCount || 0 }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
            
              <!-- <div class="detail-section">
                <h4>关联权限</h4>
                <el-tag
                  v-for="permission in currentRole.permissions"
                  :key="permission.id"
                  style="margin: 5px;"
                >
                  {{ permission.name }}
                </el-tag>
                <div v-if="!currentRole.permissions || currentRole.permissions.length === 0" class="empty-text">
                  暂无关联权限
                </div>
              </div> -->
          </el-tab-pane>
          
          <!-- 权限管理 -->
          <el-tab-pane label="权限管理" name="permissions">
            <RolePermissionView 
              :role-id="currentRole.id" 
              @saved="handlePermissionSaved"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Refresh } from '@element-plus/icons-vue'
import { RoleService } from '../../api/permissionService'
import { PermissionService } from '@/services/permission.service'

// 类型定义
interface Role {
  id: string
  name: string
  code: string
  description: string
  isEnabled: boolean
  userCount: number
  permissionCount: number
  CreateTime: string
  permissions?: Array<{
    id: string
    name: string
    code?: string
    description?: string | null
    group?: string
  }>
}

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogTitle = ref('')
const currentRole = ref<Role | null>(null)
const activeDetailTab = ref('basic') // 添加详情对话框的标签页状态

const roleList = ref<Role[]>([])

// 权限选项数据
const permissionOptions = ref<Array<{id: string, name: string}>>([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: ''
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 2
})

// 角色表单
const roleForm = reactive({
  id: '',
  name: '',
  code: '',
  description: '',
  isEnabled: true,
  permissionIds: [] as string[]
})

// 表单引用
const roleFormRef = ref()

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '只能包含字母、数字、下划线和横线', trigger: 'blur' }
  ]
}

// 方法
const searchRoles = async () => {
  try {
    loading.value = true
    
    // 构建查询参数
    const queryParams: any = {}
    
    if (searchForm.keyword) {
      queryParams.keyword = searchForm.keyword.trim()
    }
    if (searchForm.status) {
      queryParams.status = searchForm.status
    }
    
    // 添加分页参数
    queryParams.pageIndex = pagination.currentPage
    queryParams.pageSize = pagination.pageSize
    
    // 使用查询参数调用API
    const response = await RoleService.getPagedList(queryParams)
    
    if (response.success) {
      // 处理搜索结果 - 注意API返回的字段名是createTime而非CreateTime
      roleList.value = (response.data || []).map((role: any) => ({
        id: role.id,
        name: role.name,
        code: role.code,
        description: role.description || '',
        isEnabled: role.isEnabled !== undefined ? role.isEnabled : true,
        userCount: role.userCount || 0,
        permissionCount: role.permissionCount || 0,
        CreateTime: role.createTime || new Date().toISOString(), // API返回的是createTime
        permissions: []
      }))
      
      pagination.total = response.totalCount // 直接从response获取totalCount
      ElMessage.success(`找到 ${roleList.value.length} 条记录`)
    } else {
      ElMessage.error(response.message || '搜索失败')
      // 搜索失败时清空列表
      roleList.value = []
      pagination.total = 0
    }
  } catch (error) {
    console.error('搜索角色失败:', error)
    ElMessage.error('搜索失败: ' + (error as Error).message)
    // 出错时清空列表
    roleList.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  // 重置分页到第一页
  pagination.currentPage = 1
  // 重新加载所有数据
  refreshData()
  ElMessage.success('搜索条件已重置')
}

const refreshData = async () => {
  try {
    loading.value = true
    const response = await RoleService.getPagedList({
      pageIndex: pagination.currentPage,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined
    })
    
    if (response.success) {
      // 映射API返回的数据格式到前端期望的格式 - 注意API返回的字段名是createTime而非CreateTime
      roleList.value = (response.data || []).map((role: any) => ({
        id: role.id,
        name: role.name,
        code: role.code,
        description: role.description || '',
        isEnabled: role.isEnabled !== undefined ? role.isEnabled : true,
        userCount: role.userCount || 0,
        permissionCount: role.permissionCount || 0,
        CreateTime: role.createTime || new Date().toISOString(), // API返回的是createTime
        permissions: [] // API未返回权限详情
      }))
      pagination.total = response.totalCount // 直接从response获取totalCount
      ElMessage.success('数据刷新成功')
    } else {
      ElMessage.error(response.message || '获取角色列表失败')
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

// 添加加载权限选项的方法
const loadPermissionOptions = async () => {
  try {
    const response = await PermissionService.getList()
    console.log('权限选项:', response)
    if (response.success && response.data) {
      // 处理API返回的不同数据结构
      let permissions = [];
      
      // 检查是否是分页结构 { data: { data: [...] } }
      if (response.data.data && Array.isArray(response.data.data)) {
        permissions = response.data.data;
      } 
      // 检查是否是直接数组结构 { data: [...] }
      else if (Array.isArray(response.data)) {
        permissions = response.data;
      }
      // 如果都不是，尝试直接使用response.data
      else if (Array.isArray(response.data)) {
        permissions = response.data;
      }
      
      // 将API返回的权限数据映射为选项格式
      permissionOptions.value = permissions.map((permission: any) => ({
        id: permission.id,
        name: permission.name
      }))
    } else {
      // 如果API调用失败，使用默认选项
      console.warn('获取权限列表失败，使用默认选项:', response?.message)
      permissionOptions.value = [
        { id: '1', name: '用户管理' },
        { id: '2', name: '角色管理' },
        { id: '3', name: '权限管理' },
        { id: '4', name: '系统设置' },
        { id: '5', name: '内容管理' }
      ]
    }
  } catch (error: any) {
    console.error('加载权限选项失败:', error?.message || error)
    // 出错时使用默认选项
    permissionOptions.value = [
      { id: '1', name: '用户管理' },
      { id: '2', name: '角色管理' },
      { id: '3', name: '权限管理' },
      { id: '4', name: '系统设置' },
      { id: '5', name: '内容管理' }
    ]
  }
}

const showCreateDialog = () => {
  dialogTitle.value = '创建角色'
  resetRoleForm()
  dialogVisible.value = true
}

const editRole = async (role: Role) => {
  dialogTitle.value = '编辑角色'
  // 先复制角色的基本信息
  Object.assign(roleForm, role)
  
  // 加载角色的权限状态
  try {
    const rolePermissionStatusResponse = await PermissionService.getRolePermissionStatus(role.id)
    
    if (rolePermissionStatusResponse && rolePermissionStatusResponse.success) {
      const permissionData = rolePermissionStatusResponse.data || {}  
      // 确保所有权限ID都是字符串类型
      roleForm.permissionIds = permissionData.assignedPermissionIds;
    } else {
      // 如果获取权限失败，默认清空权限列表
      roleForm.permissionIds = []
      console.warn('获取角色权限失败:', rolePermissionStatusResponse?.message)
    }
  } catch (error) {
    console.error('获取角色权限时出错:', error)
    // 发生异常时也清空权限列表
    roleForm.permissionIds = []
  }
  
  dialogVisible.value = true
}

const viewDetails = async (role: Role) => {
  try {
    // 先设置当前角色的基本信息
    currentRole.value = { ...role }
    
    // 尝试获取角色的权限详情
    try {
      // 从RolePermissionView使用的composable中获取角色权限状态
      // 使用PermissionService的getRolePermissionStatus方法
      const rolePermissionStatusResponse = await PermissionService.getRolePermissionStatus(role.id)
      
      console.log('角色权限状态API响应:', rolePermissionStatusResponse) // 添加调试信息
      
      if (rolePermissionStatusResponse && typeof rolePermissionStatusResponse === 'object') {
        // 检查是否是标准的API响应格式
        if ('success' in rolePermissionStatusResponse && rolePermissionStatusResponse.success) {
          // 标准格式：包含success字段
          const permissionData = rolePermissionStatusResponse.data || {}
          
          // 根据API返回的数据结构，直接从permissionData中获取权限信息
          const permissions = permissionData.permissions || []
          
          // 也可以更新角色的其他属性，如用户数量、权限数量等
          currentRole.value = {
            ...role,
            permissions: permissions,
            userCount: permissionData.userCount || 0,
            permissionCount: permissionData.permissionCount || permissions.length,
            // 如果API返回了更详细的其他角色信息，也可以合并进来
            ...{
              isEnabled: permissionData.isEnabled !== undefined ? permissionData.isEnabled : role.isEnabled,
              description: permissionData.description || role.description,
              code: permissionData.code || role.code
            }
          }
        } else {
          // API调用失败，使用空权限数组
          console.warn('获取角色权限状态失败:', rolePermissionStatusResponse.message)
          currentRole.value = { ...role, permissions: [] }
        }
      } else {
        // 响应不是对象的情况
        currentRole.value = { ...role, permissions: [] }
      }
    } catch (apiError) {
      // 如果API调用失败，记录错误并使用空权限数组
      console.error('获取角色权限详情API调用失败:', apiError)
      currentRole.value = { ...role, permissions: [] }
    }
  } catch (error) {
    console.error('获取角色详情失败:', error)
    // 出错时至少设置基本角色信息
    currentRole.value = { ...role, permissions: [] }
  }
  
  activeDetailTab.value = 'basic'
  detailDialogVisible.value = true
}

const handleDetailDialogClose = () => {
  detailDialogVisible.value = false
  currentRole.value = null
  activeDetailTab.value = 'basic'
}

const handlePermissionSaved = async () => {
  // 权限保存成功后刷新角色列表
  await refreshData()
  ElMessage.success('权限更新成功')
}

const deleteRole = async (role: Role) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${role.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟删除操作
    const index = roleList.value.findIndex(item => item.id === role.id)
    if (index > -1) {
      roleList.value.splice(index, 1)
      pagination.total -= 1
      ElMessage.success('删除成功')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除角色失败:', error)
      ElMessage.error('删除失败: ' + (error?.message || '未知错误'))
    }
  }
}

const toggleStatus = async (role: Role) => {
  try {
    const action = role.isEnabled ? '启用' : '禁用'
    await ElMessageBox.confirm(
      `确定要${action}角色 "${role.name}" 吗？`,
      '状态变更确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用API更新角色状态
    const response = await RoleService.update(role.id, { 
      isEnabled: role.isEnabled 
    })
    
    if (response.success) {
      ElMessage.success(`${action}成功`)
      // 更新本地数据以保持一致性
      const index = roleList.value.findIndex(item => item.id === role.id)
      if (index > -1) {
        roleList.value[index].isEnabled = role.isEnabled
      }
    } else {
      // API调用失败，回滚状态
      role.isEnabled = !role.isEnabled
      ElMessage.error(response.message || `${action}失败`)
    }
    
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('状态变更失败:', error)
      ElMessage.error('状态变更失败: ' + (error?.message || '未知错误'))
      // 回滚状态
      role.isEnabled = !role.isEnabled
    } else {
      // 用户取消操作，回滚状态
      role.isEnabled = !role.isEnabled
    }
  }
}

const submitForm = async () => {
  if (!roleFormRef.value) return
  
  try {
    await roleFormRef.value.validate()
    submitLoading.value = true
    
    // 准备提交数据
    const submitData = {
      name: roleForm.name,
      code: roleForm.code,
      description: roleForm.description,
      isEnabled: roleForm.isEnabled,
      permissionIds: roleForm.permissionIds
    }
    
    let response
    if (roleForm.id) {
      // 编辑角色
      response = await RoleService.update(roleForm.id, submitData)
    } else {
      // 创建角色
      response = await RoleService.create(submitData)
    }
    
    if (response.success) {
      ElMessage.success(roleForm.id ? '角色更新成功' : '角色创建成功')
      
      // 更新本地数据
      if (roleForm.id) {
        // 更新现有角色
        const index = roleList.value.findIndex(item => item.id === roleForm.id)
        if (index > -1) {
          Object.assign(roleList.value[index], {
            ...roleForm,
            permissionCount: roleForm.permissionIds.length
          })
        }
      } else {
        // 添加新角色
        const newRole: Role = {
          ...roleForm,
          id: response.data?.id || Date.now().toString(),
          userCount: 0,
          permissionCount: roleForm.permissionIds.length,
          CreateTime: new Date().toISOString()
        }
        roleList.value.unshift(newRole)
        pagination.total += 1
      }
      
      // 关闭对话框并重置表单
      dialogVisible.value = false
      resetRoleForm()
    } else {
      ElMessage.error(response.message || (roleForm.id ? '角色更新失败' : '角色创建失败'))
    }
    
  } catch (error: any) {
    console.error('表单提交失败:', error)
    ElMessage.error('操作失败: ' + (error?.message || '未知错误'))
  } finally {
    submitLoading.value = false
  }
}

const cancelDialog = () => {
  dialogVisible.value = false
  resetRoleForm()
}

const handleDialogClose = () => {
  cancelDialog()
}

const resetRoleForm = () => {
  Object.assign(roleForm, {
    id: '',
    name: '',
    code: '',
    description: '',
    isEnabled: true,
    permissionIds: []
  })
  roleFormRef.value?.clearValidate()
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  refreshData()
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  refreshData()
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(async () => {
  await refreshData()
  await loadPermissionOptions() // 加载权限选项数据
})
</script>

<style scoped>
.role-management {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.role-detail {
  padding: 20px 0;
}

.detail-section {
  margin-top: 20px;
}

.detail-section h4 {
  margin-bottom: 15px;
  color: #303133;
}

.empty-text {
  color: #909399;
  font-style: italic;
  text-align: center;
  padding: 20px;
}
</style>