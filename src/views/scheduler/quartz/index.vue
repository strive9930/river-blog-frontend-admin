<template>
  <div class="scheduler-container">
    <!-- ===== 调度器概览卡片 ===== -->
    <el-card shadow="never" class="overview-card">
      <div class="overview-row">
        <div class="overview-item">
          <el-icon :size="28" :color="schedulerInfo.status === 'Running' ? '#67c23a' : '#f56c6c'"><Cpu /></el-icon>
          <div>
            <div class="overview-label">调度器</div>
            <div class="overview-value">{{ schedulerInfo.schedulerName || '--' }}</div>
          </div>
        </div>
        <div class="overview-item">
          <div>
            <div class="overview-label">状态</div>
            <el-tag :type="schedulerInfo.status === 'Running' ? 'success' : schedulerInfo.status === 'Standby' ? 'warning' : 'danger'" effect="dark" size="small">
              {{ schedulerInfo.status === 'Running' ? '运行中' : schedulerInfo.status === 'Standby' ? '待机' : '已关闭' }}
            </el-tag>
          </div>
        </div>
        <div class="overview-item">
          <div>
            <div class="overview-label">任务数</div>
            <div class="overview-value">{{ schedulerInfo.jobCount ?? '--' }}</div>
          </div>
        </div>
        <div class="overview-item">
          <div>
            <div class="overview-label">触发器数</div>
            <div class="overview-value">{{ schedulerInfo.triggerCount ?? '--' }}</div>
          </div>
        </div>
        <div class="overview-item">
          <div>
            <div class="overview-label">分组</div>
            <div class="overview-value">{{ (schedulerInfo.jobGroupNames || []).join(', ') || '--' }}</div>
          </div>
        </div>
        <div class="overview-actions">
          <el-popconfirm title="确认暂停所有任务？" @confirm="handlePauseAll">
            <template #reference><el-button type="warning" size="small" :disabled="schedulerInfo.status !== 'Running'">全局暂停</el-button></template>
          </el-popconfirm>
          <el-popconfirm title="确认恢复所有任务？" @confirm="handleResumeAll">
            <template #reference><el-button type="success" size="small" :disabled="schedulerInfo.status === 'Running'">恢复全局任务</el-button></template>
          </el-popconfirm>
          <el-popconfirm title="确认启动调度器？各任务保持原有状态" @confirm="handleStart">
            <template #reference><el-button type="primary" size="small" :disabled="schedulerInfo.status !== 'Standby'">启动</el-button></template>
          </el-popconfirm>
          <el-popconfirm title="确认关闭调度器？进入待机模式，不再触发新任务" @confirm="handleShutdown">
            <template #reference><el-button type="danger" size="small" :disabled="schedulerInfo.status !== 'Running'">关闭</el-button></template>
          </el-popconfirm>
        </div>
      </div>
    </el-card>

    <!-- ===== 操作栏 ===== -->
    <el-card shadow="never" class="action-card">
      <div class="action-row">
        <div class="action-left">
          <el-button type="success" icon="Plus" @click="openCreateDialog">新建任务</el-button>
          <el-dropdown v-if="selectedJobs.length > 0" trigger="click" style="margin-left: 10px;">
            <el-button type="primary">
              批量操作 ({{ selectedJobs.length }}) <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleBatchPause"><el-icon color="#e6a23c"><VideoPause /></el-icon>批量暂停</el-dropdown-item>
                <el-dropdown-item @click="handleBatchResume"><el-icon color="#67c23a"><RefreshRight /></el-icon>批量恢复</el-dropdown-item>
                <el-dropdown-item divided @click="handleBatchDelete"><el-icon color="#f56c6c"><Delete /></el-icon>批量删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="action-right">
          <el-select v-model="filterGroup" placeholder="按分组筛选" clearable style="width: 150px; margin-right: 8px;" @change="loadData">
            <el-option v-for="g in groupOptions" :key="g" :label="g" :value="g" />
          </el-select>
          <el-select v-model="filterState" placeholder="按状态筛选" clearable style="width: 130px; margin-right: 8px;" @change="loadData">
            <el-option label="运行中" value="Normal" />
            <el-option label="已暂停" value="Paused" />
            <el-option label="异常" value="Error" />
            <el-option label="阻塞" value="Blocked" />
          </el-select>
          <span style="font-size: 13px; color: #606266; margin-right: 8px;">自动刷新</span>
          <el-switch v-model="autoRefresh" @change="toggleAutoRefresh" style="margin-right: 12px;" />
          <el-button type="primary" icon="Refresh" :loading="loading" @click="loadData">刷新</el-button>
        </div>
      </div>
    </el-card>

    <!-- ===== 任务列表 ===== -->
    <el-card shadow="never" class="table-card">
      <el-table
        v-loading="loading && !autoRefresh"
        :data="jobList"
        border stripe style="width: 100%"
        :header-cell-style="{ background: '#f8f9fa', color: '#333', fontWeight: 'bold' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="45" />

        <el-table-column label="任务标识" min-width="200">
          <template #default="{ row }">
            <div class="job-name-cell">
              <span class="job-name">{{ row.jobName }}</span>
              <span class="job-group">
                {{ row.jobGroup }}
                <el-tag v-if="row.jobType" size="small" type="info" effect="plain" style="margin-left: 4px;">{{ row.jobType }}</el-tag>
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="任务说明" min-width="160" show-overflow-tooltip />

        <el-table-column label="触发规则" width="180" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.triggerType === 'Cron'" type="info" effect="light" class="cron-tag">{{ row.cronExpression }}</el-tag>
            <el-tag v-else type="warning" effect="light">每 {{ row.repeatInterval }}s</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="健康状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.state === 'Normal'" type="success" effect="dark" size="small">运行中</el-tag>
            <el-tag v-else-if="row.state === 'Paused'" type="warning" effect="dark" size="small">已暂停</el-tag>
            <el-tag v-else-if="row.state === 'Error'" type="danger" effect="dark" size="small">异常</el-tag>
            <el-tag v-else-if="row.state === 'Blocked'" type="info" effect="dark" size="small">阻塞</el-tag>
            <el-tag v-else type="info" size="small">{{ row.state }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="调度时间" width="200">
          <template #default="{ row }">
            <div class="timeline-cell">
              <div class="time-row"><span class="time-label">上次:</span><span class="time-val">{{ formatTime(row.previousFireTime) }}</span></div>
              <div class="time-row next-time"><span class="time-label">下次:</span><span class="time-val font-bold">{{ formatTime(row.nextFireTime) }}</span></div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="340" align="center" fixed="right">
          <template #default="{ row }">
            <el-popconfirm title="立即执行一次？" @confirm="handleTrigger(row)">
              <template #reference><el-button type="primary" link icon="VideoPlay" :disabled="loading">触发</el-button></template>
            </el-popconfirm>
            <el-popconfirm v-if="row.state === 'Normal'" title="暂停？" @confirm="handlePause(row)">
              <template #reference><el-button type="warning" link icon="VideoPause">暂停</el-button></template>
            </el-popconfirm>
            <el-popconfirm v-if="row.state === 'Paused'" title="恢复？" @confirm="handleResume(row)">
              <template #reference><el-button type="success" link icon="RefreshRight">恢复</el-button></template>
            </el-popconfirm>
            <el-divider direction="vertical" />
            <el-button type="info" link icon="Document" @click="openLogDrawer(row)">日志</el-button>
            <el-button type="primary" link icon="Edit" @click="openEditDialog(row)">编辑</el-button>
            <el-popconfirm title="删除后不可恢复！" @confirm="handleDelete(row)">
              <template #reference><el-button type="danger" link icon="Delete">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- ===== 日志抽屉 ===== -->
    <el-drawer v-model="logDrawerVisible" :title="`执行日志 - ${currentLogJob}`" size="450px">
      <div v-loading="logLoading" style="min-height: 200px; padding-top: 10px;">
        <el-timeline v-if="logList.length > 0">
          <el-timeline-item
            v-for="(log, index) in logList" :key="index"
            :timestamp="formatTime(log.fireTime || log.FireTime)"
            :type="(log.isSuccess ?? log.IsSuccess) ? 'success' : 'danger'"
            :hollow="!(log.isSuccess ?? log.IsSuccess)"
          >
            <div class="log-content">
              <div class="log-status">
                <span v-if="log.isSuccess ?? log.IsSuccess" style="color: #67c23a;">成功 ({{ log.runTimeMs ?? log.RunTimeMs }}ms)</span>
                <span v-else style="color: #f56c6c; font-weight: bold;">失败 ({{ log.runTimeMs ?? log.RunTimeMs }}ms)</span>
              </div>
              <div v-if="!(log.isSuccess ?? log.IsSuccess) && (log.errorMessage ?? log.ErrorMessage)" class="log-error-box">{{ log.errorMessage ?? log.ErrorMessage }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无执行记录" :image-size="60" />
        <div v-if="logTotalCount > 0" class="log-pagination">
          <el-pagination v-model:current-page="logCurrentPage" :page-size="logPageSize" :total="logTotalCount" layout="total, prev, pager, next" small @current-change="handleLogPageChange" />
        </div>
      </div>
    </el-drawer>

    <!-- ===== 新建/编辑任务弹窗 ===== -->
    <el-dialog v-model="jobDialogVisible" :title="isEditMode ? '编辑调度任务' : '新建调度任务'" width="720px" destroy-on-close>
      <el-steps :active="currentStep" finish-status="success" align-center style="margin-bottom: 24px;">
        <el-step title="基本信息" icon="Document" />
        <el-step title="调度规则" icon="Clock" />
        <el-step title="执行动作" icon="Promotion" />
      </el-steps>

      <el-form :model="jobForm" :rules="jobRules" ref="jobFormRef" label-width="110px">
        <div v-show="currentStep === 0">
          <div class="step-section">
            <div class="section-header">
              <el-icon class="section-icon" color="#409eff"><Document /></el-icon>
              <span class="section-title">任务基本信息</span>
            </div>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="任务名称" prop="jobName">
                  <el-input v-model="jobForm.jobName" :disabled="isEditMode" placeholder="例如: SyncBlogViews" prefix-icon="EditPen" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="任务分组" prop="jobGroup">
                  <el-input v-model="jobForm.jobGroup" :disabled="isEditMode" placeholder="BlogJobs" prefix-icon="FolderOpened" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="任务描述">
              <el-input v-model="jobForm.description" type="textarea" :rows="2" placeholder="简要说明该任务的用途..." />
            </el-form-item>
          </div>
        </div>

        <div v-show="currentStep === 1">
          <div class="step-section">
            <div class="section-header">
              <el-icon class="section-icon" color="#e6a23c"><Clock /></el-icon>
              <span class="section-title">触发调度规则</span>
            </div>
            <el-form-item label="触发类型">
              <el-radio-group v-model="jobForm.triggerType" :disabled="isEditMode">
                <el-radio-button label="cron"><el-icon><Clock /></el-icon> Cron</el-radio-button>
                <el-radio-button label="simple"><el-icon><Timer /></el-icon> 固定间隔</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <template v-if="jobForm.triggerType === 'cron'">
              <el-form-item label="Cron 表达式" prop="cronExpression">
                <el-input v-model="jobForm.cronExpression" readonly placeholder="点击打开可视化配置器" class="cron-input" @click="cronPickerVisible = true">
                  <template #prefix><el-icon><Clock /></el-icon></template>
                  <template #suffix><span class="cron-hint">点击配置</span></template>
                </el-input>
              </el-form-item>
              <div class="cron-tip">
                <el-icon color="#909399"><InfoFilled /></el-icon>
                <span>Cron 格式：秒 分 时 日 月 周，例如 <code>0 0/5 * * * ?</code> 表示每 5 分钟</span>
              </div>
            </template>
            <template v-if="jobForm.triggerType === 'simple'">
              <el-row :gutter="16">
                <el-col :span="8">
                  <el-form-item label="间隔秒数" prop="intervalSeconds">
                    <el-input-number v-model="jobForm.intervalSeconds" :min="1" :max="999999" controls-position="right" style="width: 100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="重复次数">
                    <el-input-number v-model="jobForm.repeatCount" :min="-1" :max="999999" controls-position="right" style="width: 100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="首次延迟">
                    <el-input-number v-model="jobForm.startDelaySeconds" :min="0" :max="999999" controls-position="right" style="width: 100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="cron-tip">
                <el-icon color="#909399"><InfoFilled /></el-icon>
                <span>重复次数 <code>-1</code> = 无限重复，<code>0</code> = 仅执行一次</span>
              </div>
            </template>
            <div class="schedule-preview">
              <el-tag effect="dark" :type="jobForm.triggerType === 'cron' ? 'primary' : 'warning'" size="large">
                <el-icon style="margin-right: 4px;"><Clock /></el-icon>
                <template v-if="jobForm.triggerType === 'cron'">{{ jobForm.cronExpression || '请配置 Cron' }}</template>
                <template v-else>每 {{ jobForm.intervalSeconds }}s 执行一次 {{ jobForm.repeatCount < 0 ? '(无限)' : jobForm.repeatCount > 0 ? '(' + jobForm.repeatCount + '次)' : '(仅一次)' }}</template>
              </el-tag>
            </div>
          </div>
        </div>

        <div v-show="currentStep === 2">
          <div class="step-section">
            <div class="section-header">
              <el-icon class="section-icon" color="#67c23a"><Promotion /></el-icon>
              <span class="section-title">HTTP 请求配置</span>
            </div>
            <el-form-item label="请求地址" prop="requestUrl">
              <el-input v-model="jobForm.requestUrl" placeholder="/api/blog/internal/sync">
                <template #prepend>
                  <el-select v-model="jobForm.httpMethod" style="width: 100px;">
                    <el-option label="GET" value="GET" /><el-option label="POST" value="POST" />
                    <el-option label="PUT" value="PUT" /><el-option label="DELETE" value="DELETE" />
                  </el-select>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="请求头">
              <el-input type="textarea" :rows="2" v-model="jobForm.headers" placeholder='{"Authorization": "Bearer xxx"}' />
              <div class="field-tip">可选，JSON 格式的 HTTP 请求头</div>
            </el-form-item>
            <el-form-item label="请求体" v-if="['POST','PUT','PATCH'].includes(jobForm.httpMethod)">
              <el-input type="textarea" :rows="3" v-model="jobForm.body" placeholder='{"key": "value"}' />
              <div class="field-tip">可选，POST/PUT/PATCH 的 JSON Body</div>
            </el-form-item>
          </div>
          <div class="step-section" style="margin-top: 16px;">
            <div class="section-header">
              <el-icon class="section-icon" color="#909399"><Setting /></el-icon>
              <span class="section-title">自定义参数 <span style="font-weight: normal; font-size: 12px; color: #909399;">(JobDataMap，可选)</span></span>
              <el-button type="primary" link icon="Plus" size="small" @click="jobForm.extraParams.push({ key: '', value: '' })">添加</el-button>
            </div>
            <div v-if="jobForm.extraParams.length === 0" class="empty-params">
              <span style="color: #c0c4cc;">暂无自定义参数，点击上方「添加」按钮</span>
            </div>
            <div v-for="(item, idx) in jobForm.extraParams" :key="idx" class="param-row">
              <el-input v-model="item.key" placeholder="参数名" style="flex: 1;"><template #prepend>Key</template></el-input>
              <el-input v-model="item.value" placeholder="参数值" style="flex: 2;"><template #prepend>Val</template></el-input>
              <el-button type="danger" icon="Delete" circle size="small" @click="jobForm.extraParams.splice(idx, 1)" />
            </div>
          </div>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="jobDialogVisible = false" icon="Close">取消</el-button>
          <el-button v-if="currentStep > 0" @click="currentStep--" icon="ArrowLeft">上一步</el-button>
          <el-button v-if="currentStep < 2" type="primary" @click="nextStep" icon="ArrowRight">下一步</el-button>
          <el-button v-if="currentStep === 2" type="primary" :loading="submitLoading" @click="submitJob" icon="Check">
            {{ isEditMode ? '保存修改' : '确认创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ===== Cron 选择器弹窗 ===== -->
    <el-dialog v-model="cronPickerVisible" title="Cron 调度规则配置" width="700px" :append-to-body="true">
      <Vue3CronEp v-model="cronPickerValue" locale="zh-CN" />
      <template #footer>
        <div class="cron-picker-footer">
          <div class="cron-preview">当前: <el-tag type="primary" effect="dark" class="cron-tag">{{ cronPickerValue }}</el-tag></div>
          <div>
            <el-button @click="cronPickerVisible = false">取消</el-button>
            <el-button type="primary" @click="jobForm.cronExpression = cronPickerValue; cronPickerVisible = false">确认</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Cpu, ArrowDown } from '@element-plus/icons-vue'
import { Vue3CronEp } from 'vue3-cron-ep'
import 'vue3-cron-ep/dist/index.css'
import {
  getSchedulerInfo, pauseAll, resumeAll, shutdownScheduler, startScheduler,
  getJobList, createJob, updateJob, deleteJob,
  triggerJobNow, pauseJob, resumeJob, getJobLogs,
  batchPauseJobs, batchResumeJobs, batchDeleteJobs
} from '@/api/quartz'

// ======================== 调度器概览 ========================
const schedulerInfo = ref({ schedulerName: '', status: '', jobCount: 0, triggerCount: 0, jobGroupNames: [] })
const groupOptions = ref([])

const loadSchedulerInfo = async () => {
  try {
    const res = await getSchedulerInfo()
    const body = res?.succeeded !== undefined ? res : res?.data
    schedulerInfo.value = body?.data || body?.Data || {}
    groupOptions.value = schedulerInfo.value.jobGroupNames || []
  } catch { /* */ }
}

const handlePauseAll = async () => { await pauseAll(); ElMessage.warning('已全局暂停'); loadData(); loadSchedulerInfo() }
const handleResumeAll = async () => { await resumeAll(); ElMessage.success('已恢复全局任务'); loadData(); loadSchedulerInfo() }
const handleShutdown = async () => { await shutdownScheduler(); ElMessage.error('调度器已关闭'); loadSchedulerInfo() }
const handleStart = async () => { await startScheduler(); ElMessage.success("调度器已启动"); loadSchedulerInfo() }

// ======================== 任务列表 ========================
const loading = ref(false)
const jobList = ref([])
const autoRefresh = ref(false)
let refreshTimer = null
const filterGroup = ref('')
const filterState = ref('')
const selectedJobs = ref([])

const loadData = async () => {
  if (!autoRefresh.value) loading.value = true
  try {
    const params = {}
    if (filterGroup.value) params.group = filterGroup.value
    if (filterState.value) params.state = filterState.value
    const res = await getJobList(params)
    const body = res?.succeeded !== undefined ? res : res?.data
    const list = body?.data || body?.Data || []
    jobList.value = Array.isArray(list) ? list : []
  } catch {
    if (!autoRefresh.value) ElMessage.error('获取调度数据失败')
  } finally { loading.value = false }
}

const toggleAutoRefresh = (val) => {
  if (val) {
    ElMessage.success('已开启自动刷新')
    refreshTimer = setInterval(() => { loadData(); loadSchedulerInfo() }, 5000)
  } else { clearInterval(refreshTimer); refreshTimer = null }
}

const handleSelectionChange = (rows) => { selectedJobs.value = rows }

// ======================== 单个操作 ========================
const handleTrigger = async (row) => { await triggerJobNow(row.jobName, row.jobGroup); ElMessage.success('已触发'); loadData() }
const handlePause = async (row) => { await pauseJob(row.jobName, row.jobGroup); ElMessage.warning('已暂停'); loadData() }
const handleResume = async (row) => { await resumeJob(row.jobName, row.jobGroup); ElMessage.success('已恢复'); loadData() }
const handleDelete = async (row) => { await deleteJob(row.jobName, row.jobGroup); ElMessage.success('已删除'); loadData() }

// ======================== 批量操作 ========================
const toJobKeys = () => selectedJobs.value.map(r => ({ jobName: r.jobName, jobGroup: r.jobGroup }))
const handleBatchPause = async () => { const r = await batchPauseJobs(toJobKeys()); ElMessage.success(r?.data?.message || r?.message || '批量暂停完成'); loadData() }
const handleBatchResume = async () => { const r = await batchResumeJobs(toJobKeys()); ElMessage.success(r?.data?.message || r?.message || '批量恢复完成'); loadData() }
const handleBatchDelete = async () => { const r = await batchDeleteJobs(toJobKeys()); ElMessage.success(r?.data?.message || r?.message || '批量删除完成'); loadData() }

// ======================== 日志抽屉 ========================
const logDrawerVisible = ref(false)
const currentLogJob = ref('')
const logList = ref([])
const logLoading = ref(false)
const logCurrentPage = ref(1)
const logPageSize = ref(20)
const logTotalCount = ref(0)

const openLogDrawer = async (row) => {
  currentLogJob.value = row.jobName; logCurrentPage.value = 1
  logDrawerVisible.value = true; logList.value = []; await fetchLogs()
}
const fetchLogs = async () => {
  logLoading.value = true
  try {
    const res = await getJobLogs(currentLogJob.value, logCurrentPage.value, logPageSize.value)
    const body = res?.succeeded !== undefined ? res : res?.data
    logList.value = body?.data || body?.Data || []
    logTotalCount.value = body?.totalCount || body?.TotalCount || 0
  } catch { ElMessage.error('读取日志失败') } finally { logLoading.value = false }
}
const handleLogPageChange = (page) => { logCurrentPage.value = page; fetchLogs() }

// ======================== 新建/编辑弹窗 ========================
const jobDialogVisible = ref(false)
const isEditMode = ref(false)
const submitLoading = ref(false)
const jobFormRef = ref(null)

const defaultForm = () => ({
  jobName: '', jobGroup: 'BlogJobs', description: '',
  triggerType: 'cron', cronExpression: '',
  intervalSeconds: 60, repeatCount: -1, startDelaySeconds: 0,
  httpMethod: 'POST', requestUrl: '', headers: '', body: '',
  extraParams: []
})
const jobForm = ref(defaultForm())

const jobRules = {
  jobName: [{ required: true, message: '不能为空', trigger: 'blur' }],
  requestUrl: [{ required: true, message: '不能为空', trigger: 'blur' }],
  cronExpression: [{ required: true, message: '请配置 Cron', trigger: 'change' }],
  intervalSeconds: [{ required: true, message: '不能为空', trigger: 'blur' }]
}

const openCreateDialog = () => { isEditMode.value = false; jobForm.value = defaultForm(); currentStep.value = 0; jobDialogVisible.value = true }
const nextStep = async () => {
  if (currentStep.value === 0 && jobFormRef.value) {
    try { await jobFormRef.value.validateField(['jobName', 'jobGroup']); currentStep.value++ } catch {}
  } else if (currentStep.value === 1) {
    if (jobForm.value.triggerType === 'cron' && !jobForm.value.cronExpression) { ElMessage.warning('请配置 Cron 表达式'); return }
    if (jobForm.value.triggerType === 'simple' && (!jobForm.value.intervalSeconds || jobForm.value.intervalSeconds < 1)) { ElMessage.warning('请填写间隔秒数'); return }
    currentStep.value++
  }
}

const openEditDialog = async (row) => {
  isEditMode.value = true
  jobForm.value = {
    jobName: row.jobName, jobGroup: row.jobGroup, description: row.description || '',
    triggerType: row.triggerType === 'Simple' ? 'simple' : 'cron',
    cronExpression: row.cronExpression || '',
    intervalSeconds: row.repeatInterval || 60, repeatCount: row.repeatCount ?? -1, startDelaySeconds: 0,
    httpMethod: 'POST', requestUrl: '', headers: '', body: '', extraParams: []
  }
  jobDialogVisible.value = true
}

const submitJob = async () => {
  if (!jobFormRef.value) return
  try { await jobFormRef.value.validate() } catch { return }
  submitLoading.value = true
  try {
    if (isEditMode.value) {
      await updateJob(jobForm.value.jobName, jobForm.value.jobGroup, jobForm.value)
      ElMessage.success('更新成功')
    } else {
      await createJob(jobForm.value)
      ElMessage.success('创建成功')
    }
    jobDialogVisible.value = false; loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.Message || e.response?.data?.message || '操作失败')
  } finally { submitLoading.value = false }
}

// ======================== Cron 选择器 ========================
const currentStep = ref(0)
const cronPickerVisible = ref(false)
const cronPickerValue = ref('0 0/5 * * * ?')

// ======================== 工具 ========================
const formatTime = (iso) => {
  if (!iso) return '--'
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

onMounted(() => { loadSchedulerInfo(); loadData() })
onUnmounted(() => { if (refreshTimer) clearInterval(refreshTimer) })
</script>

<style scoped>
.scheduler-container { padding: 16px; background: #f0f2f5; min-height: calc(100vh - 84px); }
.overview-card { margin-bottom: 12px; border-radius: 8px; }
.overview-row { display: flex; align-items: center; gap: 32px; flex-wrap: wrap; }
.overview-item { display: flex; align-items: center; gap: 10px; }
.overview-label { font-size: 12px; color: #909399; }
.overview-value { font-size: 16px; font-weight: bold; color: #303133; }
.overview-actions { margin-left: auto; display: flex; gap: 8px; }
.action-card { margin-bottom: 12px; border-radius: 8px; }
.action-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
.action-left { display: flex; align-items: center; }
.action-right { display: flex; align-items: center; }
.table-card { border-radius: 8px; }
.job-name-cell { display: flex; flex-direction: column; }
.job-name { font-size: 14px; font-weight: 600; color: #303133; }
.job-group { font-size: 12px; color: #909399; margin-top: 2px; }
.cron-tag { font-family: 'Courier New', Courier, monospace; font-weight: bold; }
.timeline-cell { font-size: 12px; line-height: 1.6; }
.time-row { display: flex; justify-content: space-between; color: #606266; }
.next-time { color: #409eff; margin-top: 2px; }
.time-label { color: #909399; margin-right: 8px; }
.font-bold { font-weight: bold; }
.log-content { font-size: 13px; line-height: 1.5; }
.log-error-box { margin-top: 8px; padding: 8px 12px; background: #282c34; color: #e06c75; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 12px; word-break: break-all; white-space: pre-wrap; }
.log-pagination { display: flex; justify-content: center; margin-top: 20px; padding-bottom: 10px; }
.cron-input :deep(.el-input__inner) { cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold; color: #409eff; }
.cron-input-icon { cursor: pointer; color: #409eff; }
.cron-picker-footer { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.cron-preview { font-size: 14px; color: #606266; }

.step-section {
  background: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.section-icon { font-size: 20px; }
.section-title { flex: 1; }
.cron-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: -4px 0 8px 0;
  font-size: 12px;
  color: #909399;
}
.cron-tip code {
  background: #f0f2f5;
  padding: 1px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  color: #409eff;
}
.cron-hint { font-size: 12px; color: #409eff; cursor: pointer; }
.schedule-preview {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding: 12px;
  background: #ecf5ff;
  border-radius: 6px;
}
.field-tip { font-size: 12px; color: #909399; margin-top: 4px; }
.empty-params {
  text-align: center;
  padding: 16px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
}
.param-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
