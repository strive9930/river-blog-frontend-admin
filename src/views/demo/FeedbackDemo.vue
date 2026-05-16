<template>
  <div class="feedback-demo">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>操作确认和反馈机制演示</span>
        </div>
      </template>

      <!-- 确认对话框演示 -->
      <el-card class="demo-section">
        <template #header>
          <strong>操作确认演示</strong>
        </template>
        
        <el-row :gutter="15">
          <el-col :span="6">
            <el-button @click="showBasicConfirm" type="primary" style="width: 100%;">
              基础确认
            </el-button>
          </el-col>
          <el-col :span="6">
            <el-button @click="showDeleteConfirm" type="danger" style="width: 100%;">
              删除确认
            </el-button>
          </el-col>
          <el-col :span="6">
            <el-button @click="showBatchConfirm" type="warning" style="width: 100%;">
              批量操作确认
            </el-button>
          </el-col>
          <el-col :span="6">
            <el-button @click="showDangerConfirm" type="danger" style="width: 100%;">
              危险操作确认
            </el-button>
          </el-col>
        </el-row>
      </el-card>

      <!-- 即时反馈演示 -->
      <el-card class="demo-section">
        <template #header>
          <strong>即时反馈演示</strong>
        </template>
        
        <el-row :gutter="15">
          <el-col :span="6">
            <el-button @click="showSuccessMessage" type="success" style="width: 100%;">
              成功消息
            </el-button>
          </el-col>
          <el-col :span="6">
            <el-button @click="showErrorMessage" type="danger" style="width: 100%;">
              错误消息
            </el-button>
          </el-col>
          <el-col :span="6">
            <el-button @click="showWarningMessage" type="warning" style="width: 100%;">
              警告消息
            </el-button>
          </el-col>
          <el-col :span="6">
            <el-button @click="showInfoMessage" type="primary" style="width: 100%;">
              信息消息
            </el-button>
          </el-col>
        </el-row>
        
        <div style="margin-top: 20px;">
          <el-button @click="showNotification" type="info">
            显示通知
          </el-button>
        </div>
      </el-card>

      <!-- 进度反馈演示 -->
      <el-card class="demo-section">
        <template #header>
          <strong>进度反馈演示</strong>
        </template>
        
        <div class="progress-demo">
          <el-button @click="showProgressFeedback" type="primary">
            显示进度反馈
          </el-button>
          
          <el-button @click="showLoadingFeedback" type="warning">
            显示加载反馈
          </el-button>
          
          <div v-if="progressInstance" class="progress-controls">
            <el-slider 
              v-model="progressValue" 
              :max="100" 
              @change="updateProgress"
              style="width: 300px; margin: 0 15px;"
            />
            <el-button @click="closeProgress" type="danger" size="small">
              关闭进度
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 组合操作演示 -->
      <el-card class="demo-section">
        <template #header>
          <strong>组合操作演示</strong>
        </template>
        
        <div class="combined-demo">
          <el-button @click="confirmAndExecuteDemo" type="primary">
            确认后执行操作
          </el-button>
          
          <el-button @click="batchOperationDemo" type="warning">
            批量操作演示
          </el-button>
          
          <div v-if="operationResult" class="result-display">
            <h4>操作结果:</h4>
            <pre>{{ operationResult }}</pre>
          </div>
        </div>
      </el-card>

      <!-- 反馈历史记录 -->
      <el-card>
        <template #header>
          <div class="history-header">
            <strong>反馈历史记录</strong>
            <el-button @click="clearHistory" size="small" type="danger">
              清除历史
            </el-button>
          </div>
        </template>
        
        <div class="history-container">
          <div 
            v-for="record in feedbackHistory" 
            :key="record.id"
            class="history-item"
            :class="`history-${record.type}`"
          >
            <div class="history-header">
              <el-tag :type="getHistoryTagType(record.type)">
                {{ getHistoryTypeName(record.type) }}
              </el-tag>
              <span class="history-time">
                {{ formatDate(record.timestamp) }}
              </span>
            </div>
            <div class="history-message">
              {{ record.message }}
            </div>
          </div>
          
          <div v-if="feedbackHistory.length === 0" class="empty-history">
            <el-empty description="暂无反馈记录" />
          </div>
        </div>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  useConfirmation, 
  useFeedback, 
  useOperationFeedback 
} from '@/services/feedbackService'

interface FeedbackRecord {
  id: string
  type: string
  message: string
  timestamp: number
}

const progressInstance = ref<InstanceType<typeof ElMessage> | null>(null)
const progressValue = ref(0)
const operationResult = ref('')
const feedbackHistory = ref<FeedbackRecord[]>([])

const { 
  showConfirm, 
  showDeleteConfirm, 
  showBatchConfirm, 
  showDangerConfirm 
} = useConfirmation()

const { 
  showSuccess, 
  showError, 
  showWarning, 
  showInfo, 
  showNotification,
  showProgress,
  updateProgress: updateProgressFeedback,
  closeProgress,
  showLoading
} = useFeedback()

const { confirmAndExecute, batchOperationFeedback } = useOperationFeedback()

// 确认对话框演示
const showBasicConfirm = async () => {
  const result = await showConfirm({
    title: '基础确认',
    message: '这是一个基础的确认对话框演示',
    type: 'info'
  })
  
  addToHistory('info', `基础确认: ${result ? '确认' : '取消'}`)
}

const showDeleteConfirm = async () => {
  const result = await showDeleteConfirm('测试数据')
  addToHistory('warning', `删除确认: ${result ? '确认删除' : '取消删除'}`)
}

const showBatchConfirm = async () => {
  const result = await showBatchConfirm(15, '批量更新')
  addToHistory('warning', `批量确认: ${result ? '确认执行' : '取消执行'}`)
}

const showDangerConfirm = async () => {
  const result = await showDangerConfirm(
    '重置系统配置',
    '此操作将清除所有自定义配置并恢复默认设置'
  )
  addToHistory('error', `危险确认: ${result ? '确认执行' : '取消执行'}`)
}

// 即时反馈演示
const showSuccessMessage = () => {
  showSuccess('操作成功完成！')
  addToHistory('success', '显示了成功消息')
}

const showErrorMessage = () => {
  showError('操作执行失败，请重试')
  addToHistory('error', '显示了错误消息')
}

const showWarningMessage = () => {
  showWarning('请注意，此操作可能会影响其他功能')
  addToHistory('warning', '显示了警告消息')
}

const showInfoMessage = () => {
  showInfo('系统将在5分钟后自动备份')
  addToHistory('info', '显示了信息消息')
}

const showNotification = () => {
  showNotification({
    title: '系统通知',
    message: '您有一条新的系统消息，请及时查看',
    type: 'info',
    duration: 5000
  })
  addToHistory('info', '显示了系统通知')
}

// 进度反馈演示
const showProgressFeedback = () => {
  progressInstance.value = showProgress({
    message: '正在处理任务...',
    percentage: 0
  })
  progressValue.value = 0
  addToHistory('info', '显示了进度反馈')
}

const showLoadingFeedback = () => {
  const loading = showLoading('数据加载中...')
  setTimeout(() => {
    closeProgress(loading)
    showSuccess('数据加载完成')
  }, 3000)
  addToHistory('info', '显示了加载反馈')
}

const updateProgress = (value: number) => {
  if (progressInstance.value) {
    updateProgressFeedback(progressInstance.value, {
      message: `处理进度: ${value}%`,
      percentage: value
    })
  }
}

const closeProgress = () => {
  if (progressInstance.value) {
    closeProgress(progressInstance.value)
    progressInstance.value = null
    addToHistory('info', '关闭了进度反馈')
  }
}

// 组合操作演示
const confirmAndExecuteDemo = async () => {
  const result = await confirmAndExecute(
    {
      title: '数据同步确认',
      message: '即将同步用户数据到远程服务器，预计耗时2分钟',
      type: 'warning'
    },
    async () => {
      // 模拟异步操作
      await new Promise(resolve => setTimeout(resolve, 2000))
      return { success: true, data: '同步完成' }
    },
    '数据同步成功完成',
    '数据同步失败'
  )
  
  operationResult.value = result ? JSON.stringify(result, null, 2) : '操作被取消'
  addToHistory('success', '执行了确认后操作')
}

const batchOperationDemo = async () => {
  const items = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `项目${i + 1}` }))
  
  const result = await batchOperationFeedback(
    items,
    '批量处理',
    async (batch, progressCallback) => {
      // 模拟批量处理
      await new Promise(resolve => setTimeout(resolve, 500))
      progressCallback(batch.length)
    },
    10
  )
  
  operationResult.value = `批量操作${result ? '成功' : '失败'}`
  addToHistory(result ? 'success' : 'error', `执行了批量操作: ${result ? '成功' : '失败'}`)
}

// 历史记录管理
const addToHistory = (type: string, message: string) => {
  feedbackHistory.value.unshift({
    id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    message,
    timestamp: Date.now()
  })
  
  // 限制历史记录数量
  if (feedbackHistory.value.length > 50) {
    feedbackHistory.value.pop()
  }
}

const clearHistory = () => {
  feedbackHistory.value = []
}

// 工具方法
const getHistoryTagType = (type: string) => {
  switch (type) {
    case 'success': return 'success'
    case 'error': return 'danger'
    case 'warning': return 'warning'
    case 'info': return 'info'
    default: return 'info'
  }
}

const getHistoryTypeName = (type: string) => {
  switch (type) {
    case 'success': return '成功'
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
.feedback-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.demo-section {
  margin-bottom: 25px;
}

.progress-demo {
  padding: 20px 0;
  text-align: center;
}

.progress-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
}

.combined-demo {
  padding: 20px 0;
  text-align: center;
}

.combined-demo .el-button {
  margin: 0 10px;
}

.result-display {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border-left: 4px solid #409eff;
  text-align: left;
}

.result-display h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.result-display pre {
  margin: 0;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.history-container {
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  padding: 12px 15px;
  margin-bottom: 10px;
  border-radius: 6px;
  border-left: 4px solid;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.history-item.history-success {
  border-left-color: #67c23a;
  background-color: #f0f9ff;
}

.history-item.history-error {
  border-left-color: #f56c6c;
  background-color: #fef0f0;
}

.history-item.history-warning {
  border-left-color: #e6a23c;
  background-color: #fdf6ec;
}

.history-item.history-info {
  border-left-color: #409eff;
  background-color: #ecf5ff;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-time {
  font-size: 12px;
  color: #909399;
}

.history-message {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.empty-history {
  text-align: center;
  padding: 30px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .feedback-demo {
    padding: 10px;
  }
  
  .progress-controls {
    flex-direction: column;
    gap: 10px;
  }
  
  .combined-demo .el-button {
    width: 100%;
    margin: 5px 0;
  }
  
  .history-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .history-time {
    align-self: flex-end;
  }
}

/* 自定义确认对话框样式 */
.danger-confirm :deep(.el-message-box__header) {
  background-color: #fef0f0;
  border-bottom: 1px solid #fde2e2;
}

.danger-confirm :deep(.el-message-box__content) {
  color: #f56c6c;
}
</style>