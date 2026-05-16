<template>
  <div class="user-management">
    <!-- 搜索和操作区域 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索用户名或邮箱"
            clearable
            @keyup.enter="searchUsers"
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
          <el-button type="primary" @click="searchUsers">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="success" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>新建用户
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 用户列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <div>
            <el-button type="primary" link @click="refreshData">
              <el-icon><Refresh /></el-icon>刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table
        :data="userList"
        v-loading="loading"
        stripe
        style="width: 100%"
        row-key="id"
      >
        <el-table-column prop="avatar" label="头像" width="80" align="center">
          <template #default="{ row }">
            <el-avatar :size="32" :src="row.avatar">
              {{ row.nickname?.charAt(0) }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="120"></el-table-column>
        <el-table-column prop="nickname" label="昵称" width="120"></el-table-column>
        <el-table-column prop="email" label="邮箱" show-overflow-tooltip></el-table-column>
        <el-table-column prop="phone" label="手机号" width="120"></el-table-column>
        <el-table-column prop="roles" label="角色" width="150">
          <template #default="{ row }">
            <el-tag
              v-for="role in row.roles"
              :key="role.id"
              style="margin: 2px;"
            >
              {{ role.name }}
            </el-tag>
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
        <el-table-column prop="lastLoginTime" label="最后登录" width="180" align="center">
          <template #default="{ row }">
            {{ row.lastLoginTime ? formatDate(row.lastLoginTime) : '从未登录' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetails(row)">查看</el-button>
            <el-button size="small" type="primary" @click="editUser(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteUser(row)">删除</el-button>
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

    <!-- 创建/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :before-close="handleDialogClose"
    >
      <el-form
        :model="userForm"
        :rules="formRules"
        ref="userFormRef"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="userForm.nickname" placeholder="请输入昵称"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!userForm.id">
          <el-input
            v-model="userForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword" v-if="!userForm.id">
          <el-input
            v-model="userForm.confirmPassword"
            type="password"
            placeholder="请确认密码"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item label="角色">
          <el-select
            v-model="userForm.roleIds"
            multiple
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            >
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="userForm.isEnabled"
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

    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="用户详情"
      width="600px"
    >
      <el-descriptions
        v-if="currentUserDetail"
        :column="1"
        border
      >
        <el-descriptions-item label="头像" width="100px">
          <el-avatar :size="60" :src="currentUserDetail.avatar">
            {{ currentUserDetail.nickname?.charAt(0) || currentUserDetail.username?.charAt(0) }}
          </el-avatar>
        </el-descriptions-item>
        <el-descriptions-item label="用户名">
          {{ currentUserDetail.username }}
        </el-descriptions-item>
        <el-descriptions-item label="昵称">
          {{ currentUserDetail.nickname }}
        </el-descriptions-item>
        <el-descriptions-item label="邮箱">
          {{ currentUserDetail.email }}
        </el-descriptions-item>
        <el-descriptions-item label="手机号">
          {{ currentUserDetail.phone }}
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag
            v-for="role in currentUserDetail.roles"
            :key="role.id"
            style="margin: 2px;"
            type="info"
          >
            {{ role.name }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentUserDetail.isEnabled ? 'success' : 'danger'">
            {{ currentUserDetail.isEnabled ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(currentUserDetail.CreateTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="最后登录时间">
          {{ currentUserDetail.lastLoginTime ? formatDate(currentUserDetail.lastLoginTime) : '从未登录' }}
        </el-descriptions-item>
      </el-descriptions>
      <div v-else class="loading-placeholder">加载中...</div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { ElMessage, ElMessageBox, ElDescriptions, ElDescriptionsItem } from 'element-plus'
import { Search, Plus, Refresh } from '@element-plus/icons-vue'
import { UserService, RoleService } from '../../api/permissionService'

// 基本响应类型定义
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
}

// 类型定义
interface User {
  id: string
  username: string
  email: string
  nickname: string
  avatar?: string
  phone?: string
  isEnabled: boolean
  lastLoginTime?: string
  CreateTime: string
  roles: Array<{id: string, name: string}>
}

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogTitle = ref('')
const rolesLoaded = ref(false) // 添加角色加载完成标志

const userList = ref<User[]>([])
const currentUserDetail = ref<User | null>(null)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: ''
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0  // 修正：使用total而不是totalCount
})

// 用户表单
const userForm = reactive({
  id: '',
  username: '',
  nickname: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  roleIds: [],
  isEnabled: true
})

// 角色选项
const roleOptions = ref<Array<{id: string, name: string}>>([])

// 表单引用
const userFormRef = ref()

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email' as const, message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { 
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== userForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ]
}

// 方法
const loadUsers = async () => {
  try {
    loading.value = true
    // 使用分页参数调用API
    const response = await UserService.getPagedList({
      pageIndex: pagination.currentPage,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined
    })
    
    if (response.success) {
      console.log('用户API原始响应:', response)
      
      // 处理返回的数据
      userList.value = (response.data || []).map((user: any) => {
        console.log('处理单个用户数据:', user)
        
        // 处理角色数据
        let roles = []
        if (Array.isArray(user.roles)) {
          roles = user.roles.map((role: any) => ({
            id: role.id || role.roleId || '',
            name: role.name || role.roleName || role.title || `角色-${role.id || role.roleId}`
          }))
        } else if (user.roles) {
          // 如果roles不是数组，尝试其他可能的结构
          roles = [{
            id: user.roles.id || user.roles.roleId || '',
            name: user.roles.name || user.roles.roleName || user.roles.title || `角色-${user.roles.id || user.roles.roleId}`
          }]
        }
        
        // 使用与editUser方法相同的字段映射逻辑
        const processedUser = {
          id: user.id,
          username: user.username || user.userName || '',
          nickname: user.nickname || user.nickName || '',
          email: user.email || '',
          phone: user.phone || '',
          avatar: user.avatar || '',
          isEnabled: user.isEnabled !== undefined ? user.isEnabled : true,
          lastLoginTime: user.lastLoginTime || user.lastLogin || '',
          CreateTime: user.CreateTime || user.createTime || new Date().toISOString(),
          roles: roles
        }
        
        console.log('处理后的用户数据:', processedUser)
        return processedUser
      })
      
      // 更新总数量
      pagination.total = response?.totalCount || 0
      console.log('最终用户列表:', userList.value)
    } else {
      ElMessage.error(response.message || '获取用户列表失败')
      userList.value = []
      pagination.total = 0
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
    userList.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const loadRoles = async () => {
  try {
    const response = await RoleService.getList()
    if (response.success) {
      roleOptions.value = (response.data || []).map((r: any) => ({
        id: r.id,
        name: r.name || r.roleName || r.title || `角色-${r.id}`
      }))
      rolesLoaded.value = true // 标记角色加载完成
      console.log('加载角色选项:', roleOptions.value)
    } else {
      console.warn('获取角色列表失败:', response.message)
      // 如果API失败，使用默认选项
      roleOptions.value = [
        { id: 'admin', name: '管理员' },
        { id: 'user', name: '普通用户' },
        { id: 'editor', name: '编辑者' }
      ]
      rolesLoaded.value = true
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
    // 出错时使用默认选项
    roleOptions.value = [
      { id: 'admin', name: '管理员' },
      { id: 'user', name: '普通用户' },
      { id: 'editor', name: '编辑者' }
    ]
    rolesLoaded.value = true
  }
}

const searchUsers = async () => {
  // 搜索就是重新加载数据，使用相同的逻辑
  await loadUsers()
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
  await loadUsers()
  ElMessage.success('数据刷新成功')
}

const showCreateDialog = async () => {
  dialogTitle.value = '创建用户'
  resetUserForm()
  await loadRoles()
  dialogVisible.value = true
}

const editUser = async (user: User) => {
  dialogTitle.value = '编辑用户'
  
  // 重置角色加载状态
  rolesLoaded.value = false
  
  // 先加载角色数据
  await loadRoles()
  
  // 确保正确填充所有字段，使用与loadUsers方法中相同的字段映射逻辑
  Object.assign(userForm, {
    id: user.id,
    username: user.username || (user as any).userName || '',  // 支持多种字段名
    nickname: user.nickname || (user as any).nickName || '',  // 支持多种字段名
    email: user.email || '',
    phone: user.phone || '',
    password: '',
    confirmPassword: '',
    roleIds: user.roles?.map(role => role.id) || [],
    isEnabled: user.isEnabled !== undefined ? user.isEnabled : true
  })
  
  // 添加调试信息
  console.log('编辑用户数据:', user)
  console.log('填充后的表单数据:', userForm)
  
  // 等待一小段时间确保DOM更新完成
  await new Promise(resolve => setTimeout(resolve, 100))
  
  dialogVisible.value = true
}

const viewDetails = async (user: User) => {
  try {
    detailDialogVisible.value = true;
    currentUserDetail.value = null; // 先清空之前的数据
    
    const response = await UserService.getById(user.id);
    if (response.success) {
      // 处理返回的用户数据，确保格式正确
      let roles = [];
      if (Array.isArray(response.data.roles)) {
        roles = response.data.roles.map((role: any) => ({
          id: role.id || role.roleId || '',
          name: role.name || role.roleName || role.title || `角色-${role.id || role.roleId}`
        }));
      } else if (response.data.roles) {
        roles = [{
          id: response.data.roles.id || response.data.roles.roleId || '',
          name: response.data.roles.name || response.data.roles.roleName || response.data.roles.title || `角色-${response.data.roles.id || response.data.roles.roleId}`
        }];
      }

      // 设置用户详细信息
      currentUserDetail.value = {
        id: response.data.id,
        username: response.data.username || response.data.userName || '',
        nickname: response.data.nickname || response.data.nickName || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        avatar: response.data.avatar || '',
        isEnabled: response.data.isEnabled !== undefined ? response.data.isEnabled : true,
        lastLoginTime: response.data.lastLoginTime || response.data.lastLogin || '',
        CreateTime: response.data.CreateTime || response.data.createTime || new Date().toISOString(),
        roles: roles
      };
    } else {
      ElMessage.error(response.message || '获取用户详情失败');
      detailDialogVisible.value = false;
    }
  } catch (error) {
    console.error('获取用户详情失败:', error);
    ElMessage.error('获取用户详情失败');
    detailDialogVisible.value = false;
  }
}

const deleteUser = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作不可恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await UserService.delete(user.id)
    
    if (response.success) {
      // 从列表中移除用户
      const index = userList.value.findIndex(item => item.id === user.id)
      if (index > -1) {
        userList.value.splice(index, 1)
        pagination.total -= 1
        
        // 如果当前页为空且不是第一页，回到上一页
        const totalPages = Math.ceil(pagination.total / pagination.pageSize)
        if (userList.value.length === 0 && pagination.currentPage > 1 && pagination.currentPage > totalPages) {
          pagination.currentPage = totalPages
        }
      }
      
      ElMessage.success('删除成功')
      
      // 确保删除操作完成后再刷新数据
      await new Promise(resolve => setTimeout(resolve, 50))
      await refreshData()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error)
      ElMessage.error('删除失败: ' + (error?.message || '未知错误'))
    }
  }
}

const toggleStatus = async (user: User) => {
  try {
    const action = user.isEnabled ? '启用' : '禁用'
    await ElMessageBox.confirm(
      `确定要${action}用户 "${user.username}" 吗？`,
      '状态变更确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 先更新本地状态以提供即时反馈
    const oldStatus = user.isEnabled
    const index = userList.value.findIndex(item => item.id === user.id)
    if (index > -1) {
      userList.value[index].isEnabled = user.isEnabled
    }
    
    const response = await UserService.update(user.id, { isEnabled: user.isEnabled })
    
    if (response.success) {
      ElMessage.success(`${action}成功`)
      // 状态更新成功后刷新数据确保一致性
      await new Promise(resolve => setTimeout(resolve, 50))
      await refreshData()
    } else {
      // API调用失败，恢复原状态
      user.isEnabled = oldStatus
      if (index > -1) {
        userList.value[index].isEnabled = oldStatus
      }
      ElMessage.error(response.message || `${action}失败`)
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      // 恢复原状态
      user.isEnabled = !user.isEnabled
      const index = userList.value.findIndex(item => item.id === user.id)
      if (index > -1) {
        userList.value[index].isEnabled = user.isEnabled
      }
      console.error('更新用户状态失败:', error)
      ElMessage.error('状态更新失败: ' + (error?.message || '未知错误'))
    } else {
      // 用户取消，恢复原状态
      user.isEnabled = !user.isEnabled
      const index = userList.value.findIndex(item => item.id === user.id)
      if (index > -1) {
        userList.value[index].isEnabled = user.isEnabled
      }
    }
  }
}

const submitForm = async () => {
  if (!userFormRef.value) return
  
  try {
    await userFormRef.value.validate()
    submitLoading.value = true
    
    let response: ApiResponse<any>
    
    if (userForm.id) {
      // 编辑
      const updateTimea: any = {
        username: userForm.username,
        nickname: userForm.nickname,
        email: userForm.email,
        phone: userForm.phone,
        isEnabled: userForm.isEnabled
      }
      
      // 只有在修改密码时才传递密码字段
      if (userForm.password) {
        updateTimea.password = userForm.password
      }
      
      response = await UserService.update(userForm.id, updateTimea)
    } else {
      // 创建
      const createTimea = {
        username: userForm.username,
        nickname: userForm.nickname,
        email: userForm.email,
        phone: userForm.phone,
        password: userForm.password,
        isEnabled: userForm.isEnabled
      }
      response = await UserService.create(createTimea)
    }
    
    if (response.success) {
      // 先处理角色分配（如果有）
      if (userForm.roleIds && userForm.roleIds.length > 0) {
        try {
          const userId = userForm.id || response.data?.id
          if (userId) {
            await UserService.assignRoles(userId, userForm.roleIds)
          }
        } catch (error) {
          console.error('角色分配失败:', error)
          // 角色分配失败不影响主要操作成功提示
        }
      }
      
      // 显示成功消息
      ElMessage.success(userForm.id ? '用户更新成功' : '用户创建成功')
      
      // 确保所有异步操作完成后再关闭对话框和刷新数据
      dialogVisible.value = false
      resetUserForm()
      
      // 延迟一小段时间确保UI更新完成后再刷新数据
      await new Promise(resolve => setTimeout(resolve, 100))
      await refreshData()
    } else {
      ElMessage.error(response.message || (userForm.id ? '用户更新失败' : '用户创建失败'))
    }
  } catch (error) {
    console.error('提交表单失败:', error)
    ElMessage.error('操作失败: ' + (error as Error).message)
  } finally {
    submitLoading.value = false
  }
}

const cancelDialog = () => {
  dialogVisible.value = false
  resetUserForm()
}

const handleDialogClose = () => {
  cancelDialog()
}

const resetUserForm = () => {
  Object.assign(userForm, {
    id: '',
    username: '',
    nickname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    roleIds: [],
    isEnabled: true
  })
  userFormRef.value?.clearValidate()
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  pagination.currentPage = 1  // 回到第一页
  loadUsers()
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  loadUsers()
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(async () => {
  await Promise.all([loadUsers(), loadRoles()])
})

// 添加计算属性用于调试
const selectedRoleNames = computed(() => {
  return userForm.roleIds.map(roleId => {
    const role = roleOptions.value.find(r => r.id === roleId)
    return role ? role.name : `未知角色(${roleId})`
  })
})

// 添加调试watch
watch(roleOptions, (newVal) => {
  console.log('角色选项更新:', newVal)
  console.log('当前选择的角色IDs:', userForm.roleIds)
  console.log('当前选择的角色名称:', selectedRoleNames.value)
}, { deep: true })

watch(() => userForm.roleIds, (newVal) => {
  console.log('用户表单角色IDs变化:', newVal)
  console.log('对应的角色名称:', selectedRoleNames.value)
}, { deep: true })

</script>

<style scoped>
.user-management {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.loading-placeholder {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>