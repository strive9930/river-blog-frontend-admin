<template>
  <div class="permission-assignment">
    <!-- 搜索和筛选区域 -->
    <el-card class="filter-card" shadow="never">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select 
            v-model="selectedTargetType" 
            placeholder="选择目标类型"
            @change="handleTargetTypeChange"
          >
            <el-option label="角色" value="role" />
            <el-option label="用户" value="user" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-select 
            v-model="selectedTargetId" 
            :placeholder="`选择${selectedTargetType === 'role' ? '角色' : '用户'}`"
            filterable
            remote
            :remote-method="searchTargets"
            :loading="targetLoading"
          >
            <el-option
              v-for="item in targetOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button 
            type="primary" 
            :disabled="!selectedTargetId"
            @click="loadAssignedPermissions"
          >
            加载已分配权限
          </el-button>
        </el-col>
        <el-col :span="4">
          <el-button @click="resetFilters">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 权限分配区域 -->
    <el-row :gutter="20" v-if="selectedTargetId">
      <!-- 左侧：可用权限列表 -->
      <el-col :span="12">
        <el-card class="permission-card">
          <template #header>
            <div class="card-header">
              <span>可用权限</span>
              <el-input
                v-model="searchKeyword"
                placeholder="搜索权限..."
                style="width: 200px"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </template>
          
          <!-- 权限分组展示 -->
          <div class="permission-groups">
            <el-collapse v-model="activeGroups" accordion>
              <el-collapse-item
                v-for="group in filteredPermissionGroups"
                :key="group.groupName"
                :name="group.groupName"
              >
                <template #title>
                  <div class="group-title">
                    <strong>{{ group.groupName }}</strong>
                    <el-tag size="small" type="info">
                      {{ group.permissions.length }} 项
                    </el-tag>
                  </div>
                </template>
                
                <div class="permission-list">
                  <el-checkbox-group v-model="selectedPermissionIds">
                    <div 
                      v-for="permission in group.permissions" 
                      :key="permission.id"
                      class="permission-item"
                    >
                      <el-checkbox 
                        :label="permission.id"
                        :disabled="isPermissionAssigned(permission.id)"
                      >
                        <div class="permission-content">
                          <div class="permission-name">{{ permission.name }}</div>
                          <div class="permission-code">{{ permission.code }}</div>
                          <div class="permission-desc">{{ permission.description }}</div>
                        </div>
                      </el-checkbox>
                    </div>
                  </el-checkbox-group>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
          
          <!-- 全选操作 -->
          <div class="bulk-actions" style="margin-top: 20px;">
            <el-button 
              type="primary" 
              @click="selectAllPermissions"
              :disabled="selectedPermissionIds.length === allAvailablePermissionIds.length"
            >
              全选当前页
            </el-button>
            <el-button @click="clearSelection">清空选择</el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：操作面板 -->
      <el-col :span="12">
        <el-card class="operation-card">
          <template #header>
            <span>权限操作</span>
          </template>
          
          <!-- 已选择的权限预览 -->
          <div class="selected-preview">
            <h4>已选择 {{ selectedPermissionIds.length }} 个权限</h4>
            <div class="selected-tags">
              <el-tag
                v-for="permId in selectedPermissionIds"
                :key="permId"
                closable
                @close="removeSelectedPermission(permId)"
                style="margin: 4px;"
              >
                {{ getPermissionName(permId) }}
              </el-tag>
              <div v-if="selectedPermissionIds.length === 0" class="empty-tip">
                请选择要分配的权限
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="operation-buttons">
            <el-button 
              type="success" 
              size="large"
              :disabled="selectedPermissionIds.length === 0"
              @click="assignPermissions"
              :loading="assigning"
              block
            >
              分配权限
            </el-button>
            
            <el-button 
              type="warning" 
              size="large"
              @click="clearAllPermissions"
              :loading="clearing"
              block
              style="margin-top: 10px;"
            >
              清空所有权限
            </el-button>
          </div>

          <!-- 已分配权限展示 -->
          <div class="assigned-permissions" style="margin-top: 30px;">
            <h4>已分配权限 ({{ assignedPermissions.length }} 项)</h4>
            <div class="assigned-tags">
              <el-tag
                v-for="permission in assignedPermissions"
                :key="permission.id"
                type="success"
                style="margin: 4px;"
              >
                {{ permission.name }}
              </el-tag>
              <div v-if="assignedPermissions.length === 0" class="empty-tip">
                暂无已分配权限
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 批量操作区域 -->
    <el-card class="batch-card" shadow="never" v-if="selectedTargetId">
      <template #header>
        <span>批量操作</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-button 
            type="primary" 
            @click="batchAssign"
            :disabled="selectedPermissionIds.length === 0"
            block
          >
            批量分配选中权限
          </el-button>
        </el-col>
        <el-col :span="8">
          <el-button 
            type="danger" 
            @click="batchRemove"
            :disabled="assignedPermissions.length === 0"
            block
          >
            批量移除已分配权限
          </el-button>
        </el-col>
        <el-col :span="8">
          <el-button 
            @click="exportPermissions"
            block
          >
            导出权限配置
          </el-button>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { permissionApi } from '@/api/permission'

// 类型定义
interface Permission {
  id: string
  name: string
  code: string
  description: string
  group: string
}

interface TargetOption {
  id: string
  name: string
}

interface PermissionGroup {
  groupName: string
  permissions: Permission[]
}

// 响应式数据
const selectedTargetType = ref<'role' | 'user'>('role')
const selectedTargetId = ref<string>('')
const targetOptions = ref<TargetOption[]>([])
const targetLoading = ref(false)
const searchKeyword = ref('')
const activeGroups = ref<string[]>([])
const selectedPermissionIds = ref<string[]>([])
const assignedPermissions = ref<Permission[]>([])
const assigning = ref(false)
const clearing = ref(false)

// 计算属性
const allPermissions = ref<Permission[]>([])
const allAvailablePermissionIds = computed(() => 
  allPermissions.value.map(p => p.id)
)

const filteredPermissionGroups = computed<PermissionGroup[]>(() => {
  if (!searchKeyword.value) {
    return groupPermissions(allPermissions.value)
  }
  
  const filtered = allPermissions.value.filter(perm => 
    perm.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    perm.code.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    perm.description.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
  
  return groupPermissions(filtered)
})

// 方法
const groupPermissions = (permissions: Permission[]): PermissionGroup[] => {
  const groups: Record<string, Permission[]> = {}
  
  permissions.forEach(perm => {
    if (!groups[perm.group]) {
      groups[perm.group] = []
    }
    groups[perm.group].push(perm)
  })
  
  return Object.entries(groups).map(([groupName, perms]) => ({
    groupName,
    permissions: perms.sort((a, b) => a.name.localeCompare(b.name))
  }))
}

const isPermissionAssigned = (permissionId: string): boolean => {
  return assignedPermissions.value.some(p => p.id === permissionId)
}

const getPermissionName = (permissionId: string): string => {
  const permission = allPermissions.value.find(p => p.id === permissionId)
  return permission ? permission.name : permissionId
}

const selectAllPermissions = () => {
  const currentGroupPermissions = filteredPermissionGroups.value
    .flatMap(group => group.permissions)
    .filter(perm => !isPermissionAssigned(perm.id))
    .map(perm => perm.id)
  
  selectedPermissionIds.value = [...new Set([
    ...selectedPermissionIds.value,
    ...currentGroupPermissions
  ])]
}

const clearSelection = () => {
  selectedPermissionIds.value = []
}

const removeSelectedPermission = (permissionId: string) => {
  selectedPermissionIds.value = selectedPermissionIds.value.filter(id => id !== permissionId)
}

const handleTargetTypeChange = () => {
  selectedTargetId.value = ''
  targetOptions.value = []
  assignedPermissions.value = []
  selectedPermissionIds.value = []
}

const searchTargets = async (query: string) => {
  if (!query) return
  
  targetLoading.value = true
  try {
    // 这里应该调用实际的API来搜索角色或用户
    // 暂时使用模拟数据
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (selectedTargetType.value === 'role') {
      targetOptions.value = [
        { id: '1', name: '超级管理员' },
        { id: '2', name: '普通用户' },
        { id: '3', name: '内容编辑' }
      ].filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
    } else {
      targetOptions.value = [
        { id: '1', name: '张三' },
        { id: '2', name: '李四' },
        { id: '3', name: '王五' }
      ].filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
    }
  } catch (error) {
    ElMessage.error('搜索失败')
  } finally {
    targetLoading.value = false
  }
}

const loadAssignedPermissions = async () => {
  if (!selectedTargetId.value) return
  
  try {
    const response = await permissionApi.getAssignedPermissions(
      selectedTargetId.value,
      selectedTargetType.value
    )
    
    if (response.success) {
      assignedPermissions.value = response.data
      ElMessage.success('权限加载成功')
    } else {
      ElMessage.error(response.message || '加载权限失败')
    }
  } catch (error) {
    ElMessage.error('加载权限失败')
  }
}

const assignPermissions = async () => {
  if (selectedPermissionIds.value.length === 0) {
    ElMessage.warning('请先选择要分配的权限')
    return
  }
  
  try {
    assigning.value = true
    
    const response = await permissionApi.assignPermissions({
      targetId: selectedTargetId.value,
      targetType: selectedTargetType.value,
      permissionIds: selectedPermissionIds.value
    })
    
    if (response.success) {
      ElMessage.success('权限分配成功')
      await loadAssignedPermissions()
      selectedPermissionIds.value = []
    } else {
      ElMessage.error(response.message || '权限分配失败')
    }
  } catch (error) {
    ElMessage.error('权限分配失败')
  } finally {
    assigning.value = false
  }
}

const clearAllPermissions = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有已分配权限吗？此操作不可撤销。',
      '确认清空',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    )
    
    clearing.value = true
    
    const response = await permissionAssignmentApi.clearPermissions(
      selectedTargetId.value,
      selectedTargetType.value
    )
    
    if (response.success) {
      ElMessage.success('权限清空成功')
      assignedPermissions.value = []
    } else {
      ElMessage.error(response.message || '权限清空失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('权限清空失败')
    }
  } finally {
    clearing.value = false
  }
}

const batchAssign = async () => {
  // 批量分配逻辑
  ElMessage.info('批量分配功能待实现')
}

const batchRemove = async () => {
  // 批量移除逻辑
  ElMessage.info('批量移除功能待实现')
}

const exportPermissions = () => {
  // 导出权限配置
  ElMessage.info('导出功能待实现')
}

const resetFilters = () => {
  selectedTargetType.value = 'role'
  selectedTargetId.value = ''
  targetOptions.value = []
  assignedPermissions.value = []
  selectedPermissionIds.value = []
  searchKeyword.value = ''
}

// 生命周期
onMounted(async () => {
  try {
    // 加载所有权限
    const response = await permissionApi.getList()
    if (response.success) {
      allPermissions.value = response.data
    }
  } catch (error) {
    ElMessage.error('加载权限列表失败')
  }
})

// 监听器
watch(selectedTargetId, (newVal) => {
  if (newVal) {
    loadAssignedPermissions()
  } else {
    assignedPermissions.value = []
    selectedPermissionIds.value = []
  }
})
</script>

<style scoped>
.permission-assignment {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.permission-groups {
  max-height: 500px;
  overflow-y: auto;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.permission-list {
  padding: 10px 0;
}

.permission-item {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.permission-item:last-child {
  border-bottom: none;
}

.permission-content {
  margin-left: 10px;
}

.permission-name {
  font-weight: 500;
  color: #303133;
}

.permission-code {
  font-size: 12px;
  color: #909399;
  margin: 2px 0;
}

.permission-desc {
  font-size: 12px;
  color: #606266;
}

.selected-preview,
.assigned-permissions {
  margin-bottom: 20px;
}

.selected-tags,
.assigned-tags {
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  min-height: 60px;
}

.empty-tip {
  color: #909399;
  text-align: center;
  padding: 20px;
}

.operation-buttons {
  margin: 20px 0;
}

.bulk-actions {
  display: flex;
  gap: 10px;
}

.batch-card {
  margin-top: 20px;
}
</style>