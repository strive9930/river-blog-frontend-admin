<template>
  <div class="role-permission-view">
    <!-- 角色信息概览 -->
    <el-card class="role-info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>角色权限状态</span>
          <el-button type="primary" link @click="refreshPermissionStatus">
            <el-icon><Refresh /></el-icon>刷新
          </el-button>
        </div>
      </template>
      
      <div v-if="rolePermissionStatus" class="role-summary">
        <el-descriptions :column="4" border>
          <el-descriptions-item label="角色名称">
            <strong>{{ rolePermissionStatus.roleName }}</strong>
          </el-descriptions-item>
          <el-descriptions-item label="已分配权限">
            <el-tag type="success">{{ assignedPermissionCount }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总权限数">
            <el-tag type="info">{{ totalPermissionCount }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="分配比例">
            <el-progress 
              :percentage="assignmentPercentage" 
              :color="progressColor"
              :stroke-width="10"
            />
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <!-- 权限分配面板 -->
    <el-card class="permission-panel" shadow="never">
      <template #header>
        <div class="card-header">
          <span>权限分配管理</span>
          <div>
            <el-button @click="expandAll">全部展开</el-button>
            <el-button @click="collapseAll">全部收起</el-button>
            <el-button type="primary" @click="savePermissionChanges" :loading="saving">
              <el-icon><Check /></el-icon>保存更改
            </el-button>
          </div>
        </div>
      </template>

      <!-- 权限搜索 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索权限..."
          clearable
          @input="filterPermissions"
          style="width: 300px; margin-bottom: 15px;"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <!-- 权限树 -->
      <div v-loading="loading" class="permission-tree-container">
        <el-tree
          :key="treeKey"
          ref="permissionTreeRef"
          :data="filteredPermissionTree"
          show-checkbox
          node-key="id"
          :props="treeProps"
          :default-expanded-keys="expandedKeys"
          :default-checked-keys="checkedKeys"
          :filter-node-method="filterNode"
          @check="handleTreeCheck"
          class="permission-tree"
        >
          <template #default="{ node, data }">
            <div class="permission-node">
              <span class="permission-name">{{ data.name }}</span>
              <span v-if="data.code" class="permission-code">{{ data.code }}</span>
              <span v-if="data.description" class="permission-desc">{{ data.description }}</span>
            </div>
          </template>
        </el-tree>
        
        <div v-if="!hasPermissionTree && !loading" class="empty-state">
          <el-empty description="暂无权限数据" />
        </div>
      </div>
    </el-card>

    <!-- 变更预览 -->
    <el-card v-if="hasPendingChanges" class="changes-preview" shadow="never">
      <template #header>
        <div class="card-header">
          <span>权限变更预览</span>
          <el-button type="danger" link @click="clearChanges">清空更改</el-button>
        </div>
      </template>
      
      <div class="changes-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="change-section">
              <h4><el-tag type="success">新增权限 ({{ addPermissionIds.length }})</el-tag></h4>
              <div class="permission-list">
                <el-tag
                  v-for="permissionId in addPermissionIds"
                  :key="permissionId"
                  type="success"
                  closable
                  @close="removeAddPermission(permissionId)"
                  class="permission-tag"
                >
                  {{ getPermissionName(permissionId) }}
                </el-tag>
                <div v-if="addPermissionIds.length === 0" class="empty-text">无新增权限</div>
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="change-section">
              <h4><el-tag type="danger">移除权限 ({{ removePermissionIds.length }})</el-tag></h4>
              <div class="permission-list">
                <el-tag
                  v-for="permissionId in removePermissionIds"
                  :key="permissionId"
                  type="danger"
                  closable
                  @close="removeRemovePermission(permissionId)"
                  class="permission-tag"
                >
                  {{ getPermissionName(permissionId) }}
                </el-tag>
                <div v-if="removePermissionIds.length === 0" class="empty-text">无移除权限</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElTree } from 'element-plus'
import { Search, Refresh, Check } from '@element-plus/icons-vue'
import { useRolePermissions } from '@/composables/useRolePermissions'
import type { PermissionTreeNode } from '@/composables/useRolePermissions'

// Props
const props = defineProps<{
  roleId: string
}>()

// Emits
const emit = defineEmits<{
  (e: 'saved'): void
}>()

// 使用组合式API
const {
  loading,
  permissionTree,
  rolePermissionStatus,
  expandedKeys,
  hasPermissionTree,
  loadPermissionTree,
  getRolePermissionStatus,
  batchAssignPermissions
} = useRolePermissions()

// 响应式数据
const saving = ref(false)
const searchKeyword = ref('')
const permissionTreeRef = ref<InstanceType<typeof ElTree> | null>(null)
const filteredPermissionTree = ref<PermissionTreeNode[]>([])
const checkedKeys = ref<string[]>([])
const addPermissionIds = ref<string[]>([])
const removePermissionIds = ref<string[]>([])
const treeKey = ref(0);

// Tree配置
const treeProps = {
  children: 'children',
  label: 'name'
}

// 计算属性
const assignedPermissionCount = computed(() => 
  rolePermissionStatus.value?.assignedPermissions.length || 0
)

const totalPermissionCount = computed(() => 
  getAllPermissionIds(permissionTree.value).length
)

const assignmentPercentage = computed(() => {
  if (totalPermissionCount.value === 0) return 0
  return Math.round((assignedPermissionCount.value / totalPermissionCount.value) * 100)
})

const progressColor = computed(() => {
  const percentage = assignmentPercentage.value
  if (percentage < 30) return '#f56c6c'
  if (percentage < 70) return '#e6a23c'
  return '#67c23a'
})

const hasPendingChanges = computed(() => 
  addPermissionIds.value.length > 0 || removePermissionIds.value.length > 0
)

// 方法
const refreshPermissionStatus = async () => {
  await Promise.all([
    loadPermissionTree(),
    getRolePermissionStatus(props.roleId)
  ])
  syncCheckedKeys()
}

// 递归获取所有节点ID的辅助函数
const getAllNodeIds = (nodes: PermissionTreeNode[]) => {
  let ids: string[] = [];
  nodes.forEach(node => {
    ids.push(node.id);
    if (node.children && node.children.length > 0) {
      ids = ids.concat(getAllNodeIds(node.children));
    }
  });
  return ids;
};

const expandAll = () => {
  if (!permissionTreeRef.value) return;
  
  const allNodeIds = getAllNodeIds(permissionTree.value);
  
  // 1. 更新响应式数据
  expandedKeys.value = allNodeIds;
  
  // 2. 【核心】直接操作内部 store 强制展开
  const treeInstance = permissionTreeRef.value as any;
  if (treeInstance.store) {
    // 将 store 中的展开节点列表设置为所有节点
    // getNode 可能会返回 null，所以需要 filter
    treeInstance.store.expandedNodes = allNodeIds
      .map(id => treeInstance.store.getNode(id))
      .filter(node => node);
  }
};
const collapseAll = () => {
  // 1. 先尝试常规方法（操作 store）
  const treeInstance = permissionTreeRef.value as any;
  if (treeInstance && treeInstance.store) {
    treeInstance.store.expandedNodes = [];
    expandedKeys.value = [];
  }
  // 2. 如果界面没变，或者为了绝对稳妥，直接让组件重绘
  // 改变 key 会让 Vue 销毁旧组件并创建一个全新的、默认折叠的组件
  treeKey.value++; 
  
  // 注意：重绘后，如果需要保留某些展开状态，需要重新计算 expandedKeys
  // 但既然是“全部收起”，重绘后默认就是收起的，所以完美符合需求。
};

const filterPermissions = () => {
  if (permissionTreeRef.value) {
    permissionTreeRef.value.filter(searchKeyword.value)
  }
}

const filterNode = (value: string, data: PermissionTreeNode) => {
  if (!value) return true
  return data.name.toLowerCase().includes(value.toLowerCase()) ||
         data.code.toLowerCase().includes(value.toLowerCase()) ||
         (data.description && data.description.toLowerCase().includes(value.toLowerCase()))
}

const handleTreeCheck = (data: PermissionTreeNode, info: any) => {
  const { checkedKeys: currentCheckedKeys } = info
  const newAssignedPermissions = new Set(currentCheckedKeys)
  const currentAssigned = new Set(rolePermissionStatus.value?.assignedPermissions || [])
  
  // 计算新增权限
  addPermissionIds.value = currentCheckedKeys.filter((key: string) => 
    !currentAssigned.has(key)
  )
  
  // 计算移除权限
  removePermissionIds.value = Array.from(currentAssigned).filter(id => 
    !newAssignedPermissions.has(id)
  )
  
  checkedKeys.value = currentCheckedKeys
}

const savePermissionChanges = async () => {
  if (!hasPendingChanges.value) {
    ElMessage.info('没有权限变更需要保存')
    return
  }

  try {
    saving.value = true
    const success = await batchAssignPermissions(
      props.roleId,
      addPermissionIds.value,
      removePermissionIds.value
    )
    
    if (success) {
      // 保存成功后刷新状态
      await refreshPermissionStatus()
      clearChanges()
      emit('saved')
    }
  } finally {
    saving.value = false
  }
}

const clearChanges = () => {
  addPermissionIds.value = []
  removePermissionIds.value = []
  syncCheckedKeys()
}

const removeAddPermission = (permissionId: string) => {
  addPermissionIds.value = addPermissionIds.value.filter(id => id !== permissionId)
  updateCheckedKeys()
}

const removeRemovePermission = (permissionId: string) => {
  removePermissionIds.value = removePermissionIds.value.filter(id => id !== permissionId)
  updateCheckedKeys()
}

const getPermissionName = (permissionId: string): string => {
  const findPermission = (nodes: PermissionTreeNode[]): PermissionTreeNode | undefined => {
    for (const node of nodes) {
      if (node.id === permissionId) return node
      if (node.children) {
        const found = findPermission(node.children)
        if (found) return found
      }
    }
    return undefined
  }
  
  const permission = findPermission(permissionTree.value)
  return permission ? permission.name : permissionId
}

const getAllPermissionIds = (nodes: PermissionTreeNode[]): string[] => {
  const ids: string[] = []
  const traverse = (nodeList: PermissionTreeNode[]) => {
    nodeList.forEach(node => {
      ids.push(node.id)
      if (node.children) traverse(node.children)
    })
  }
  traverse(nodes)
  return ids
}

const syncCheckedKeys = () => {
  checkedKeys.value = [...(rolePermissionStatus.value?.assignedPermissions || [])]
  if (permissionTreeRef.value) {
    permissionTreeRef.value.setCheckedKeys(checkedKeys.value)
  }
}

const updateCheckedKeys = () => {
  const currentAssigned = new Set(rolePermissionStatus.value?.assignedPermissions || [])
  
  // 应用移除的权限
  removePermissionIds.value.forEach(id => currentAssigned.delete(id))
  
  // 应用新增的权限
  addPermissionIds.value.forEach(id => currentAssigned.add(id))
  
  checkedKeys.value = Array.from(currentAssigned)
  if (permissionTreeRef.value) {
    permissionTreeRef.value.setCheckedKeys(checkedKeys.value)
  }
}

// 监听器
watch(() => props.roleId, async (newRoleId) => {
  if (newRoleId) {
    await refreshPermissionStatus()
  }
})

// 生命周期
onMounted(async () => {
  await refreshPermissionStatus()
  filteredPermissionTree.value = [...permissionTree.value]
})
</script>

<style scoped>
.role-permission-view {
  padding: 20px;
}

.role-info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.role-summary {
  padding: 10px 0;
}

.permission-panel {
  margin-bottom: 20px;
}

.search-bar {
  margin-bottom: 15px;
}

.permission-tree-container {
  min-height: 400px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
}

.permission-tree {
  max-height: 500px;
  overflow-y: auto;
}

.permission-node {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
}

.permission-name {
  font-weight: 500;
}

.permission-code {
  font-family: monospace;
  font-size: 12px;
  color: #909399;
  background-color: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
}

.permission-desc {
  font-size: 12px;
  color: #909399;
  flex: 1;
  text-align: right;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.changes-preview {
  margin-bottom: 20px;
}

.changes-content {
  padding: 10px 0;
}

.change-section {
  margin-bottom: 20px;
}

.change-section h4 {
  margin-bottom: 10px;
}

.permission-list {
  min-height: 60px;
  padding: 10px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  background-color: #fafafa;
}

.permission-tag {
  margin: 5px;
}

.empty-text {
  color: #909399;
  font-style: italic;
  text-align: center;
  padding: 20px;
}
</style>