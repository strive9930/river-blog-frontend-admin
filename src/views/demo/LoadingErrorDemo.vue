<template>
  <div class="demo-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>加载状态和错误处理演示</span>
        </div>
      </template>

      <!-- 基础功能演示 -->
      <el-row :gutter="20" style="margin-bottom: 30px;">
        <el-col :span="12">
          <el-card>
            <template #header>
              <strong>加载状态演示</strong>
            </template>
            <div class="demo-section">
              <el-button @click="simulateLoading" :loading="loadingDemo">
                模拟加载 (3秒)
              </el-button>
              <el-button @click="simulateLongLoading" :loading="longLoadingDemo">
                模拟长加载 (8秒)
              </el-button>
              <el-button @click="simulateMultipleLoading">
                模拟多重加载
              </el-button>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card>
            <template #header>
              <strong>错误处理演示</strong>
            </template>
            <div class="demo-section">
              <el-button @click="simulateError" type="danger">
                模拟错误
              </el-button>
              <el-button @click="simulateWarning" type="warning">
                模拟警告
              </el-button>
              <el-button @click="simulateInfo" type="primary">
                模拟信息提示
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- API调用演示 -->
      <el-card style="margin-bottom: 30px;">
        <template #header>
          <strong>API调用演示</strong>
        </template>
        <div class="demo-section">
          <el-row :gutter="15">
            <el-col :span="6">
              <el-button 
                @click="fetchUserData" 
                :loading="userData.loading"
                type="primary"
                style="width: 100%;"
              >
                获取用户数据
              </el-button>
            </el-col>
            <el-col :span="6">
              <el-button 
                @click="fetchPermissionData" 
                :loading="permissionData.loading"
                type="success"
                style="width: 100%;"
              >
                获取权限数据
              </el-button>
            </el-col>
            <el-col :span="6">
              <el-button 
                @click="submitFormData" 
                :loading="formAction.loading"
                type="warning"
                style="width: 100%;"
              >
                提交表单数据
              </el-button>
            </el-col>
            <el-col :span="6">
              <el-button 
                @click="batchOperation" 
                :loading="batchAction.loading"
                type="danger"
                style="width: 100%;"
              >
                批量操作
              </el-button>
            </el-col>
          </el-row>

          <!-- 数据展示区域 -->
          <div v-if="userData.data" class="data-display">
            <h4>用户数据:</h4>
            <pre>{{ userData.data }}</pre>
          </div>
          
          <div v-if="permissionData.data" class="data-display">
            <h4>权限数据:</h4>
            <pre>{{ permissionData.data }}</pre>
          </div>
        </div>
      </el-card>

      <!-- 错误列表 -->
      <el-card>
        <template #header>
          <div class="errors-header">
            <strong>错误历史记录</strong>
            <el-button @click="clearErrors" size="small" type="danger">
              清除所有错误
            </el-button>
          </div>
        </template>
        <div class="errors-container">
          <div 
            v-for="error in errors" 
            :key="error.id"
            class="error-item"
            :class="`error-${error.type}`"
          >
            <div class="error-header">
              <el-tag :type="getErrorTagType(error.type)">
                {{ getErrorTypeName(error.type) }}
              </el-tag>
              <span class="error-time">
                {{ formatDate(error.timestamp) }}
              </span>
            </div>
            <div class="error-message">
              {{ error.message }}
            </div>
            <div v-if="error.code" class="error-code">
              错误代码: {{ error.code }}
            </div>
          </div>
          
          <div v-if="errors.length === 0" class="no-errors">
            <el-empty description="暂无错误记录" />
          </div>
        </div>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLoading } from '@/services/loadingService'
import { useErrorHandler } from '@/services/errorHandlingService'
import { useApiData, useApiAction, useBatchApiAction } from '@/composables/useApi'
import { api } from '@/api/httpClient'

// 基础演示状态
const loadingDemo = ref(false)
const longLoadingDemo = ref(false)

// 使用组合式API hooks
const userData = useApiData(
  () => api.get('/users/profile').then(res => res.data),
  {
    immediate: false,
    loadingMessage: '正在获取用户信息...',
    errorMessage: '获取用户信息失败'
  }
)

const permissionData = useApiData(
  () => api.get('/permissions/list').then(res => res.data),
  {
    immediate: false,
    loadingMessage: '正在获取权限列表...',
    errorMessage: '获取权限列表失败'
  }
)

const formAction = useApiAction(
  (formData: any) => api.post('/users/create', formData),
  {
    successMessage: '用户创建成功',
    errorMessage: '用户创建失败',
    loadingMessage: '正在创建用户...'
  }
)

const batchAction = useBatchApiAction(
  (items: any[]) => api.post('/permissions/batch-update', { items }),
  {
    batchSize: 5,
    successMessage: '批量权限更新完成',
    errorMessage: '批量权限更新失败'
  }
)

// 使用服务
const { showLoading, hideLoading } = useLoading()
const { errors, handleError, showWarning, showInfo, clearErrors } = useErrorHandler()

// 演示方法
const simulateLoading = async () => {
  loadingDemo.value = true
  showLoading('正在处理简单任务...')
  
  try {
    await new Promise(resolve => setTimeout(resolve, 3000))
    showInfo('简单任务完成')
  } catch (error) {
    handleError(error, '简单任务处理失败')
  } finally {
    loadingDemo.value = false
    hideLoading()
  }
}

const simulateLongLoading = async () => {
  longLoadingDemo.value = true
  showLoading('正在进行复杂计算...')
  
  try {
    await new Promise(resolve => setTimeout(resolve, 8000))
    showInfo('复杂计算完成')
  } catch (error) {
    handleError(error, '复杂计算失败')
  } finally {
    longLoadingDemo.value = false
    hideLoading()
  }
}

const simulateMultipleLoading = async () => {
  showLoading('步骤1: 初始化...')
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  showLoading('步骤2: 数据处理...')
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  showLoading('步骤3: 结果生成...')
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  showInfo('多重加载任务完成')
}

const simulateError = () => {
  handleError(new Error('这是一个模拟的系统错误'), '系统操作')
}

const simulateWarning = () => {
  showWarning('这是重要的警告信息，请注意查看')
}

const simulateInfo = () => {
  showInfo('这是普通的提示信息')
}

const fetchUserData = () => {
  userData.execute()
}

const fetchPermissionData = () => {
  permissionData.execute()
}

const submitFormData = () => {
  formAction.execute({
    name: '测试用户',
    email: 'test@example.com',
    role: 'user'
  })
}

const batchOperation = () => {
  const items = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    name: `权限${i + 1}`,
    code: `perm_${i + 1}`
  }))
  
  batchAction.execute(items)
}

// 工具方法
const getErrorTagType = (type: string) => {
  switch (type) {
    case 'error': return 'danger'
    case 'warning': return 'warning'
    case 'info': return 'info'
    default: return 'info'
  }
}

const getErrorTypeName = (type: string) => {
  switch (type) {
    case 'error': return '错误'
    case 'warning': return '警告'
    case 'info': return '信息'
    default: return '未知'
  }
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}
</script>

<style scoped>
.demo-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.demo-section {
  padding: 20px 0;
}

.demo-section .el-button {
  margin: 0 10px 10px 0;
}

.data-display {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

.data-display h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.data-display pre {
  margin: 0;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  overflow-x: auto;
}

.errors-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.errors-container {
  max-height: 400px;
  overflow-y: auto;
}

.error-item {
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 6px;
  border-left: 4px solid;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error-item.error-error {
  border-left-color: #f56c6c;
  background-color: #fef0f0;
}

.error-item.error-warning {
  border-left-color: #e6a23c;
  background-color: #fdf6ec;
}

.error-item.error-info {
  border-left-color: #409eff;
  background-color: #ecf5ff;
}

.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.error-time {
  font-size: 12px;
  color: #909399;
}

.error-message {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
  line-height: 1.5;
}

.error-code {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
}

.no-errors {
  text-align: center;
  padding: 30px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .demo-page {
    padding: 10px;
  }
  
  .demo-section .el-button {
    width: 100%;
    margin: 0 0 10px 0;
  }
  
  .error-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .error-time {
    align-self: flex-end;
  }
}
</style>