<template>
  <div class="app-container">
    <div class="filter-container" style="margin-bottom: 20px;">
      <el-button type="primary" icon="Plus" @click="handleAdd">新增导航</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="tableData"
      border
      stripe
      style="width: 100%"
      row-key="id"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    >
      <el-table-column prop="title" label="导航名称" width="220" />
      <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
      <el-table-column prop="linkUrl" label="跳转链接">
        <template #default="scope">
          <el-link type="primary" :href="scope.row.linkUrl" target="_blank">{{ scope.row.linkUrl }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="icon" label="图标" width="120" align="center">
        <template #default="scope">
          <el-icon v-if="scope.row.icon" size="18"><component :is="scope.row.icon" /></el-icon>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="target" label="打开方式" width="120" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.target === '_blank' ? 'warning' : 'success'" size="small">
            {{ scope.row.target === '_blank' ? '新标签页' : '当前窗口' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="isVisible" label="状态" width="100" align="center">
        <template #default="scope">
          <el-switch
            v-model="scope.row.isVisible"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" align="center" fixed="right">
        <template #default="scope">
          <el-button type="primary" link icon="Plus" @click="handleAddChild(scope.row)">添加下级</el-button>
          <el-button type="primary" link icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
          <el-popconfirm title="确定要删除该导航及其所有子菜单吗？" @confirm="handleDelete(scope.row)">
            <template #reference>
              <el-button type="danger" link icon="Delete">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="550px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        
        <el-form-item label="上级菜单" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            :data="treeSelectData"
            :props="{ label: 'title', value: 'id', children: 'children', disabled: 'disabled' }"
            value-key="id"
            placeholder="请选择上级菜单 (留空则为顶级菜单)"
            check-strictly
            clearable
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="导航名称" prop="title">
          <el-input v-model="formData.title" placeholder="如：首页、关于我" />
        </el-form-item>
        
        <el-form-item label="跳转链接" prop="linkUrl">
          <el-input v-model="formData.linkUrl" placeholder="如：/ 或者 https://github.com/..." />
        </el-form-item>
        
        <el-form-item label="图标 (可选)" prop="icon">
          <el-input v-model="formData.icon" placeholder="输入图标标识符, 如: HomeFilled" />
        </el-form-item>
        
        <el-form-item label="排序权重" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" :min="1" :max="999" controls-position="right" />
          <div class="el-form-item__info" style="margin-left: 10px; color: #909399; font-size: 12px;">数字越小越靠前</div>
        </el-form-item>
        
        <el-form-item label="打开方式" prop="target">
          <el-radio-group v-model="formData.target">
            <el-radio label="_self">当前窗口 (_self)</el-radio>
            <el-radio label="_blank">新标签页 (_blank)</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="是否显示" prop="isVisible">
          <el-switch v-model="formData.isVisible" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getSiteNavigations,
  createSiteNavigation,
  updateSiteNavigation,
  deleteSiteNavigation
} from '@/api/blog/siteNavigation'

// === 数据状态 ===
const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])

// === 弹窗与表单状态 ===
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)

const formData = reactive({
  id: null,
  parentId: null, // 新增 ParentId 字段
  title: '',
  linkUrl: '',
  icon: '',
  sortOrder: 1,
  target: '_self',
  isVisible: true
})

// === 表单校验规则 ===
const rules = {
  title: [{ required: true, message: '请输入导航名称', trigger: 'blur' }],
  linkUrl: [{ required: true, message: '请输入跳转链接', trigger: 'blur' }]
}

// === 初始化加载 ===
onMounted(() => {
  fetchData()
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getSiteNavigations()
    tableData.value = res.data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 🌟 防御性计算属性：生成下拉树数据，禁用正在编辑的节点及其子节点（防止循环依赖导致后端树爆炸）
const treeSelectData = computed(() => {
  if (!formData.id) return tableData.value

  const disableSelfAndChildren = (nodes) => {
    return nodes.map(node => {
      const newNode = { ...node }
      // 如果是当前正在编辑的节点，禁用它（不能把自己的父级设为自己）
      if (newNode.id === formData.id) {
        newNode.disabled = true
      }
      // 递归处理子节点
      if (newNode.children && newNode.children.length > 0) {
        newNode.children = disableSelfAndChildren(newNode.children)
      }
      return newNode
    })
  }

  return disableSelfAndChildren(tableData.value)
})

// === 操作方法 ===
const handleAdd = () => {
  dialogTitle.value = '新增顶级导航'
  dialogVisible.value = true
}

const handleAddChild = (row) => {
  dialogTitle.value = `新增 [${row.title}] 的下级导航`
  formData.parentId = row.id // 自动填充 parentId
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑导航'
  // 提取具体字段，避免把庞大的 children 数组带入表单提交 payload 中
  const { id, parentId, title, linkUrl, icon, sortOrder, target, isVisible } = row
  Object.assign(formData, { id, parentId, title, linkUrl, icon, sortOrder, target, isVisible })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await deleteSiteNavigation(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    console.error(error)
  }
}

// 快捷修改状态 (Switch 开关触发)
const handleStatusChange = async (row) => {
  try {
    // 构造纯净的更新负载，丢弃 children
    const payload = {
      id: row.id,
      parentId: row.parentId,
      title: row.title,
      linkUrl: row.linkUrl,
      icon: row.icon,
      sortOrder: row.sortOrder,
      target: row.target,
      isVisible: row.isVisible
    }
    await updateSiteNavigation(row.id, payload)
    ElMessage.success('状态更新成功')
  } catch (error) {
    row.isVisible = !row.isVisible // 如果失败则复原状态
    console.error(error)
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (formData.id) {
          await updateSiteNavigation(formData.id, formData)
          ElMessage.success('更新成功')
        } else {
          await createSiteNavigation(formData)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        fetchData()
      } catch (error) {
        console.error(error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(formData, {
    id: null,
    parentId: null,
    title: '',
    linkUrl: '',
    icon: '',
    sortOrder: 1,
    target: '_self',
    isVisible: true
  })
}
</script>

<style scoped>
.app-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
}
</style>