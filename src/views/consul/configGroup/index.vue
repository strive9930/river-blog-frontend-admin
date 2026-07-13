<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <el-card class="box-card" shadow="hover" style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <el-form :inline="true" :model="queryParams" style="margin-bottom: -18px;">
          <el-form-item label="环境">
            <el-select v-model="queryParams.env" placeholder="选择环境" style="width: 130px;" @change="handleQuery">
              <el-option v-for="env in envList" :key="env" :label="env" :value="env" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
          </el-form-item>
        </el-form>
        <AuthButton :auth="ApiPerms.ConsulConfigGroup.Add" type="primary" plain @click="handleAdd">
          新增配置组
        </AuthButton>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="box-card" shadow="hover">
      <el-table v-loading="loading" :data="groupList" style="width: 100%" border>
        <el-table-column prop="groupName" label="组名称" width="180">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">{{ row.groupName }}</el-button>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />

        <el-table-column label="作用域" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.scope === 0 ? 'success' : 'warning'" size="small">
              {{ row.scope === 0 ? '公共' : '服务专属' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="serviceName" label="服务名称" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.serviceName">{{ row.serviceName }}</span>
            <span v-else style="color: #c0c4cc;">--</span>
          </template>
        </el-table-column>

        <el-table-column label="Key 前缀" min-width="280">
          <template #default="{ row }">
            <el-tag v-for="prefix in (row.keyPrefixes || [])" :key="prefix" size="small" effect="plain" style="margin: 2px 4px 2px 0;">
              {{ prefix }}
            </el-tag>
            <span v-if="!row.keyPrefixes?.length" style="color: #c0c4cc;">无</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <AuthButton :auth="ApiPerms.ConsulConfigGroup.Edit" link type="primary" size="small" @click="handleEdit(row)">编辑</AuthButton>
            <AuthButton :auth="ApiPerms.ConsulConfigGroup.Delete" link type="danger" size="small" @click="handleDelete(row)">删除</AuthButton>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="环境" prop="environment">
          <el-select v-model="form.environment" placeholder="选择环境" style="width: 100%;">
            <el-option v-for="env in envList" :key="env" :label="env" :value="env" />
          </el-select>
        </el-form-item>

        <el-form-item label="组名称" prop="groupName">
          <el-input v-model="form.groupName" placeholder="如：database-group、redis-group" :disabled="isEdit" />
        </el-form-item>

        <el-form-item label="作用域" prop="scope">
          <el-radio-group v-model="form.scope" @change="form.serviceName = ''">
            <el-radio :value="0">公共</el-radio>
            <el-radio :value="1">服务专属</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="form.scope === 1" label="服务名称" prop="serviceName">
          <el-input v-model="form.serviceName" placeholder="如：blog" />
        </el-form-item>

        <el-form-item label="说明">
          <el-input v-model="form.description" placeholder="可选，配置组说明" />
        </el-form-item>

        <el-form-item label="Key 前缀">
          <div style="width: 100%;">
            <div style="margin-bottom: 8px;">
              <el-tag
                v-for="(prefix, index) in form.keyPrefixes"
                :key="index"
                closable
                style="margin: 0 6px 6px 0;"
                @close="form.keyPrefixes.splice(index, 1)"
              >
                {{ prefix }}
              </el-tag>
            </div>
            <div style="display: flex; gap: 8px;">
              <el-input v-model="newPrefix" placeholder="如：dev/common/ 或 dev/service/blog/" @keyup.enter="addPrefix" style="flex: 1;" />
              <el-button type="primary" @click="addPrefix" :disabled="!newPrefix.trim()">添加</el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 组详情抽屉 -->
    <el-drawer v-model="detailVisible" :title="`配置组详情 - ${detailGroupName}`" size="600px">
      <div v-loading="detailLoading" style="min-height: 200px;">
        <el-descriptions v-if="detailGroup" :column="1" border style="margin-bottom: 20px;">
          <el-descriptions-item label="组名称">{{ detailGroup.groupName }}</el-descriptions-item>
          <el-descriptions-item label="说明">{{ detailGroup.description || '--' }}</el-descriptions-item>
          <el-descriptions-item label="作用域">
            <el-tag :type="detailGroup.scope === 0 ? 'success' : 'warning'" size="small">
              {{ detailGroup.scope === 0 ? '公共' : '服务专属' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Key 前缀">
            <el-tag v-for="p in (detailGroup.keyPrefixes || [])" :key="p" size="small" style="margin-right: 4px;">{{ p }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">包含的配置项</el-divider>

        <el-table v-if="detailItems.length > 0" :data="detailItems" border size="small">
          <el-table-column prop="key" label="Key" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <code style="font-size: 12px;">{{ row.key }}</code>
            </template>
          </el-table-column>
          <el-table-column prop="value" label="Value" min-width="150" show-overflow-tooltip />
          <el-table-column label="类型" width="80" align="center">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">{{ valueTypeLabel(row.valueType) }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="该组暂无配置项" :image-size="60" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ConsulConfigGroup' })

import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ApiPerms } from '@/constants/api-permissions'
import { getConfigGroups, getConfigGroupDetail, createConfigGroup, updateConfigGroup, deleteConfigGroup } from '@/api/consul/configGroup'
import { getEnvironments } from '@/api/consul/config'

const loading = ref(false)
const groupList = ref<any[]>([])
const envList = ref<string[]>(['dev', 'staging', 'prod'])
const queryParams = ref({ env: 'dev' })

// --- 环境加载 ---
const loadEnvironments = async () => {
  try {
    const res = await getEnvironments()
    const data = res?.data?.data || res?.data || []
    if (Array.isArray(data) && data.length > 0) {
      envList.value = data
    }
  } catch { /* 使用默认列表 */ }
}

// --- 数据加载 ---
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getConfigGroups(queryParams.value.env)
    const data = res?.data?.data || res?.data || []
    groupList.value = Array.isArray(data) ? data : []
  } catch {
    groupList.value = []
  } finally {
    loading.value = false
  }
}

const handleQuery = () => fetchData()

// --- 对话框 ---
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const formRef = ref()
const isEdit = ref(false)
const newPrefix = ref('')

const defaultForm = () => ({
  groupName: '',
  environment: queryParams.value.env,
  scope: 0,
  serviceName: '',
  description: '',
  keyPrefixes: [] as string[],
})
const form = ref(defaultForm())

const rules = {
  groupName: [{ required: true, message: '请输入组名称', trigger: 'blur' }],
  environment: [{ required: true, message: '请选择环境', trigger: 'change' }],
  scope: [{ required: true, message: '请选择作用域', trigger: 'change' }],
  serviceName: [{ required: true, message: '请输入服务名称', trigger: 'blur' }],
}

const addPrefix = () => {
  const val = newPrefix.value.trim()
  if (val && !form.value.keyPrefixes.includes(val)) {
    form.value.keyPrefixes.push(val)
  }
  newPrefix.value = ''
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增配置组'
  form.value = defaultForm()
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑配置组'
  form.value = {
    groupName: row.groupName,
    environment: row.environment || queryParams.value.env,
    scope: row.scope ?? 0,
    serviceName: row.serviceName || '',
    description: row.description || '',
    keyPrefixes: [...(row.keyPrefixes || [])],
  }
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认删除配置组 "${row.groupName}" 吗？`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteConfigGroup(row.groupName, queryParams.value.env)
      ElMessage.success('已删除')
      fetchData()
    })
    .catch(() => {})
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
  newPrefix.value = ''
}

const submitForm = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitLoading.value = true
  try {
    if (isEdit.value) {
      await updateConfigGroup(form.value.groupName, {
        groupName: form.value.groupName,
        environment: form.value.environment,
        description: form.value.description,
        keyPrefixes: form.value.keyPrefixes,
      })
    } else {
      await createConfigGroup({
        groupName: form.value.groupName,
        environment: form.value.environment,
        scope: form.value.scope,
        serviceName: form.value.scope === 1 ? form.value.serviceName : undefined,
        description: form.value.description,
        keyPrefixes: form.value.keyPrefixes,
      })
    }
    ElMessage.success('操作成功')
    dialogVisible.value = false
    fetchData()
  } finally {
    submitLoading.value = false
  }
}

// --- 组详情抽屉 ---
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailGroupName = ref('')
const detailGroup = ref<any>(null)
const detailItems = ref<any[]>([])

const openDetail = async (row: any) => {
  detailGroupName.value = row.groupName
  detailVisible.value = true
  detailLoading.value = true
  detailGroup.value = null
  detailItems.value = []
  try {
    const res = await getConfigGroupDetail(row.groupName, queryParams.value.env)
    const data = res?.data?.data || res?.data || {}
    detailGroup.value = data
    detailItems.value = data.items || data.Items || []
  } catch {
    detailGroup.value = row
    detailItems.value = []
  } finally {
    detailLoading.value = false
  }
}

// --- 辅助 ---
const valueTypeLabel = (type: number) => {
  const map: Record<number, string> = { 0: 'String', 1: 'JSON', 2: 'Number', 3: 'Boolean', 4: 'YAML' }
  return map[type] || 'String'
}

onMounted(() => {
  loadEnvironments()
  fetchData()
})
</script>
