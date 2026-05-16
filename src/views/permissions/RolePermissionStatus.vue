<template>
  <div class="role-permission-status">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>角色权限状态监控</span>
          <div class="header-actions">
            <el-select 
              v-model="selectedRoleId" 
              placeholder="选择角色" 
              style="width: 200px; margin-right: 10px;"
              @change="loadRolePermissionStatus"
            >
              <el-option 
                v-for="role in allRoles" 
                :key="role.id" 
                :label="role.name" 
                :value="role.id" 
              />
            </el-select>
            <el-button type="primary" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
          </div>
        </div>
      </template>

      <!-- 角色概览卡片 -->
      <div v-if="selectedRoleInfo" class="role-overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="overview-card">
              <div class="overview-item">
                <div class="overview-label">角色名称</div>
                <div class="overview-value">{{ selectedRoleInfo.name }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="overview-card">
              <div class="overview-item">
                <div class="overview-label">权限总数</div>
                <div class="overview-value">{{ roleStatus.permissionCount }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="overview-card">
              <div class="overview-item">
                <div class="overview-label">活跃用户数</div>
                <div class="overview-value">{{ roleStatus.activeUserCount }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="overview-card">
              <div class="overview-item">
                <div class="overview-label">最后更新</div>
                <div class="overview-value">{{ roleStatus.lastUpdated }}</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 权限状态详情 -->
      <el-tabs v-model="activeTab" style="margin-top: 20px;">
        <!-- 权限分布图表 -->
        <el-tab-pane label="权限分布" name="distribution">
          <el-row :gutter="20">
            <el-col :span="16">
              <el-card>
                <template #header>
                  <strong>权限分组分布</strong>
                </template>
                <div ref="chartContainer" style="height: 400px;"></div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card>
                <template #header>
                  <strong>权限类型统计</strong>
                </template>
                <div class="permission-stats">
                  <div 
                    v-for="stat in permissionTypeStats" 
                    :key="stat.type"
                    class="stat-item"
                  >
                    <div class="stat-label">
                      <el-tag :type="stat.tagType">{{ stat.type }}</el-tag>
                    </div>
                    <div class="stat-value">{{ stat.count }}</div>
                    <div class="stat-percent">{{ stat.percent }}%</div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>

        <!-- 详细权限列表 -->
        <el-tab-pane label="权限详情" name="details">
          <el-card>
            <template #header>
              <div class="table-header">
                <strong>权限详情列表</strong>
                <div class="table-actions">
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
                  <el-button @click="exportPermissions">导出权限</el-button>
                </div>
              </div>
            </template>

            <el-table 
              :data="filteredPermissions" 
              style="width: 100%"
              v-loading="loading"
              stripe
            >
              <el-table-column type="index" label="#" width="60" />
              <el-table-column prop="name" label="权限名称" width="180">
                <template #default="scope">
                  <strong>{{ scope.row.name }}</strong>
                </template>
              </el-table-column>
              <el-table-column prop="code" label="权限编码" width="200">
                <template #default="scope">
                  <el-tag type="info">{{ scope.row.code }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="group" label="分组" width="120">
                <template #default="scope">
                  <el-tag 
                    :type="getGroupTagType(scope.row.group)"
                    effect="plain"
                  >
                    {{ scope.row.group || '未分组' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="描述" show-overflow-tooltip />
              <el-table-column prop="assignTime" label="分配时间" width="180" />
              <el-table-column prop="assignedBy" label="分配人" width="120" />
              <el-table-column label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.enabled ? 'success' : 'danger'">
                    {{ scope.row.enabled ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination-container" style="margin-top: 20px; text-align: right;">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="totalPermissions"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </el-card>
        </el-tab-pane>

        <!-- 使用情况分析 -->
        <el-tab-pane label="使用分析" name="analytics">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card>
                <template #header>
                  <strong>权限使用频率</strong>
                </template>
                <div ref="usageChartContainer" style="height: 300px;"></div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <template #header>
                  <strong>异常访问记录</strong>
                </template>
                <el-table :data="anomalyRecords" max-height="300">
                  <el-table-column prop="permissionName" label="权限名称" />
                  <el-table-column prop="userName" label="用户" />
                  <el-table-column prop="accessTime" label="访问时间" width="180" />
                  <el-table-column prop="reason" label="异常原因" />
                  <el-table-column label="操作" width="100">
                    <template #default="scope">
                      <el-button size="small" type="primary" @click="viewAnomalyDetail(scope.row)">
                        查看
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>

        <!-- 历史变更记录 -->
        <el-tab-pane label="变更历史" name="history">
          <el-card>
            <template #header>
              <strong>权限变更历史</strong>
            </template>
            <el-timeline>
              <el-timeline-item
                v-for="record in changeHistory"
                :key="record.id"
                :timestamp="record.timestamp"
                :type="getTimelineType(record.action)"
              >
                <div class="timeline-content">
                  <div class="timeline-title">
                    {{ record.operator }} {{ record.actionDesc }}
                  </div>
                  <div class="timeline-detail">
                    {{ record.detail }}
                  </div>
                  <div class="timeline-meta">
                    <el-tag size="small">{{ record.ipAddress }}</el-tag>
                    <el-tag size="small" type="info">{{ record.userAgent }}</el-tag>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 异常详情对话框 -->
    <el-dialog
      v-model="anomalyDialogVisible"
      title="异常访问详情"
      width="600px"
    >
      <div v-if="currentAnomaly" class="anomaly-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="权限名称">
            {{ currentAnomaly.permissionName }}
          </el-descriptions-item>
          <el-descriptions-item label="访问用户">
            {{ currentAnomaly.userName }}
          </el-descriptions-item>
          <el-descriptions-item label="访问时间">
            {{ currentAnomaly.accessTime }}
          </el-descriptions-item>
          <el-descriptions-item label="异常类型">
            <el-tag :type="getAnomalyType(currentAnomaly.reason)">
              {{ currentAnomaly.reason }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="IP地址">
            {{ currentAnomaly.ipAddress }}
          </el-descriptions-item>
          <el-descriptions-item label="用户代理">
            {{ currentAnomaly.userAgent }}
          </el-descriptions-item>
        </el-descriptions>
        
        <div style="margin-top: 20px;">
          <strong>详细信息：</strong>
          <p>{{ currentAnomaly.detail }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

interface Role {
  id: number
  name: string
  code: string
  description: string
}

interface Permission {
  id: number
  name: string
  code: string
  description: string
  group: string
  assignTime: string
  assignedBy: string
  enabled: boolean
}

interface RoleStatus {
  permissionCount: number
  activeUserCount: number
  lastUpdated: string
  permissions: Permission[]
}

interface PermissionStat {
  type: string
  count: number
  percent: number
  tagType: string
}

interface AnomalyRecord {
  id: number
  permissionName: string
  userName: string
  accessTime: string
  reason: string
  detail: string
  ipAddress: string
  userAgent: string
}

interface ChangeRecord {
  id: number
  timestamp: string
  operator: string
  action: string
  actionDesc: string
  detail: string
  ipAddress: string
  userAgent: string
}

const selectedRoleId = ref<number | null>(null)
const activeTab = ref('distribution')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')
const anomalyDialogVisible = ref(false)
const currentAnomaly = ref<AnomalyRecord | null>(null)

// 图表容器引用
const chartContainer = ref<HTMLDivElement>()
const usageChartContainer = ref<HTMLDivElement>()

// 数据
const allRoles = ref<Role[]>([
  { id: 1, name: '超级管理员', code: 'admin', description: '系统超级管理员' },
  { id: 2, name: '普通用户', code: 'user', description: '普通注册用户' },
  { id: 3, name: '内容管理员', code: 'content_manager', description: '内容管理专员' }
])

const selectedRoleInfo = ref<Role | null>(null)
const roleStatus = ref<RoleStatus>({
  permissionCount: 0,
  activeUserCount: 0,
  lastUpdated: '',
  permissions: []
})

const anomalyRecords = ref<AnomalyRecord[]>([
  {
    id: 1,
    permissionName: '用户删除',
    userName: 'test_user',
    accessTime: '2024-01-15 14:30:22',
    reason: '频繁访问',
    detail: '该用户在短时间内多次尝试访问用户删除功能',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...'
  }
])

const changeHistory = ref<ChangeRecord[]>([
  {
    id: 1,
    timestamp: '2024-01-15 10:30:00',
    operator: '系统管理员',
    action: 'add',
    actionDesc: '添加了用户管理权限',
    detail: '为该角色添加了用户查看、创建、编辑权限',
    ipAddress: '192.168.1.1',
    userAgent: 'Admin Panel'
  }
])

// 计算属性
const totalPermissions = computed(() => roleStatus.value.permissions.length)

const filteredPermissions = computed(() => {
  if (!searchKeyword.value) {
    return roleStatus.value.permissions.slice(
      (currentPage.value - 1) * pageSize.value,
      currentPage.value * pageSize.value
    )
  }
  
  const filtered = roleStatus.value.permissions.filter(permission =>
    permission.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    permission.code.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    (permission.description && permission.description.toLowerCase().includes(searchKeyword.value.toLowerCase()))
  )
  
  return filtered.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  )
})

const permissionTypeStats = computed<PermissionStat[]>(() => {
  const stats: Record<string, number> = {}
  roleStatus.value.permissions.forEach(perm => {
    const type = perm.group || '未分组'
    stats[type] = (stats[type] || 0) + 1
  })
  
  const total = roleStatus.value.permissions.length
  return Object.entries(stats).map(([type, count]) => ({
    type,
    count,
    percent: total > 0 ? Math.round((count / total) * 100) : 0,
    tagType: getGroupTagType(type)
  }))
})

// 方法
const loadRolePermissionStatus = async () => {
  if (!selectedRoleId.value) return
  
  loading.value = true
  try {
    // 获取角色基本信息
    selectedRoleInfo.value = allRoles.value.find(r => r.id === selectedRoleId.value) || null
    
    // 模拟API调用获取角色权限状态
    // const response = await rolePermissionApi.getRoleStatus(selectedRoleId.value)
    roleStatus.value = {
      permissionCount: 12,
      activeUserCount: 5,
      lastUpdated: '2024-01-15 16:30:00',
      permissions: [
        {
          id: 1,
          name: '用户查看',
          code: 'user.view',
          description: '查看用户列表和详情',
          group: '用户管理',
          assignTime: '2024-01-10 09:00:00',
          assignedBy: '系统管理员',
          enabled: true
        },
        {
          id: 2,
          name: '用户创建',
          code: 'user.create',
          description: '创建新用户',
          group: '用户管理',
          assignTime: '2024-01-10 09:00:00',
          assignedBy: '系统管理员',
          enabled: true
        }
      ]
    }
    
    await nextTick()
    renderCharts()
  } catch (error) {
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadRolePermissionStatus()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

const exportPermissions = () => {
  ElMessage.success('权限导出功能待实现')
}

const getGroupTagType = (group: string) => {
  const types = ['primary', 'success', 'warning', 'danger', 'info']
  const index = Math.abs((group || '').hashCode ? (group || '').hashCode() : 0) % types.length
  return types[index] || 'info'
}

const getTimelineType = (action: string) => {
  switch (action) {
    case 'add': return 'success'
    case 'remove': return 'danger'
    case 'modify': return 'warning'
    default: return 'info'
  }
}

const getAnomalyType = (reason: string) => {
  switch (reason) {
    case '频繁访问': return 'warning'
    case '越权访问': return 'danger'
    case '异常时段': return 'info'
    default: return 'info'
  }
}

const viewAnomalyDetail = (record: AnomalyRecord) => {
  currentAnomaly.value = record
  anomalyDialogVisible.value = true
}

const renderCharts = () => {
  // 渲染权限分布饼图
  if (chartContainer.value) {
    const chart = echarts.init(chartContainer.value)
    const option = {
      title: {
        text: '权限分组分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: '权限分布',
          type: 'pie',
          radius: '50%',
          data: permissionTypeStats.value.map(stat => ({
            value: stat.count,
            name: stat.type
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    }
    chart.setOption(option)
  }

  // 渲染使用频率柱状图
  if (usageChartContainer.value) {
    const chart = echarts.init(usageChartContainer.value)
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          data: ['用户管理', '系统管理', '内容管理', '数据分析'],
          axisTick: {
            alignWithLabel: true
          }
        }
      ],
      yAxis: [
        {
          type: 'value'
        }
      ],
      series: [
        {
          name: '使用次数',
          type: 'bar',
          barWidth: '60%',
          data: [120, 85, 67, 45],
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          }
        }
      ]
    }
    chart.setOption(option)
  }
}

// 监听窗口大小变化
const handleResize = () => {
  nextTick(() => {
    if (chartContainer.value) {
      echarts.getInstanceByDom(chartContainer.value)?.resize()
    }
    if (usageChartContainer.value) {
      echarts.getInstanceByDom(usageChartContainer.value)?.resize()
    }
  })
}

// 初始化
onMounted(() => {
  window.addEventListener('resize', handleResize)
  if (allRoles.value.length > 0) {
    selectedRoleId.value = allRoles.value[0].id
    loadRolePermissionStatus()
  }
})

// 清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.role-permission-status {
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

.role-overview {
  margin-bottom: 20px;
}

.overview-card {
  height: 100px;
}

.overview-item {
  text-align: center;
}

.overview-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.overview-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-actions {
  display: flex;
  align-items: center;
}

.permission-stats {
  padding: 10px 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  flex: 2;
}

.stat-value {
  flex: 1;
  text-align: center;
  font-weight: bold;
}

.stat-percent {
  flex: 1;
  text-align: right;
  color: #909399;
}

.timeline-content {
  padding: 10px 0;
}

.timeline-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.timeline-detail {
  color: #606266;
  margin-bottom: 8px;
}

.timeline-meta {
  display: flex;
  gap: 5px;
}

.anomaly-detail :deep(.el-descriptions__body) {
  background-color: #f5f7fa;
}
</style>