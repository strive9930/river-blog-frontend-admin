<template>
  <div class="enhanced-demo">
    <el-page-header 
      @back="$router.go(-1)" 
      title="返回"
      content="增强功能演示"
    />

    <div class="demo-container">
      <!-- 表单验证演示 -->
      <el-card class="demo-card">
        <template #header>
          <div class="card-header">
            <span>智能表单验证</span>
            <el-tag type="success">实时验证</el-tag>
          </div>
        </template>
        
        <el-form 
          ref="formRef" 
          :model="formData" 
          :rules="formRules"
          label-width="120px"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="用户名" prop="username">
                <el-input 
                  v-model="formData.username" 
                  placeholder="请输入用户名"
                  @blur="handleUsernameBlur"
                />
                <div v-if="usernameCheck.isChecking" class="checking-status">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  正在检查用户名...
                </div>
                <div v-else-if="usernameCheck.checkResults.username" class="check-result">
                  <el-icon :class="usernameCheck.checkResults.username.isValid ? 'success' : 'error'">
                    <SuccessFilled v-if="usernameCheck.checkResults.username.isValid" />
                    <CircleClose v-else />
                  </el-icon>
                  {{ usernameCheck.checkResults.username.message }}
                </div>
              </el-form-item>
            </el-col>
            
            <el-col :span="12">
              <el-form-item label="邮箱" prop="email">
                <el-input 
                  v-model="formData.email" 
                  placeholder="请输入邮箱"
                />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="密码" prop="password">
                <el-input 
                  v-model="formData.password" 
                  type="password"
                  placeholder="请输入密码"
                  show-password
                />
              </el-form-item>
            </el-col>
            
            <el-col :span="12">
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input 
                  v-model="formData.confirmPassword" 
                  type="password"
                  placeholder="请再次输入密码"
                  show-password
                />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="手机号" prop="phone">
            <el-input 
              v-model="formData.phone" 
              placeholder="请输入手机号"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              @click="handleSubmit"
              :loading="formValidation.isSubmitting"
            >
              提交表单
            </el-button>
            <el-button @click="handleReset">重置</el-button>
            <el-button @click="showValidationStatus">查看验证状态</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 批量操作演示 -->
      <el-card class="demo-card">
        <template #header>
          <div class="card-header">
            <span>批量操作</span>
            <el-tag type="warning">并发处理</el-tag>
          </div>
        </template>
        
        <div class="batch-demo">
          <div class="controls">
            <el-button 
              type="primary" 
              @click="startBatchOperation"
              :disabled="batchOps.isProcessing"
            >
              <el-icon><Upload /></el-icon>
              开始批量处理
            </el-button>
            
            <el-button 
              @click="cancelBatchOperation"
              :disabled="!batchOps.isProcessing"
            >
              <el-icon><Close /></el-icon>
              取消操作
            </el-button>
            
            <el-progress 
              v-if="batchOps.isProcessing"
              :percentage="Math.round(batchOps.progress)"
              :stroke-width="12"
              striped
              striped-flow
            />
          </div>
          
          <div class="stats">
            <el-descriptions :column="4" border>
              <el-descriptions-item label="总数量">{{ batchOps.totalCount }}</el-descriptions-item>
              <el-descriptions-item label="已处理">{{ batchOps.processedCount }}</el-descriptions-item>
              <el-descriptions-item label="进度">{{ Math.round(batchOps.progress) }}%</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="batchOps.isProcessing ? 'warning' : 'info'">
                  {{ batchOps.isProcessing ? '处理中' : '空闲' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </el-card>

      <!-- 数据管理演示 -->
      <el-card class="demo-card">
        <template #header>
          <div class="card-header">
            <span>高级数据管理</span>
            <el-tag type="primary">虚拟滚动</el-tag>
          </div>
        </template>
        
        <div class="data-management-demo">
          <div class="toolbar">
            <el-input 
              v-model="dataManager.filters.search" 
              placeholder="搜索用户..."
              style="width: 200px; margin-right: 10px;"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            
            <el-select 
              v-model="dataManager.sort.key" 
              placeholder="排序字段"
              style="width: 120px; margin-right: 10px;"
              @change="handleSortChange"
            >
              <el-option label="姓名" value="name" />
              <el-option label="年龄" value="age" />
              <el-option label="注册时间" value="registerTime" />
            </el-select>
            
            <el-select 
              v-model="dataManager.pagination.size" 
              placeholder="每页数量"
              style="width: 100px;"
              @change="handlePageSizeChange"
            >
              <el-option :label="10" :value="10" />
              <el-option :label="20" :value="20" />
              <el-option :label="50" :value="50" />
            </el-select>
          </div>
          
          <div class="table-container">
            <el-table 
              :data="dataManager.paginatedData"
              height="300"
              stripe
            >
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="name" label="姓名" />
              <el-table-column prop="email" label="邮箱" />
              <el-table-column prop="age" label="年龄" width="80" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'active' ? 'success' : 'warning'">
                    {{ row.status === 'active' ? '活跃' : '非活跃' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="registerTime" label="注册时间" width="180" />
            </el-table>
          </div>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="dataManager.pagination.page"
              :page-size="dataManager.pagination.size"
              :total="dataManager.pagination.total"
              layout="prev, pager, next, jumper, ->, total"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </el-card>

      <!-- 交互增强演示 -->
      <el-card class="demo-card">
        <template #header>
          <div class="card-header">
            <span>增强交互体验</span>
            <el-tag type="danger">动画效果</el-tag>
          </div>
        </template>
        
        <div class="interaction-demo">
          <div class="animation-controls">
            <el-button @click="triggerFadeInOut">淡入淡出</el-button>
            <el-button @click="triggerSlideIn">滑入效果</el-button>
            <el-button @click="triggerShake">抖动效果</el-button>
            <el-button @click="toggleTheme">切换主题</el-button>
          </div>
          
          <div ref="animatedBox" class="animated-box">
            <div class="box-content">
              <el-icon size="30"><MagicStick /></el-icon>
              <p>动画演示区域</p>
            </div>
          </div>
          
          <div class="keyboard-shortcuts">
            <h4>可用快捷键:</h4>
            <ul>
              <li v-for="shortcut in keyboard.getActiveShortcuts" :key="shortcut.key">
                <kbd>{{ formatShortcut(shortcut) }}</kbd> - {{ shortcut.description }}
              </li>
            </ul>
          </div>
        </div>
      </el-card>

      <!-- 高级功能演示 -->
      <el-card class="demo-card">
        <template #header>
          <div class="card-header">
            <span>企业级功能</span>
            <el-tag type="success">数据审计</el-tag>
          </div>
        </template>
        
        <div class="advanced-features-demo">
          <el-tabs>
            <el-tab-pane label="操作审计" name="audit">
              <div class="audit-controls">
                <el-button @click="generateMockAuditLogs">生成测试日志</el-button>
                <el-button @click="exportAuditLogs">导出日志</el-button>
                <el-button @click="clearAuditLogs" type="danger">清空日志</el-button>
              </div>
              
              <el-table :data="auditTrail.auditLogs.slice(0, 10)" max-height="300">
                <el-table-column prop="timestamp" label="时间" width="180">
                  <template #default="{ row }">
                    {{ formatDate(row.timestamp) }}
                  </template>
                </el-table-column>
                <el-table-column prop="userName" label="用户" width="120" />
                <el-table-column prop="action" label="操作" width="120" />
                <el-table-column prop="resource" label="资源" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
                      {{ row.status === 'success' ? '成功' : '失败' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
            
            <el-tab-pane label="版本控制" name="version">
              <div class="version-controls">
                <el-button @click="saveCurrentVersion">保存当前版本</el-button>
                <el-select v-model="selectedVersion" placeholder="选择版本">
                  <el-option 
                    v-for="version in versionControl.getVersions()" 
                    :key="version.version"
                    :label="`版本 ${version.version} - ${formatDate(version.timestamp)}`"
                    :value="version.version"
                  />
                </el-select>
                <el-button @click="restoreSelectedVersion" :disabled="!selectedVersion">恢复版本</el-button>
              </div>
              
              <div v-if="currentData" class="current-data">
                <h4>当前数据:</h4>
                <pre>{{ JSON.stringify(currentData, null, 2) }}</pre>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { 
  Loading, SuccessFilled, CircleClose, Upload, Close, 
  Search, MagicStick 
} from '@element-plus/icons-vue'
import {
  useFormValidation,
  useAsyncValidation,
  useBatchOperations,
  useDataManager,
  useAnimations,
  useKeyboardShortcuts,
  useTheme,
  useAuditTrail,
  useVersionControl
} from '@/composables'

// 表单验证演示
const formRef = ref<FormInstance>()
const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: ''
})

const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]{3,20}$/, message: '用户名格式不正确', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== formData.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const formValidation = useFormValidation(formData, formRules, {
  mode: 'onChange',
  debounce: 500
})

const usernameCheck = useAsyncValidation()

const handleUsernameBlur = async () => {
  if (formData.username) {
    await usernameCheck.checkField('username', async () => {
      // 模拟异步检查
      await new Promise(resolve => setTimeout(resolve, 1000))
      const isTaken = formData.username === 'admin' || formData.username === 'test'
      return {
        isValid: !isTaken,
        message: isTaken ? '用户名已被占用' : '用户名可用'
      }
    })
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      ElMessage.success('表单提交成功!')
      console.log('Form data:', formData)
    } else {
      ElMessage.error('请检查表单填写是否正确')
    }
  })
}

const handleReset = () => {
  formRef.value?.resetFields()
  formValidation.resetForm()
}

const showValidationStatus = () => {
  ElMessageBox.alert(`
    表单有效性: ${formValidation.isValid.value ? '有效' : '无效'}
    是否脏数据: ${formValidation.isDirty.value ? '是' : '否'}
    提交次数: ${formValidation.submitCount.value}
    错误数量: ${formValidation.errors.value.length}
  `, '验证状态')
}

// 批量操作演示
const batchOps = useBatchOperations()
const batchData = ref(Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `项目${i + 1}` })))

const startBatchOperation = async () => {
  await batchOps.batchOperation(
    batchData.value,
    async (item) => {
      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100))
      if (Math.random() < 0.1) {
        throw new Error('处理失败')
      }
    },
    {
      batchSize: 5,
      concurrency: 3,
      retryCount: 2,
      onSuccess: (item) => {
        console.log(`成功处理: ${item.name}`)
      },
      onError: (item, error) => {
        console.error(`处理失败: ${item.name}`, error)
      },
      onComplete: (result) => {
        console.log('批量操作完成:', result)
      }
    }
  )
}

const cancelBatchOperation = () => {
  batchOps.cancelOperation()
}

// 数据管理演示
const mockData = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `用户${i + 1}`,
  email: `user${i + 1}@example.com`,
  age: 18 + (i % 50),
  status: i % 3 === 0 ? 'inactive' : 'active',
  registerTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
}))

const dataManager = useDataManager(mockData)
dataManager.filters.search = ''

// 交互增强演示
const animations = useAnimations()
const keyboard = useKeyboardShortcuts()
const theme = useTheme()
const animatedBox = ref<HTMLElement | null>(null)

const triggerFadeInOut = async () => {
  if (animatedBox.value) {
    await animations.fadeInOut(animatedBox.value, { duration: 1000 })
  }
}

const triggerSlideIn = async () => {
  if (animatedBox.value) {
    await animations.slideIn(animatedBox.value, 'left', { duration: 800 })
  }
}

const triggerShake = async () => {
  if (animatedBox.value) {
    await animations.shake(animatedBox.value, 10, { duration: 600 })
  }
}

const toggleTheme = () => {
  theme.toggleTheme()
}

const formatShortcut = (shortcut: any) => {
  const parts = []
  if (shortcut.ctrl) parts.push('Ctrl')
  if (shortcut.shift) parts.push('Shift')
  if (shortcut.alt) parts.push('Alt')
  parts.push(shortcut.key.toUpperCase())
  return parts.join('+')
}

// 高级功能演示
const auditTrail = useAuditTrail()
const versionControl = useVersionControl()
const currentData = ref({ name: '测试数据', value: '初始值' })
const selectedVersion = ref<number | null>(null)

const generateMockAuditLogs = () => {
  const actions = ['创建', '更新', '删除', '查看']
  const resources = ['用户', '角色', '权限', '菜单']
  
  for (let i = 0; i < 20; i++) {
    auditTrail.logAction(
      actions[Math.floor(Math.random() * actions.length)],
      resources[Math.floor(Math.random() * resources.length)],
      {
        userId: 'user-' + Math.floor(Math.random() * 100),
        userName: '测试用户' + Math.floor(Math.random() * 100),
        status: Math.random() > 0.1 ? 'success' : 'failed'
      }
    )
  }
  ElMessage.success('已生成测试日志')
}

const exportAuditLogs = () => {
  auditTrail.exportLogs('json')
}

const clearAuditLogs = async () => {
  await ElMessageBox.confirm('确定要清空所有审计日志吗？', '确认操作')
  auditTrail.clearLogs()
  ElMessage.success('审计日志已清空')
}

const saveCurrentVersion = () => {
  const version = versionControl.saveVersion(currentData.value, {
    userId: 'current-user',
    userName: '当前用户',
    comment: '手动保存版本'
  })
  ElMessage.success(`版本 ${version} 保存成功`)
}

const restoreSelectedVersion = () => {
  if (selectedVersion.value) {
    const restored = versionControl.restoreVersion(selectedVersion.value)
    if (restored) {
      currentData.value = restored
      ElMessage.success('版本恢复成功')
    }
  }
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 数据管理方法
const handleSortChange = (key: string) => {
  dataManager.setSort(key as any, 'asc')
}

const handlePageSizeChange = (size: number) => {
  dataManager.setPageSize(size)
}

const handlePageChange = (page: number) => {
  dataManager.setPage(page)
}

// 注册快捷键
onMounted(() => {
  keyboard.registerShortcut({
    key: 's',
    ctrl: true,
    handler: () => ElMessage.info('保存快捷键触发'),
    description: '保存当前内容'
  })

  keyboard.registerShortcut({
    key: 'z',
    ctrl: true,
    handler: () => ElMessage.info('撤销快捷键触发'),
    description: '撤销上一步操作'
  })

  keyboard.registerShortcut({
    key: '/',
    handler: () => {
      const searchInput = document.querySelector('input[placeholder*="搜索"]') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
      }
    },
    description: '聚焦搜索框'
  })
})

onUnmounted(() => {
  keyboard.unregisterShortcut('s', { ctrl: true })
  keyboard.unregisterShortcut('z', { ctrl: true })
  keyboard.unregisterShortcut('/')
})
</script>

<style scoped>
.enhanced-demo {
  padding: 20px;
}

.demo-container {
  max-width: 1200px;
  margin: 0 auto;
}

.demo-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checking-status {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 5px;
}

.check-result {
  margin-top: 5px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.check-result .success {
  color: #67c23a;
}

.check-result .error {
  color: #f56c6c;
}

.batch-demo .controls {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.stats {
  margin-top: 20px;
}

.data-management-demo .toolbar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.table-container {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
}

.interaction-demo {
  text-align: center;
}

.animation-controls {
  margin-bottom: 30px;
}

.animated-box {
  width: 200px;
  height: 150px;
  margin: 0 auto 30px;
  background: linear-gradient(45deg, #409eff, #64b5f6);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: all 0.3s ease;
}

.box-content {
  text-align: center;
}

.box-content p {
  margin: 10px 0 0 0;
  font-size: 14px;
}

.keyboard-shortcuts {
  margin-top: 30px;
  text-align: left;
}

.keyboard-shortcuts ul {
  list-style: none;
  padding: 0;
}

.keyboard-shortcuts li {
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

kbd {
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 3px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 12px;
}

.advanced-features-demo {
  min-height: 300px;
}

.audit-controls, .version-controls {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.current-data {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.current-data pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>