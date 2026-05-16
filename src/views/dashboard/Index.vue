<template>
  <div class="dashboard">
    <!-- 欢迎卡片 -->
    <el-row :gutter="20" class="welcome-row">
      <el-col :span="24">
        <el-card class="welcome-card" shadow="hover">
          <div class="welcome-content">
            <div class="welcome-text">
              <h2>欢迎回来，{{ userStore.nickName }} 👋</h2>
              <p>今天是 {{ currentDate }}，祝您工作愉快！</p>
            </div>
            <div class="welcome-avatar">
              <el-avatar :size="80" :src="userStore.avatar">
                {{ userStore.nickName?.charAt(0) }}
              </el-avatar>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="stat in stats" :key="stat.title">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color }">
              <el-icon :size="24" color="white">
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stat.value }}</div>
              <div class="stat-title">{{ stat.title }}</div>
              <div class="stat-trend" :class="stat.trend">
                <el-icon><component :is="stat.trendIcon" /></el-icon>
                <span>{{ stat.change }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="16">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>用户增长趋势</span>
              <el-tag type="success">近30天</el-tag>
            </div>
          </template>
          <div class="chart-container">
            <div class="chart-placeholder">
              <el-icon size="48" color="#c0c4cc"><DataLine /></el-icon>
              <p>图表数据加载中...</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>权限分布</span>
            </div>
          </template>
          <div class="chart-container">
            <div class="chart-placeholder">
              <el-icon size="48" color="#c0c4cc"><PieChart /></el-icon>
              <p>饼图数据加载中...</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../../store/modules/user'
import { usePermissionStore } from '../../store/modules/permission'
import { 
  User, Lock, Setting, DataLine, PieChart,
  SuccessFilled
} from '@element-plus/icons-vue'

const userStore = useUserStore()
const permissionStore = usePermissionStore()

// 当前日期
const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

// 统计数据
const stats = ref([
  {
    title: '总用户数',
    value: '0',
    icon: User,
    color: '#409EFF',
    trend: 'up',
    trendIcon: SuccessFilled,
    change: '+0%'
  },
  {
    title: '活跃角色',
    value: '0',
    icon: Lock,
    color: '#67C23A',
    trend: 'up',
    trendIcon: SuccessFilled,
    change: '+0%'
  },
  {
    title: '权限项',
    value: '0',
    icon: Setting,
    color: '#E6A23C',
    trend: 'up',
    trendIcon: SuccessFilled,
    change: '+0%'
  },
  {
    title: '菜单项',
    value: '0',
    icon: DataLine,
    color: '#F56C6C',
    trend: 'up',
    trendIcon: SuccessFilled,
    change: '+0%'
  }
])

// 加载统计数据
const loadStatistics = async () => {
  try {
    // 获取用户总数 - 使用现有的用户列表API
    const userResponse = await fetch('http://localhost:5001/api/users')
    if (userResponse.ok) {
      const userData = await userResponse.json()
      if (userData.success) {
        stats.value[0].value = userData.data?.length?.toString() || '0'
      }
    }
    
    // 获取角色总数 - 使用现有的角色列表API
    const roleResponse = await fetch('http://localhost:5001/api/roles')
    if (roleResponse.ok) {
      const roleData = await roleResponse.json()
      if (roleData.success) {
        stats.value[1].value = roleData.data?.length?.toString() || '0'
      }
    }
    
    // 获取权限总数 - 使用现有的权限分组API
    const permissionResponse = await fetch('http://localhost:5001/api/permissions/statistics')

    if (permissionResponse.ok) {
      const permissionData = await permissionResponse.json()
      if (permissionData.success) {
        // 计算所有权限的总数
        const totalPermissions = permissionData.data?.totalPermissions;
        stats.value[2].value = totalPermissions;
      }
    }
    
    // 获取菜单总数
    const menuResponse = await fetch('http://localhost:5001/api/menus')
    if (menuResponse.ok) {
      const menuData = await menuResponse.json()
      if (menuData.success) {
        stats.value[3].value = menuData.data?.length?.toString() || '0'
      }
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

onMounted(() => {
  console.log('Dashboard mounted')
  console.log('当前用户完整信息:', {
    id: userStore.userInfo?.id,
    nickName: userStore.userInfo?.nickName,
    email: userStore.userInfo?.email,
    avatar: userStore.userInfo?.avatar,
    roles: userStore.userInfo?.roles
  })
  console.log('计算属性nickName值:', userStore.nickName)
  console.log('当前路由:', permissionStore.routes)
  console.log('当前权限:', userStore.permissions)
  loadStatistics()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.welcome-row {
  margin-bottom: 20px;
}

.welcome-card {
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-text h2 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 600;
}

.welcome-text p {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.welcome-avatar {
  flex-shrink: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.stat-trend.up {
  color: #67C23A;
}

.stat-trend.down {
  color: #F56C6C;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #c0c4cc;
}

.chart-placeholder p {
  margin: 10px 0 0 0;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard {
    padding: 15px;
  }
  
  .welcome-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .stat-content {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }
  
  .charts-row {
    flex-direction: column;
  }
  
  .charts-row > div {
    width: 100%;
    margin-bottom: 20px;
  }
}
</style>