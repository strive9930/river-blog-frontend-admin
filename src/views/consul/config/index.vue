<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <el-card class="box-card" shadow="hover" style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <el-form :inline="true" :model="queryParams" class="demo-form-inline" style="margin-bottom: -18px;">
          <el-form-item label="环境">
            <el-select v-model="queryParams.env" placeholder="选择环境" style="width: 130px;" @change="handleQuery">
              <el-option v-for="env in envList" :key="env" :label="env" :value="env" />
            </el-select>
          </el-form-item>
          <el-form-item label="Key 前缀">
            <el-input v-model="queryParams.prefix" placeholder="如：common/ 或 service/blog/" clearable @keyup.enter="handleQuery" style="width: 280px;" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
          </el-form-item>
        </el-form>
        <div style="display: flex; gap: 8px;">
          <AuthButton :auth="ApiPerms.ConsulConfig.BatchDelete" type="danger" plain :disabled="selectedRows.length === 0" @click="handleBatchDelete">
            批量删除 ({{ selectedRows.length }})
          </AuthButton>
          <AuthButton :auth="ApiPerms.ConsulConfig.Add" type="primary" plain @click="handleAdd">
            新增配置
          </AuthButton>
        </div>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="box-card" shadow="hover">
      <el-table v-loading="loading" :data="configList" style="width: 100%" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="45" />

        <el-table-column prop="key" label="配置 Key" min-width="280" show-overflow-tooltip>
          <template #default="{ row }">
            <code style="font-size: 12px; color: #409eff;">{{ row.key }}</code>
          </template>
        </el-table-column>

        <el-table-column prop="value" label="配置值" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span style="font-size: 13px;">{{ truncateValue(row.value) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="valueTypeTagType(row.valueType)" size="small" effect="plain">
              {{ valueTypeLabel(row.valueType) }}
            </el-tag>
          </template>
        </el-table-column>

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

        <el-table-column prop="description" label="说明" width="160" show-overflow-tooltip />

        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <AuthButton :auth="ApiPerms.ConsulConfig.Edit" link type="primary" size="small" @click="handleEdit(row)">编辑</AuthButton>
            <AuthButton :auth="ApiPerms.ConsulConfig.Delete" link type="danger" size="small" @click="handleDelete(row)">删除</AuthButton>
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

        <el-form-item label="作用域" prop="scope">
          <el-radio-group v-model="form.scope" @change="form.serviceName = ''">
            <el-radio :value="0">公共配置（所有服务共享）</el-radio>
            <el-radio :value="1">服务专属</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="form.scope === 1" label="服务名称" prop="serviceName">
          <el-input v-model="form.serviceName" placeholder="如：blog、identity、quartz" />
        </el-form-item>

        <el-form-item label="配置 Key" prop="key">
          <el-input v-model="form.key" placeholder="如：jwt-secret、connection-string" :disabled="isEdit" />
          <div class="field-tip">
            完整路径: {{ computedFullPath }}
          </div>
        </el-form-item>

        <el-form-item label="值类型" prop="valueType">
          <el-select v-model="form.valueType" style="width: 100%;">
            <el-option label="String" :value="0" />
            <el-option label="JSON" :value="1" />
            <el-option label="Number" :value="2" />
            <el-option label="Boolean" :value="3" />
            <el-option label="YAML" :value="4" />
          </el-select>
        </el-form-item>

        <el-form-item label="配置值" prop="value">
          <el-input v-model="form.value" type="textarea" :rows="form.valueType === 1 || form.valueType === 4 ? 8 : 3" placeholder="输入配置值" />
        </el-form-item>

        <el-form-item label="说明">
          <el-input v-model="form.description" placeholder="可选，配置项说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ConsulConfig' })

import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ApiPerms } from '@/constants/api-permissions'
import { getConfigByPrefix, createConfig, updateConfig, deleteConfig, batchDeleteConfig, getEnvironments } from '@/api/consul/config'

const loading = ref(false)
const configList = ref<any[]>([])
const selectedRows = ref<any[]>([])
const envList = ref<string[]>(['dev', 'staging', 'prod'])

const queryParams = ref({ env: 'dev', prefix: '' })

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
    const prefix = queryParams.value.prefix || ''
    const res = await getConfigByPrefix(prefix, queryParams.value.env)
    const data = res?.data?.data || res?.data || []
    configList.value = Array.isArray(data) ? data : []
  } catch {
    configList.value = []
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  fetchData()
}

const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows
}

// --- 对话框 ---
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const formRef = ref()
const isEdit = ref(false)

const defaultForm = () => ({
  key: '',
  value: '',
  valueType: 0,
  environment: queryParams.value.env,
  scope: 0,
  serviceName: '',
  description: '',
})
const form = ref(defaultForm())

const rules = {
  key: [{ required: true, message: '请输入配置 Key', trigger: 'blur' }],
  value: [{ required: true, message: '请输入配置值', trigger: 'blur' }],
  environment: [{ required: true, message: '请选择环境', trigger: 'change' }],
  scope: [{ required: true, message: '请选择作用域', trigger: 'change' }],
  serviceName: [{ required: true, message: '请输入服务名称', trigger: 'blur' }],
  valueType: [{ required: true, message: '请选择值类型', trigger: 'change' }],
}

const computedFullPath = computed(() => {
  if (!form.value.key) return '--'
  if (form.value.scope === 0) {
    return `${form.value.environment}/common/${form.value.key}`
  }
  const svc = form.value.serviceName || '{serviceName}'
  return `${form.value.environment}/service/${svc}/${form.value.key}`
})

// --- CRUD ---
const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增配置项'
  form.value = defaultForm()
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑配置项'
  form.value = {
    key: row.key,
    value: row.value,
    valueType: row.valueType ?? 0,
    environment: row.environment || queryParams.value.env,
    scope: row.scope ?? 0,
    serviceName: row.serviceName || '',
    description: row.description || '',
  }
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认删除配置项 "${row.key}" 吗？`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteConfig(row.key, queryParams.value.env)
      ElMessage.success('已删除')
      fetchData()
    })
    .catch(() => {})
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 个配置项吗？`, '提示', { type: 'warning' })
    .then(async () => {
      const keys = selectedRows.value.map((r: any) => r.key)
      await batchDeleteConfig(keys, queryParams.value.env)
      ElMessage.success('批量删除成功')
      fetchData()
    })
    .catch(() => {})
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
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
      await updateConfig({
        key: form.value.key,
        value: form.value.value,
        environment: form.value.environment,
        valueType: form.value.valueType,
        description: form.value.description,
      })
    } else {
      await createConfig({
        key: form.value.key,
        value: form.value.value,
        valueType: form.value.valueType,
        environment: form.value.environment,
        scope: form.value.scope,
        serviceName: form.value.scope === 1 ? form.value.serviceName : undefined,
        description: form.value.description,
      })
    }
    ElMessage.success('操作成功')
    dialogVisible.value = false
    fetchData()
  } finally {
    submitLoading.value = false
  }
}

// --- 辅助 ---
const valueTypeLabel = (type: number) => {
  const map: Record<number, string> = { 0: 'String', 1: 'JSON', 2: 'Number', 3: 'Boolean', 4: 'YAML' }
  return map[type] || 'String'
}

const valueTypeTagType = (type: number) => {
  const map: Record<number, string> = { 0: '', 1: 'success', 2: 'warning', 3: 'danger', 4: 'info' }
  return (map[type] || '') as any
}

const truncateValue = (val: string) => {
  if (!val) return '--'
  return val.length > 80 ? val.substring(0, 80) + '...' : val
}

onMounted(() => {
  loadEnvironments()
  fetchData()
})
</script>

<style scoped>
.field-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
