<template>
  <div class="permission-groups">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>权限分组管理</span>
          <div class="header-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索权限..."
              style="width: 200px; margin-right: 10px;"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="loadPermissionGroups">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 权限统计概览 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-statistic title="总权限数" :value="statistics.totalPermissions" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="分组数" :value="statistics.totalGroups" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="系统权限" :value="statistics.systemPermissions" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="自定义权限" :value="statistics.customPermissions" />
        </el-col>
      </el-row>

      <!-- 分组展示区域 -->
      <div class="groups-container">
        <el-collapse v-model="activeGroups" accordion>
          <el-collapse-item
            v-for="group in filteredGroups"
            :key="group.groupName"
            :name="group.groupName"
          >
            <template #title>
              <div class="group-header">
                <el-tag :type="getGroupTagType(group.groupName)" effect="dark">
                  {{ group.groupName || '未分组' }}
                </el-tag>
                <span class="group-count">({{ group.permissions.length }}个权限)</span>
                <div class="group-actions">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click.stop="handleAddPermission(group.groupName)"
                  >
                    添加权限
                  </el-button>
                </div>
              </div>
            </template>
            
            <el-table 
              :data="group.permissions" 
              style="width: 100%"
              :row-class-name="tableRowClassName"
            >
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="name" label="权限名称">
                <template #default="scope">
                  <strong>{{ scope.row.name }}</strong>
                </template>
              </el-table-column>
              <el-table-column prop="code" label="权限编码" width="200">
                <template #default="scope">
                  <el-tag type="info">{{ scope.row.code }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="描述" show-overflow-tooltip />
              <el-table-column prop="createTime" label="创建时间" width="180" />
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="scope">
                  <el-button 
                    size="small" 
                    type="primary" 
                    @click="handleEditPermission(scope.row)"
                  >
                    编辑
                  </el-button>
                  <el-button 
                    size="small" 
                    type="danger" 
                    @click="handleDeletePermission(scope.row)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- 空状态 -->
      <el-empty 
        v-if="filteredGroups.length === 0" 
        description="暂无权限分组数据"
        :image-size="100"
      >
        <el-button type="primary" @click="handleCreateGroup">创建新分组</el-button>
      </el-empty>
    </el-card>

    <!-- 权限编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="permissionFormRef"
        :model="permissionForm"
        :rules="permissionRules"
        label-width="100px"
      >
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="permissionForm.name" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item label="权限编码" prop="code">
          <el-input v-model="permissionForm.code" placeholder="请输入权限编码" />
        </el-form-item>
        <el-form-item label="所属分组" prop="group">
          <el-select v-model="permissionForm.group" placeholder="请选择分组" style="width: 100%">
            <el-option label="未分组" value="" />
            <el-option 
              v-for="groupName in allGroupNames" 
              :key="groupName" 
              :label="groupName" 
              :value="groupName" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="permissionForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入权限描述" 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitPermission">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'

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

interface Statistics {
  totalPermissions: number
  totalGroups: number
  systemPermissions: number
  customPermissions: number
}

const searchKeyword = ref('')
const activeGroups = ref<string[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const permissionFormRef = ref()
const isEditing = ref(false)

// 表单数据
const permissionForm = ref({
  id: 0,
  name: '',
  code: '',
  group: '',
  description: ''
})

// 表单验证规则
const permissionRules = {
  name: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入权限编码', trigger: 'blur' }],
  group: [{ required: false, message: '请选择分组', trigger: 'change' }]
}

// 模拟数据
const permissionGroups = ref<PermissionGroup[]>([
  {
    groupName: '用户管理',
    permissions: [
      {
        id: 1,
        name: '查看用户列表',
        code: 'user.view',
        description: '查看所有用户信息',
        group: '用户管理',
        createTime: '2024-01-01'
      },
      {
        id: 2,
        name: '创建用户',
        code: 'user.create',
        description: '创建新用户',
        group: '用户管理',
        createTime: '2024-01-01'
      }
    ]
  },
  {
    groupName: '系统管理',
    permissions: [
      {
        id: 3,
        name: '系统配置',
        code: 'system.config',
        description: '管理系统配置参数',
        group: '系统管理',
        createTime: '2024-01-01'
      }
    ]
  },
  {
    groupName: '',
    permissions: [
      {
        id: 4,
        name: '基础权限',
        code: 'basic.access',
        description: '系统基础访问权限',
        group: '',
        createTime: '2024-01-01'
      }
    ]
  }
])

const statistics = ref<Statistics>({
  totalPermissions: 4,
  totalGroups: 2,
  systemPermissions: 1,
  customPermissions: 3
})

// 计算属性
const filteredGroups = computed(() => {
  if (!searchKeyword.value) {
    return permissionGroups.value
  }
  
  return permissionGroups.value.map(group => ({
    ...group,
    permissions: group.permissions.filter(permission =>
      permission.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      permission.code.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  })).filter(group => group.permissions.length > 0)
})

const allGroupNames = computed(() => {
  return [...new Set(permissionGroups.value.map(g => g.groupName).filter(name => name))]
})

// 方法
const loadPermissionGroups = async () => {
  try {
    // 这里应该调用API获取数据
    // const response = await permissionApi.getPermissionGroups()
    // permissionGroups.value = response.data
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  }
}

const getGroupTagType = (groupName: string) => {
  const types = ['primary', 'success', 'warning', 'danger', 'info']
  const index = Math.abs(groupName.hashCode ? groupName.hashCode() : 0) % types.length
  return types[index] || 'primary'
}

const tableRowClassName = ({ rowIndex }: { rowIndex: number }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
}

const handleAddPermission = (groupName: string) => {
  dialogTitle.value = '添加权限'
  isEditing.value = false
  permissionForm.value = {
    id: 0,
    name: '',
    code: '',
    group: groupName,
    description: ''
  }
  dialogVisible.value = true
}

const handleEditPermission = (permission: Permission) => {
  dialogTitle.value = '编辑权限'
  isEditing.value = true
  permissionForm.value = { ...permission }
  dialogVisible.value = true
}

const handleDeletePermission = async (permission: Permission) => {
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
    
    // 这里应该调用API删除权限
    // await permissionApi.deletePermission(permission.id)
    
    ElMessage.success('删除成功')
    loadPermissionGroups()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleCreateGroup = () => {
  ElMessage.info('创建分组功能待实现')
}

const submitPermission = async () => {
  if (!permissionFormRef.value) return
  
  try {
    await permissionFormRef.value.validate()
    
    if (isEditing.value) {
      // 编辑权限
      // await permissionApi.updatePermission(permissionForm.value)
      ElMessage.success('权限更新成功')
    } else {
      // 新增权限
      // await permissionApi.createPermission(permissionForm.value)
      ElMessage.success('权限创建成功')
    }
    
    dialogVisible.value = false
    loadPermissionGroups()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const resetForm = () => {
  if (permissionFormRef.value) {
    permissionFormRef.value.resetFields()
  }
  permissionForm.value = {
    id: 0,
    name: '',
    code: '',
    group: '',
    description: ''
  }
}

// 页面加载时初始化
onMounted(() => {
  loadPermissionGroups()
})
</script>

<style scoped>
.permission-groups {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.groups-container {
  margin-top: 20px;
}

.group-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.group-count {
  margin-left: 10px;
  color: #909399;
  font-size: 14px;
}

.group-actions {
  margin-left: auto;
}

:deep(.el-collapse-item__header) {
  padding: 15px 20px;
}

:deep(.el-table__row.even-row) {
  background-color: #fafafa;
}

:deep(.el-table__row.odd-row) {
  background-color: #ffffff;
}

.dialog-footer {
  text-align: right;
}
</style>