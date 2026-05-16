<template>
  <div class="batch-permission-assignment">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>批量权限分配</span>
          <el-button type="primary" @click="showAssignmentDialog">
            <el-icon><Plus /></el-icon>
            批量分配权限
          </el-button>
        </div>
      </template>

      <!-- 分配统计 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-statistic title="总角色数" :value="roleStats.totalRoles" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="已分配角色" :value="roleStats.assignedRoles" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="今日分配" :value="roleStats.todayAssignments" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="平均权限数" :value="roleStats.avgPermissions" :precision="1" />
        </el-col>
      </el-row>

      <!-- 角色权限分配表格 -->
      <el-table 
        :data="rolesWithPermissions" 
        style="width: 100%"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="roleName" label="角色名称" width="150">
          <template #default="scope">
            <el-tag :type="getRoleTagType(scope.row.roleName)">
              {{ scope.row.roleName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="roleCode" label="角色编码" width="150" />
        <el-table-column prop="permissionCount" label="权限数量" width="120">
          <template #default="scope">
            <el-badge :value="scope.row.permissionCount" :max="99" type="primary" />
          </template>
        </el-table-column>
        <el-table-column prop="permissions" label="已分配权限" min-width="300">
          <template #default="scope">
            <div class="permission-tags">
              <el-tag 
                v-for="perm in scope.row.permissions.slice(0, 3)" 
                :key="perm.id"
                size="small"
                style="margin-right: 5px; margin-bottom: 5px;"
              >
                {{ perm.name }}
              </el-tag>
              <el-tag 
                v-if="scope.row.permissions.length > 3"
                size="small"
                type="info"
              >
                +{{ scope.row.permissions.length - 3 }} 更多
              </el-tag>
              <span v-if="scope.row.permissions.length === 0" class="no-permissions">
                暂无权限
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="lastModified" label="最后更新" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button 
              size="small" 
              type="primary" 
              @click="handleAssignPermissions(scope.row)"
            >
              分配权限
            </el-button>
            <el-button 
              size="small" 
              type="warning" 
              @click="handleViewDetails(scope.row)"
            >
              查看详情
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleClearPermissions(scope.row)"
            >
              清空权限
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作按钮 -->
      <div class="batch-actions" style="margin-top: 20px;">
        <el-button 
          type="primary" 
          :disabled="selectedRoles.length === 0"
          @click="handleBatchAssign"
        >
          批量分配权限
        </el-button>
        <el-button 
          type="warning" 
          :disabled="selectedRoles.length === 0"
          @click="handleBatchRemove"
        >
          批量移除权限
        </el-button>
        <el-button 
          type="danger" 
          :disabled="selectedRoles.length === 0"
          @click="handleBatchClear"
        >
          批量清空权限
        </el-button>
      </div>
    </el-card>

    <!-- 权限分配对话框 -->
    <el-dialog
      v-model="assignmentDialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="resetAssignmentForm"
    >
      <div class="assignment-dialog">
        <!-- 角色信息 -->
        <el-card class="role-info-card" shadow="never">
          <template #header>
            <strong>目标角色</strong>
          </template>
          <div v-if="currentRole">
            <p><strong>角色名称：</strong>{{ currentRole.roleName }}</p>
            <p><strong>角色编码：</strong>{{ currentRole.roleCode }}</p>
            <p><strong>当前权限数：</strong>{{ currentRole.permissionCount }}</p>
          </div>
        </el-card>

        <!-- 权限选择区域 -->
        <el-tabs v-model="activeTab" style="margin-top: 20px;">
          <!-- 按分组选择 -->
          <el-tab-pane label="按分组选择" name="group">
            <div class="permission-selection">
              <el-checkbox 
                v-model="selectAllGroups" 
                @change="handleSelectAllGroups"
                style="margin-bottom: 15px;"
              >
                全选所有分组
              </el-checkbox>
              
              <el-collapse v-model="expandedGroups">
                <el-collapse-item
                  v-for="group in permissionGroups"
                  :key="group.groupName"
                  :name="group.groupName"
                >
                  <template #title>
                    <el-checkbox
                      v-model="selectedGroupKeys[group.groupName]"
                      @change="(val) => handleGroupSelect(group.groupName, val)"
                      :indeterminate="isGroupPartiallySelected(group.groupName)"
                    >
                      {{ group.groupName || '未分组' }} ({{ group.permissions.length }}个权限)
                    </el-checkbox>
                  </template>
                  
                  <div class="group-permissions">
                    <el-checkbox-group v-model="selectedPermissionIds">
                      <el-checkbox
                        v-for="permission in group.permissions"
                        :key="permission.id"
                        :label="permission.id"
                        class="permission-checkbox"
                      >
                        <div class="permission-item">
                          <div class="permission-name">{{ permission.name }}</div>
                          <div class="permission-code">{{ permission.code }}</div>
                          <div class="permission-desc">{{ permission.description }}</div>
                        </div>
                      </el-checkbox>
                    </el-checkbox-group>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </el-tab-pane>

          <!-- 搜索选择 -->
          <el-tab-pane label="搜索选择" name="search">
            <div class="search-selection">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索权限名称、编码或描述..."
                clearable
                style="margin-bottom: 15px;"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              
              <div class="search-results">
                <el-checkbox-group v-model="selectedPermissionIds">
                  <el-checkbox
                    v-for="permission in filteredPermissions"
                    :key="permission.id"
                    :label="permission.id"
                    class="permission-checkbox"
                  >
                    <div class="permission-item">
                      <div class="permission-name">{{ permission.name }}</div>
                      <div class="permission-code">{{ permission.code }}</div>
                      <div class="permission-desc">{{ permission.description }}</div>
                      <div class="permission-group">
                        <el-tag size="small" type="info">
                          {{ permission.group || '未分组' }}
                        </el-tag>
                      </div>
                    </div>
                  </el-checkbox>
                </el-checkbox-group>
                
                <div v-if="filteredPermissions.length === 0" class="no-results">
                  <el-empty description="未找到匹配的权限" :image-size="80" />
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <div class="selection-summary">
            已选择 {{ selectedPermissionIds.length }} 个权限
          </div>
          <div>
            <el-button @click="assignmentDialogVisible = false">取消</el-button>
            <el-button 
              type="primary" 
              @click="submitAssignment"
              :loading="submitting"
            >
              确定分配
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 权限详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`${currentRole?.roleName} - 权限详情`"
      width="700px"
    >
      <div v-if="currentRole" class="role-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="角色名称">
            {{ currentRole.roleName }}
          </el-descriptions-item>
          <el-descriptions-item label="角色编码">
            {{ currentRole.roleCode }}
          </el-descriptions-item>
          <el-descriptions-item label="权限总数">
            {{ currentRole.permissionCount }}
          </el-descriptions-item>
          <el-descriptions-item label="最后更新">
            {{ currentRole.lastModified }}
          </el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 20px;">
          <h4>已分配权限列表</h4>
          <el-table :data="currentRole.permissions" max-height="300">
            <el-table-column prop="name" label="权限名称" />
            <el-table-column prop="code" label="权限编码" />
            <el-table-column prop="group" label="分组" />
            <el-table-column prop="createTime" label="分配时间" width="180" />
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'

interface Role {
  id: number
  roleName: string
  roleCode: string
  permissionCount: number
  permissions: Permission[]
  lastModified: string
}

interface Permission {
  id: number
  name: string
  code: string
  description: string
  group: string
  createTime: string
}

interface PermissionGroup {
  groupName: string
  permissions: Permission[]
}

interface RoleStats {
  totalRoles: number
  assignedRoles: number
  todayAssignments: number
  avgPermissions: number
}

const loading = ref(false)
const submitting = ref(false)
const assignmentDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const activeTab = ref('group')
const expandedGroups = ref<string[]>([])
const selectAllGroups = ref(false)
const searchKeyword = ref('')
const selectedRoles = ref<Role[]>([])
const currentRole = ref<Role | null>(null)
const dialogTitle = ref('')

// 选择状态
const selectedPermissionIds = ref<number[]>([])
const selectedGroupKeys = ref<Record<string, boolean>>({})

// 模拟数据
const rolesWithPermissions = ref<Role[]>([
  {
    id: 1,
    roleName: '超级管理员',
    roleCode: 'admin',
    permissionCount: 15,
    permissions: [
      { id: 1, name: '用户管理', code: 'user.manage', description: '', group: '用户管理', createTime: '2024-01-01' },
      { id: 2, name: '角色管理', code: 'role.manage', description: '', group: '系统管理', createTime: '2024-01-01' }
    ],
    lastModified: '2024-01-15 10:30:00'
  },
  {
    id: 2,
    roleName: '普通用户',
    roleCode: 'user',
    permissionCount: 3,
    permissions: [
      { id: 10, name: '查看个人信息', code: 'profile.view', description: '', group: '个人中心', createTime: '2024-01-01' }
    ],
    lastModified: '2024-01-10 14:20:00'
  }
])

const permissionGroups = ref<PermissionGroup[]>([
  {
    groupName: '用户管理',
    permissions: [
      { id: 1, name: '查看用户列表', code: 'user.view', description: '查看所有用户信息', group: '用户管理', createTime: '2024-01-01' },
      { id: 2, name: '创建用户', code: 'user.create', description: '创建新用户', group: '用户管理', createTime: '2024-01-01' },
      { id: 3, name: '编辑用户', code: 'user.edit', description: '编辑用户信息', group: '用户管理', createTime: '2024-01-01' }
    ]
  },
  {
    groupName: '系统管理',
    permissions: [
      { id: 4, name: '系统配置', code: 'system.config', description: '管理系统配置', group: '系统管理', createTime: '2024-01-01' },
      { id: 5, name: '日志查看', code: 'log.view', description: '查看系统日志', group: '系统管理', createTime: '2024-01-01' }
    ]
  }
])

const roleStats = ref<RoleStats>({
  totalRoles: 5,
  assignedRoles: 3,
  todayAssignments: 2,
  avgPermissions: 6.5
})

// 计算属性
const filteredPermissions = computed(() => {
  if (!searchKeyword.value) {
    return permissionGroups.value.flatMap(g => g.permissions)
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return permissionGroups.value.flatMap(g => 
    g.permissions.filter(p => 
      p.name.toLowerCase().includes(keyword) ||
      p.code.toLowerCase().includes(keyword) ||
      p.description.toLowerCase().includes(keyword)
    )
  )
})

// 方法
const handleSelectionChange = (selection: Role[]) => {
  selectedRoles.value = selection
}

const getRoleTagType = (roleName: string) => {
  if (roleName.includes('管理员')) return 'danger'
  if (roleName.includes('用户')) return 'primary'
  return 'info'
}

const showAssignmentDialog = () => {
  currentRole.value = null
  dialogTitle.value = '批量权限分配'
  assignmentDialogVisible.value = true
}

const handleAssignPermissions = (role: Role) => {
  currentRole.value = role
  dialogTitle.value = `为 ${role.roleName} 分配权限`
  assignmentDialogVisible.value = true
}

const handleViewDetails = (role: Role) => {
  currentRole.value = role
  detailDialogVisible.value = true
}

const handleClearPermissions = async (role: Role) => {
  try {
    await ElMessageBox.confirm(
      `确定要清空角色 "${role.roleName}" 的所有权限吗？此操作不可恢复！`,
      '清空权限确认',
      { type: 'warning' }
    )
    
    // 调用API清空权限
    // await rolePermissionApi.clearRolePermissions(role.id)
    
    ElMessage.success('权限清空成功')
    loadRoleData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handleBatchAssign = () => {
  if (selectedRoles.value.length === 0) return
  dialogTitle.value = `为 ${selectedRoles.value.length} 个角色批量分配权限`
  assignmentDialogVisible.value = true
}

const handleBatchRemove = async () => {
  if (selectedRoles.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要从选中的 ${selectedRoles.value.length} 个角色中批量移除权限吗？`,
      '批量移除确认',
      { type: 'warning' }
    )
    
    // 调用API批量移除权限
    // await rolePermissionApi.batchRemovePermissions(selectedRoleIds, permissionIds)
    
    ElMessage.success('批量移除成功')
    loadRoleData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handleBatchClear = async () => {
  if (selectedRoles.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要清空选中的 ${selectedRoles.value.length} 个角色的所有权限吗？此操作不可恢复！`,
      '批量清空确认',
      { type: 'error' }
    )
    
    // 调用API批量清空权限
    // await rolePermissionApi.batchClearPermissions(selectedRoleIds)
    
    ElMessage.success('批量清空成功')
    loadRoleData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handleSelectAllGroups = (checked: boolean) => {
  if (checked) {
    permissionGroups.value.forEach(group => {
      selectedGroupKeys.value[group.groupName] = true
      selectedPermissionIds.value = [
        ...new Set([
          ...selectedPermissionIds.value,
          ...group.permissions.map(p => p.id)
        ])
      ]
    })
  } else {
    permissionGroups.value.forEach(group => {
      selectedGroupKeys.value[group.groupName] = false
    })
    selectedPermissionIds.value = []
  }
}

const handleGroupSelect = (groupName: string, checked: boolean) => {
  const group = permissionGroups.value.find(g => g.groupName === groupName)
  if (!group) return
  
  if (checked) {
    selectedPermissionIds.value = [
      ...new Set([
        ...selectedPermissionIds.value,
        ...group.permissions.map(p => p.id)
      ])
    ]
  } else {
    selectedPermissionIds.value = selectedPermissionIds.value.filter(
      id => !group.permissions.some(p => p.id === id)
    )
  }
  
  updateSelectAllState()
}

const isGroupPartiallySelected = (groupName: string) => {
  const group = permissionGroups.value.find(g => g.groupName === groupName)
  if (!group) return false
  
  const selectedCount = group.permissions.filter(p => 
    selectedPermissionIds.value.includes(p.id)
  ).length
  
  return selectedCount > 0 && selectedCount < group.permissions.length
}

const updateSelectAllState = () => {
  const totalPermissions = permissionGroups.value.reduce(
    (sum, group) => sum + group.permissions.length, 0
  )
  selectAllGroups.value = selectedPermissionIds.value.length === totalPermissions
}

const submitAssignment = async () => {
  if (selectedPermissionIds.value.length === 0) {
    ElMessage.warning('请至少选择一个权限')
    return
  }
  
  try {
    submitting.value = true
    
    const targetRoles = currentRole.value ? [currentRole.value] : selectedRoles.value
    const roleIds = targetRoles.map(r => r.id)
    
    // 调用API分配权限
    // await rolePermissionApi.batchAssignPermissions({
    //   roleIds,
    //   permissionIds: selectedPermissionIds.value,
    //   operationType: 'add' // add/remove
    // })
    
    ElMessage.success('权限分配成功')
    assignmentDialogVisible.value = false
    loadRoleData()
  } catch (error) {
    ElMessage.error('权限分配失败')
  } finally {
    submitting.value = false
  }
}

const resetAssignmentForm = () => {
  selectedPermissionIds.value = []
  selectedGroupKeys.value = {}
  selectAllGroups.value = false
  searchKeyword.value = ''
  expandedGroups.value = []
  activeTab.value = 'group'
}

const loadRoleData = async () => {
  loading.value = true
  try {
    // 调用API获取角色权限数据
    // const response = await rolePermissionApi.getRolesWithPermissions()
    // rolesWithPermissions.value = response.data
  } catch (error) {
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(() => {
  loadRoleData()
})
</script>

<style scoped>
.batch-permission-assignment {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.permission-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.no-permissions {
  color: #909399;
  font-style: italic;
}

.batch-actions {
  display: flex;
  gap: 10px;
}

.assignment-dialog {
  max-height: 60vh;
  overflow-y: auto;
}

.role-info-card {
  background-color: #f5f7fa;
}

.permission-selection,
.search-selection {
  max-height: 400px;
  overflow-y: auto;
}

.group-permissions {
  padding: 10px 0;
}

.permission-checkbox {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
  width: 100%;
}

.permission-item {
  margin-left: 10px;
  flex: 1;
}

.permission-name {
  font-weight: bold;
  margin-bottom: 2px;
}

.permission-code {
  font-family: monospace;
  font-size: 12px;
  color: #606266;
  margin-bottom: 2px;
}

.permission-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.permission-group {
  display: inline-block;
}

.search-results {
  max-height: 350px;
  overflow-y: auto;
}

.no-results {
  text-align: center;
  padding: 30px 0;
}

.selection-summary {
  flex: 1;
  color: #606266;
  font-weight: bold;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.role-detail :deep(.el-descriptions__body) {
  background-color: #f5f7fa;
}
</style>