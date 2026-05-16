<template>
  <div class="menus-index">
    <!-- 页面标题和导航 -->
    <div class="page-header">
      <h2>菜单管理</h2>
      <p class="page-description">管理系统菜单和菜单组配置</p>
    </div>

    <!-- 快捷操作卡片 -->
    <el-row :gutter="20" class="quick-actions">
      <el-col :span="8">
        <el-card class="quick-card" shadow="hover" @click="switchToMenuManagement">
          <div class="card-content">
            <div class="card-icon primary">
              <el-icon><Menu /></el-icon>
            </div>
            <div class="card-info">
              <h3>菜单管理</h3>
              <p>管理系统的菜单项配置</p>
              <div class="card-stats">
                <el-tag type="primary">{{ menuStats.total }} 个菜单</el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="quick-card" shadow="hover" @click="switchToGroupManagement">
          <div class="card-content">
            <div class="card-icon success">
              <el-icon><Collection /></el-icon>
            </div>
            <div class="card-info">
              <h3>菜单组管理</h3>
              <p>管理菜单分类和分组</p>
              <div class="card-stats">
                <el-tag type="success">{{ groupStats.total }} 个分组</el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="quick-card" shadow="hover" @click="handleImportExport">
          <div class="card-content">
            <div class="card-icon warning">
              <el-icon><Upload /></el-icon>
            </div>
            <div class="card-info">
              <h3>导入导出</h3>
              <p>批量导入或导出菜单配置</p>
              <div class="card-stats">
                <el-tag type="warning">数据迁移</el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计信息 -->
    <el-row :gutter="20" class="stats-section">
      <el-col :span="6">
        <el-statistic title="总菜单数" :value="menuStats.total">
          <template #prefix>
            <el-icon><Menu /></el-icon>
          </template>
        </el-statistic>
      </el-col>
      <el-col :span="6">
        <el-statistic title="启用菜单" :value="menuStats.enabled">
          <template #prefix>
            <el-icon style="color: #67C23A;"><Check /></el-icon>
          </template>
        </el-statistic>
      </el-col>
      <el-col :span="6">
        <el-statistic title="菜单组数" :value="groupStats.total">
          <template #prefix>
            <el-icon><Collection /></el-icon>
          </template>
        </el-statistic>
      </el-col>
      <el-col :span="6">
        <el-statistic title="隐藏菜单" :value="menuStats.hidden">
          <template #prefix>
            <el-icon style="color: #E6A23C;"><Hide /></el-icon>
          </template>
        </el-statistic>
      </el-col>
    </el-row>

    <!-- 最近活动 -->
    <el-card class="recent-activity">
      <template #header>
        <div class="card-header">
          <span>最近活动</span>
          <el-button link type="primary" @click="loadRecentActivity">刷新</el-button>
        </div>
      </template>
      
      <el-timeline>
        <el-timeline-item
          v-for="activity in recentActivities"
          :key="activity.id"
          :timestamp="activity.time"
          :type="activity.type"
        >
          <p>{{ activity.description }}</p>
          <el-tag :type="activity.tagType" size="small">{{ activity.action }}</el-tag>
        </el-timeline-item>
        <el-timeline-item v-if="recentActivities.length === 0">
          <p class="no-activity">暂无活动记录</p>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 内容区域 - 动态显示不同模块 -->
    <div class="content-area">
      <component 
        :is="currentComponent" 
        v-if="currentComponent"
        :key="currentView"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Menu, Collection, Upload, Check, Hide 
} from '@element-plus/icons-vue'
import MenuApiService from '@/api/menu'
import { useFeedback } from '@/services'

// 动态导入组件以避免绑定问题
const MenuManagement = defineAsyncComponent(() => import('./MenuManagement.vue'))
const MenuGroupManagement = defineAsyncComponent(() => import('./MenuGroupManagement.vue'))

interface Activity {
  id: string
  description: string
  action: string
  time: string
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  tagType: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

const router = useRouter()
const { error } = useFeedback()

// 当前视图
const currentView = ref<'menu' | 'group' | 'import'>('menu')

// 计算当前组件
const currentComponent = computed(() => {
  switch (currentView.value) {
    case 'menu':
      return MenuManagement
    case 'group':
      return MenuGroupManagement
    default:
      return null
  }
})

// 统计数据
const menuStats = reactive({
  total: 0,
  enabled: 0,
  hidden: 0
})

const groupStats = reactive({
  total: 0
})

// 最近活动
const recentActivities = ref<Activity[]>([
  {
    id: '1',
    description: '用户 admin 创建了新的菜单项 "系统监控"',
    action: '新增',
    time: '2024-01-15 14:30:22',
    type: 'success',
    tagType: 'success'
  },
  {
    id: '2',
    description: '用户 admin 修改了菜单组 "系统管理" 的排序',
    action: '修改',
    time: '2024-01-15 13:45:10',
    type: 'primary',
    tagType: 'primary'
  },
  {
    id: '3',
    description: '用户 admin 禁用了菜单项 "测试功能"',
    action: '禁用',
    time: '2024-01-15 11:20:05',
    type: 'warning',
    tagType: 'warning'
  }
])

// 切换到菜单管理
const switchToMenuManagement = () => {
  console.log('切换到菜单管理')
  currentView.value = 'menu'
  console.log('当前视图:', currentView.value)
}

// 切换到菜单组管理
const switchToGroupManagement = () => {
  console.log('切换到菜单组管理')
  currentView.value = 'group'
  console.log('当前视图:', currentView.value)
}

// 处理导入导出
const handleImportExport = async () => {
  console.log('处理导入导出')
  try {
    await ElMessageBox.confirm(
      '此功能将导出当前所有的菜单配置数据，是否继续？',
      '数据导出',
      {
        confirmButtonText: '导出',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    // 模拟导出操作
    ElMessage.success('菜单配置已导出到下载目录')
  } catch {
    // 用户取消操作
  }
}

// 加载统计数据
const loadStatistics = async () => {
  try {
    // 获取菜单统计
    const menuResponse = await MenuApiService.getMenus()
    if (menuResponse.success) {
      const menus = menuResponse.data || []
      menuStats.total = menus.length
      menuStats.enabled = menus.filter(m => m.isEnabled).length
      menuStats.hidden = menus.filter(m => !m.isVisible).length
    }
    
    // 获取菜单组统计
    const groupResponse = await MenuApiService.getMenuGroups()
    if (groupResponse.success) {
      groupStats.total = (groupResponse.data || []).length
    }
  } catch (err: any) {
    error('加载统计数据失败: ' + err.message)
  }
}

// 加载最近活动
const loadRecentActivity = async () => {
  try {
    // 这里可以从后端获取真实的活动日志
    // 暂时使用模拟数据
    ElMessage.success('活动记录已刷新')
  } catch (err: any) {
    error('刷新活动记录失败: ' + err.message)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadStatistics()
})
</script>

<style scoped>
.menus-index {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.page-description {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.quick-actions {
  margin-bottom: 30px;
}

.quick-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 160px;
  position: relative;
  overflow: hidden;
}

.quick-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.quick-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  transition: background 0.3s ease;
  z-index: 1;
}

.quick-card:hover::before {
  background: rgba(64, 158, 255, 0.05);
}

.card-content {
  display: flex;
  align-items: center;
  height: 100%;
  position: relative;
  z-index: 2;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 24px;
  color: white;
}

.card-icon.primary {
  background: linear-gradient(135deg, #409EFF, #337ecc);
}

.card-icon.success {
  background: linear-gradient(135deg, #67C23A, #529b2e);
}

.card-icon.warning {
  background: linear-gradient(135deg, #E6A23C, #b88230);
}

.card-info h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.card-info p {
  margin: 0 0 15px 0;
  color: #606266;
  font-size: 14px;
}

.card-stats .el-tag {
  font-size: 12px;
}

.stats-section {
  margin-bottom: 30px;
}

.stats-section .el-col {
  text-align: center;
}

.recent-activity {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.no-activity {
  color: #909399;
  font-style: italic;
  margin: 20px 0;
  text-align: center;
}

.content-area {
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .menus-index {
    padding: 15px;
  }
  
  .quick-actions .el-col {
    margin-bottom: 15px;
  }
  
  .stats-section .el-col {
    margin-bottom: 20px;
  }
  
  .card-content {
    flex-direction: column;
    text-align: center;
  }
  
  .card-icon {
    margin-right: 0;
    margin-bottom: 15px;
  }
}
</style>