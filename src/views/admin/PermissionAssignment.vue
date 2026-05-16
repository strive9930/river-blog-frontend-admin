<template>
  <div class="permission-assignment">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>权限分配管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="showAssignmentDialog(null)">
              <el-icon><Plus /></el-icon>
              新增分配
            </el-button>
            <el-button @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 分配记录列表 -->
      <el-table 
        :data="assignments" 
        style="width: 100%"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="targetName" label="目标名称" width="150">
          <template #default="scope">
            <el-tag :type="getTargetTypeTag(scope.row.targetType)">
              {{ scope.row.targetName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetType" label="目标类型" width="100">
          <template #default="scope">
            <el-tag :type="getTargetTypeTag(scope.row.targetType)" effect="plain">
              {{ targetTypeMap[scope.row.targetType] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="permissionCount" label="权限数量" width="100">
          <template #default="scope">
            <el-badge :value="scope.row.permissionCount" :max="99" type="primary" />
          </template>
        </el-table-column>
        <el-table-column prop="permissions" label="分配权限" min-width="300">
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
                无权限分配
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="assignTime" label="分配时间" width="180" />
        <el-table-column prop="assignedBy" label="分配人" width="120" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="showAssignmentDialog(scope.row)">
              分配权限
            </el-button>
            <el-button size="small" @click="viewDetails(scope.row)">
              查看详情
            </el-button>
            <el-popconfirm
              title="确定要清空该目标的所有权限吗？"
              @confirm="clearPermissions(scope.row)"
            >
              <template #reference>
                <el-button size="small" type="danger">
                  清空权限
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作 -->
      <div class="batch-actions" style="margin-top: 20px;">
        <el-button 
          type="danger" 
          :disabled="selectedAssignments.length === 0"
          @click="handleBatchClear"
        >
          批量清空权限
        </el-button>
        <el-button 
          type="primary" 
          :disabled="selectedAssignments.length === 0"
          @click="handleBatchAssign"
        >
          批量分配权限
        </el-button>
        <span style="margin-left: 15px; color: #909399;">
          已选择 {{ selectedAssignments.length }} 项
        </span>
      </div>
    </el-card>

    <!-- 权限分配对话框 -->
    <el-dialog
      v-model="assignmentDialogVisible"
      :title="dialogTitle"
      width="800px"
      class="assignment-dialog"
    >
      <el-form :model="assignmentForm" label-width="100px">
        <el-form-item label="分配目标">
          <el-select 
            v-model="assignmentForm.targetId" 
            placeholder="请选择分配目标"
            style="width: 100%;"
            filterable
            remote
            :remote-method="searchTargets"
            :loading="targetLoading"
          >
            <el-option
              v-for="target in availableTargets"
              :key="target.id"
              :label="`${target.name} (${targetTypeMap[target.type]})`"
              :value="target.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="权限选择">
          <el-tabs v-model="permissionTab" type="border-card">
            <el-tab-pane label="按分组选择" name="group">
              <div class="group-selection">
                <el-checkbox-group v-model="selectedPermissionIds">
                  <div 
                    v-for="group in permissionGroups" 
                    :key="group.name"
                    class="group-permissions"
                  >
                    <div class="group-header">
                      <el-checkbox 
                        :label="group.name" 
                        :indeterminate="isGroupPartiallySelected(group)"
                        @change="handleGroupSelect(group, $event)"
                      >
                        <strong>{{ group.name }}</strong> ({{ group.permissions.length }}个权限)
                      </el-checkbox>
                    </div>
                    <div class="group-items">
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
                    </div>
                  </div>
                </el-checkbox-group>
              </div>
            </el-tab-pane>
            
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
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="assignmentDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAssignment" :loading="submitLoading">
            确认分配
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="权限分配详情"
      width="600px"
    >
      <div v-if="currentAssignment">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="目标名称">
            {{ currentAssignment.targetName }}
          </el-descriptions-item>
          <el-descriptions-item label="目标类型">
            <el-tag :type="getTargetTypeTag(currentAssignment.targetType)">
              {{ targetTypeMap[currentAssignment.targetType] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="权限数量">
            <el-badge :value="currentAssignment.permissionCount" type="primary" />
          </el-descriptions-item>
          <el-descriptions-item label="分配时间">
            {{ currentAssignment.assignTime }}
          </el-descriptions-item>
          <el-descriptions-item label="分配人">
            {{ currentAssignment.assignedBy }}
          </el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 20px;">
          <h4>已分配权限列表：</h4>
          <el-table :data="currentAssignment.permissions" max-height="300">
            <el-table-column prop="name" label="权限名称" />
            <el-table-column prop="code" label="权限编码">
              <template #default="scope">
                <el-tag type="info">{{ scope.row.code }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="group" label="分组">
              <template #default="scope">
                <el-tag effect="plain">{{ scope.row.group || '未分组' }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { permissionAssignmentApi } from '@/api/permission'
import type { PermissionAssignment, AssignmentTarget, Permission } from '@/types/permission'

// 数据状态
const loading = ref(false)
const targetLoading = ref(false)
const submitLoading = ref(false)
const assignments = ref<PermissionAssignment[]>([])
const selectedAssignments = ref<PermissionAssignment[]>([])
const availableTargets = ref<AssignmentTarget[]>([])
const allPermissions = ref<Permission[]>([])
const permissionGroups = ref<any[]>([])

// 对话框状态
const assignmentDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentAssignment = ref<PermissionAssignment | null>(null)
const dialogTitle = ref('权限分配')

// 表单数据
const assignmentForm = ref({
  targetId: '',
  targetType: 'role' // 默认为角色
})

// 权限选择相关
const permissionTab = ref('group')
const selectedPermissionIds = ref<string[]>([])
const searchKeyword = ref('')

// 类型映射
const targetTypeMap = {
  'user': '用户',
  'role': '角色',
  'department': '部门'
}

// 计算属性
const filteredPermissions = computed(() => {
  if (!searchKeyword.value) return allPermissions.value
  const keyword = searchKeyword.value.toLowerCase()
  return allPermissions.value.filter(perm => 
    perm.name.toLowerCase().includes(keyword) ||
    perm.code.toLowerCase().includes(keyword) ||
    (perm.description && perm.description.toLowerCase().includes(keyword))
  )
})

// 方法
const handleSelectionChange = (selection: PermissionAssignment[]) => {
  selectedAssignments.value = selection
}

const getTargetTypeTag = (type: string) => {
  const tagMap: Record<string, string> = {
    'user': 'success',
    'role': 'danger',
    'department': 'warning'
  }
  return tagMap[type] || 'info'
}

const refreshData = async () => {
  await loadData()
}

const loadData = async () => {
  loading.value = true
  try {
    const response = await permissionAssignmentApi.getList()
    assignments.value = response.data
  } catch (error) {
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

const searchTargets = async (query: string) => {
  if (!query) return
  targetLoading.value = true
  try {
    const response = await permissionAssignmentApi.searchTargets(query)
    availableTargets.value = response.data
  } catch (error) {
    ElMessage.error('搜索目标失败')
  } finally {
    targetLoading.value = false
  }
}

const showAssignmentDialog = async (assignment: PermissionAssignment | null) => {
  currentAssignment.value = assignment
  dialogTitle.value = assignment ? `编辑权限分配 - ${assignment.targetName}` : '新增权限分配'
  
  if (!assignment) {
    assignmentForm.value = {
      targetId: '',
      targetType: 'role'
    }
    selectedPermissionIds.value = []
  } else {
    assignmentForm.value = {
      targetId: assignment.targetId,
      targetType: assignment.targetType
    }
    selectedPermissionIds.value = assignment.permissions.map(p => p.id)
  }
  
  await loadPermissions()
  assignmentDialogVisible.value = true
}

const loadPermissions = async () => {
  try {
    const response = await permissionAssignmentApi.getPermissions()
    allPermissions.value = response.data
    
    // 按分组组织权限
    const groups: Record<string, Permission[]> = {}
    allPermissions.value.forEach(perm => {
      const groupName = perm.group || '未分组'
      if (!groups[groupName]) {
        groups[groupName] = []
      }
      groups[groupName].push(perm)
    })
    
    permissionGroups.value = Object.entries(groups).map(([name, permissions]) => ({
      name,
      permissions
    }))
  } catch (error) {
    ElMessage.error('权限数据加载失败')
  }
}

const isGroupPartiallySelected = (group: any) => {
  const selectedInGroup = group.permissions.filter((perm: Permission) => 
    selectedPermissionIds.value.includes(perm.id)
  ).length
  return selectedInGroup > 0 && selectedInGroup < group.permissions.length
}

const handleGroupSelect = (group: any, checked: boolean) => {
  if (checked) {
    // 全选该组
    group.permissions.forEach((perm: Permission) => {
      if (!selectedPermissionIds.value.includes(perm.id)) {
        selectedPermissionIds.value.push(perm.id)
      }
    })
  } else {
    // 取消全选该组
    selectedPermissionIds.value = selectedPermissionIds.value.filter(id => 
      !group.permissions.some((perm: Permission) => perm.id === id)
    )
  }
}

const submitAssignment = async () => {
  if (!assignmentForm.value.targetId) {
    ElMessage.warning('请选择分配目标')
    return
  }

  if (selectedPermissionIds.value.length === 0) {
    ElMessage.warning('请至少选择一个权限')
    return
  }

  submitLoading.value = true
  try {
    await permissionAssignmentApi.assignPermissions({
      targetId: assignmentForm.value.targetId,
      targetType: assignmentForm.value.targetType,
      permissionIds: selectedPermissionIds.value
    })
    
    ElMessage.success('权限分配成功')
    assignmentDialogVisible.value = false
    await loadData()
  } catch (error) {
    ElMessage.error('权限分配失败')
  } finally {
    submitLoading.value = false
  }
}

const viewDetails = (assignment: PermissionAssignment) => {
  currentAssignment.value = assignment
  detailDialogVisible.value = true
}

const clearPermissions = async (assignment: PermissionAssignment) => {
  try {
    await permissionAssignmentApi.clearPermissions(assignment.targetId, assignment.targetType)
    ElMessage.success('权限清空成功')
    await loadData()
  } catch (error) {
    ElMessage.error('权限清空失败')
  }
}

const handleBatchClear = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要清空选中的 ${selectedAssignments.value.length} 个目标的所有权限吗？`,
      '批量清空确认',
      { type: 'warning' }
    )
    
    const promises = selectedAssignments.value.map(item => 
      permissionAssignmentApi.clearPermissions(item.targetId, item.targetType)
    )
    await Promise.all(promises)
    
    ElMessage.success('批量清空成功')
    await loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量清空失败')
    }
  }
}

const handleBatchAssign = () => {
  ElMessage.info('批量分配功能待实现')
}

// 初始化
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.permission-assignment {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
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
  align-items: center;
  gap: 10px;
}

.assignment-dialog {
  max-height: 60vh;
  overflow-y: auto;
}

.group-selection {
  max-height: 400px;
  overflow-y: auto;
}

.group-permissions {
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.group-header {
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.group-items {
  padding-left: 20px;
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

.search-selection {
  max-height: 400px;
  overflow-y: auto;
}

.search-results {
  max-height: 350px;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>