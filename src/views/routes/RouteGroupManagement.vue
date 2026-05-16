<template>
  <div class="route-group-management">
    <!-- 顶部操作栏 -->
    <el-card class="search-card" shadow="never">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索分组名称/编码"
            clearable
            @keyup.enter="loadData"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.groupType" placeholder="分组类型" clearable style="width:100%">
            <el-option label="前端路由分组" :value="1" />
            <el-option label="后端路由分组" :value="2" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.isEnabled" placeholder="状态" clearable style="width:100%">
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-col>
        <el-col :span="10" style="display:flex;gap:8px">
          <el-button type="primary" @click="loadData"><el-icon><Search /></el-icon>搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="success" @click="openCreateDialog()">
            <el-icon><Plus /></el-icon>新建分组
          </el-button>
          <el-button @click="loadData"><el-icon><Refresh /></el-icon></el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 路由分组列表 -->
    <el-card shadow="never" style="margin-top:16px">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon style="color:#409eff"><FolderOpened /></el-icon>
            路由分组管理
            <el-tag type="info" size="small" style="margin-left:8px">共 {{ total }} 个分组</el-tag>
          </span>
        </div>
      </template>

      <el-table
        :data="groupList"
        v-loading="loading"
        stripe
        style="width:100%"
      >
        <el-table-column prop="name" label="分组名称" min-width="160">
          <template #default="{ row }">
            <div style="display:flex;align-items:center;gap:8px">
              <el-icon style="color:#409eff"><FolderOpened /></el-icon>
              <span style="font-weight:500">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="code" label="分组编码" width="180">
          <template #default="{ row }">
            <el-tag type="warning" size="small">{{ row.code }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="groupType" label="分组类型" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="row.groupType === 1 ? 'primary' : 'success'" size="small">
              {{ row.groupType === 1 ? '前端路由分组' : '后端路由分组' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="sort" label="排序" width="70" align="center" />

        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span style="color:#606266">{{ row.description || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="isEnabled" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.isEnabled"
              @change="toggleStatus(row)"
              size="small"
            />
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="创建时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openEditDialog(row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-popconfirm
              :title="`确认删除分组「${row.name}」？`"
              @confirm="deleteGroup(row)"
              width="240"
            >
              <template #reference>
                <el-button size="small" type="danger" link>
                  <el-icon><Delete /></el-icon>删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.pageIndex"
          v-model:page-size="pagination.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @change="loadData"
        />
      </div>
    </el-card>

    <!-- 新建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新建路由分组' : `编辑分组 — ${editingGroup?.name}`"
      width="520px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分组名称" prop="name">
              <el-input v-model="form.name" placeholder="例: 用户相关路由" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分组编码" prop="code">
              <el-input v-model="form.code" placeholder="例: user-routes" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分组类型" prop="groupType">
              <el-select v-model="form.groupType" style="width:100%">
                <el-option label="前端路由分组" :value="1" />
                <el-option label="后端路由分组" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序号">
              <el-input-number v-model="form.sort" :min="0" :max="9999" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="分组描述（可选）" />
        </el-form-item>

        <el-form-item label="启用状态">
          <el-switch v-model="form.isEnabled" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">
          {{ dialogMode === 'create' ? '创建分组' : '保存修改' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { RouteGroupApi } from '@/api/route'
import type { RouteGroup } from '@/api/route'

// ==================== 状态 ====================

const loading = ref(false)
const submitting = ref(false)
const groupList = ref<RouteGroup[]>([])
const total = ref(0)

const searchForm = reactive({
  keyword: '',
  groupType: undefined as number | undefined,
  isEnabled: undefined as boolean | undefined
})

const pagination = reactive({
  pageIndex: 1,
  pageSize: 10
})

// 对话框
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingGroup = ref<RouteGroup | null>(null)
const formRef = ref<FormInstance>()

const defaultForm = () => ({
  name: '',
  code: '',
  description: '',
  sort: 0,
  groupType: 1,
  isEnabled: true,
  parentId: undefined as string | undefined
})

const form = reactive(defaultForm())

const formRules: FormRules = {
  name: [{ required: true, message: '请填写分组名称', trigger: 'blur' }],
  code: [{ required: true, message: '请填写分组编码', trigger: 'blur' }],
  groupType: [{ required: true, message: '请选择分组类型', trigger: 'change' }]
}

// ==================== 方法 ====================

async function loadData() {
  loading.value = true
  try {
    const res = await RouteGroupApi.getPaged({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      groupType: searchForm.groupType,
      isEnabled: searchForm.isEnabled
    })
    groupList.value = res.data?.data || []
    total.value = res.data?.totalCount || 0
  } catch {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

function resetSearch() {
  searchForm.keyword = ''
  searchForm.groupType = undefined
  searchForm.isEnabled = undefined
  pagination.pageIndex = 1
  loadData()
}

function openCreateDialog() {
  dialogMode.value = 'create'
  editingGroup.value = null
  Object.assign(form, defaultForm())
  dialogVisible.value = true
}

function openEditDialog(group: RouteGroup) {
  dialogMode.value = 'edit'
  editingGroup.value = group
  Object.assign(form, {
    name: group.name,
    code: group.code,
    description: group.description || '',
    sort: group.sort,
    groupType: group.groupType,
    isEnabled: group.isEnabled,
    parentId: group.parentId
  })
  dialogVisible.value = true
}

async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate(async valid => {
    if (!valid) return
    submitting.value = true
    try {
      const payload = {
        name: form.name,
        code: form.code,
        description: form.description || undefined,
        sort: form.sort,
        groupType: form.groupType,
        isEnabled: form.isEnabled,
        parentId: form.parentId
      }
      if (dialogMode.value === 'create') {
        await RouteGroupApi.create(payload)
        ElMessage.success('路由分组创建成功')
      } else {
        await RouteGroupApi.update(editingGroup.value!.id, payload)
        ElMessage.success('路由分组更新成功')
      }
      dialogVisible.value = false
      loadData()
    } catch {
      ElMessage.error(dialogMode.value === 'create' ? '创建失败' : '更新失败')
    } finally {
      submitting.value = false
    }
  })
}

async function deleteGroup(group: RouteGroup) {
  try {
    await RouteGroupApi.delete(group.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {
    ElMessage.error('删除失败，该分组可能包含路由')
  }
}

async function toggleStatus(group: RouteGroup) {
  try {
    await RouteGroupApi.update(group.id, { isEnabled: group.isEnabled })
    ElMessage.success(`已${group.isEnabled ? '启用' : '禁用'}分组`)
  } catch {
    group.isEnabled = !group.isEnabled
    ElMessage.error('操作失败')
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ==================== 生命周期 ====================
onMounted(loadData)
</script>

<style scoped>
.route-group-management {
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>