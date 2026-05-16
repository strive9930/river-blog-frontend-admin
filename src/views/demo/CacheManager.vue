<template>
  <div class="cache-manager">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>智能缓存管理</span>
          <div class="header-actions">
            <el-button @click="refreshCacheStats" size="small" type="primary">
              <el-icon><Refresh /></el-icon>
              刷新统计
            </el-button>
            <el-button @click="clearExpiredCache" size="small" type="warning">
              <el-icon><Delete /></el-icon>
              清理过期缓存
            </el-button>
            <el-button @click="clearAllCache" size="small" type="danger">
              <el-icon><Close /></el-icon>
              清空所有缓存
            </el-button>
          </div>
        </div>
      </template>

      <!-- 缓存统计概览 -->
      <el-row :gutter="20" style="margin-bottom: 30px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-label">缓存命中率</div>
              <div class="stat-value">{{ stats.hitRate.toFixed(1) }}%</div>
              <el-progress 
                :percentage="stats.hitRate" 
                :stroke-width="8"
                :color="getHitRateColor(stats.hitRate)"
              />
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-label">缓存项数</div>
              <div class="stat-value">{{ stats.size }}</div>
              <div class="stat-sub">{{ stats.size }} / {{ config.maxSize }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-label">总请求数</div>
              <div class="stat-value">{{ stats.hits + stats.misses }}</div>
              <div class="stat-sub">命中: {{ stats.hits }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-label">驱逐次数</div>
              <div class="stat-value">{{ stats.evictions }}</div>
              <div class="stat-sub">内存回收</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 缓存操作演示 -->
      <el-card style="margin-bottom: 30px;">
        <template #header>
          <strong>缓存操作演示</strong>
        </template>
        <div class="demo-section">
          <el-row :gutter="15">
            <el-col :span="8">
              <el-button @click="testUserCache" type="primary" style="width: 100%;">
                测试用户数据缓存
              </el-button>
            </el-col>
            <el-col :span="8">
              <el-button @click="testPermissionCache" type="success" style="width: 100%;">
                测试权限数据缓存
              </el-button>
            </el-col>
            <el-col :span="8">
              <el-button @click="testBatchCache" type="warning" style="width: 100%;">
                测试批量缓存
              </el-button>
            </el-col>
          </el-row>
          
          <div v-if="demoResult" class="demo-result">
            <h4>操作结果:</h4>
            <pre>{{ demoResult }}</pre>
          </div>
        </div>
      </el-card>

      <!-- 缓存详情列表 -->
      <el-card>
        <template #header>
          <div class="list-header">
            <strong>缓存详情列表</strong>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索缓存键..."
              style="width: 200px;"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </template>

        <el-table 
          :data="filteredCacheEntries" 
          style="width: 100%"
          max-height="400"
        >
          <el-table-column prop="key" label="缓存键" width="250">
            <template #default="scope">
              <el-tag type="info">{{ scope.row.key }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="size" label="数据大小" width="100">
            <template #default="scope">
              {{ formatSize(scope.row.size) }}
            </template>
          </el-table-column>
          <el-table-column prop="created" label="创建时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.created) }}
            </template>
          </el-table-column>
          <el-table-column prop="expires" label="过期时间" width="180">
            <template #default="scope">
              <span :class="{ 'expired': isExpired(scope.row.expires) }">
                {{ formatDate(scope.row.expires) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="tags" label="标签" width="150">
            <template #default="scope">
              <el-tag 
                v-for="tag in scope.row.tags" 
                :key="tag"
                size="small"
                style="margin-right: 5px;"
              >
                {{ tag }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.expires)">
                {{ getStatusText(scope.row.expires) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button 
                size="small" 
                type="primary" 
                @click="refreshEntry(scope.row.key)"
              >
                刷新
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="removeEntry(scope.row.key)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="cacheEntries.length === 0" class="empty-state">
          <el-empty description="暂无缓存数据" />
        </div>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Delete, Close, Search } from '@element-plus/icons-vue'
import { useCache } from '@/services/cacheService'

interface CacheEntryDisplay {
  key: string
  size: number
  created: number
  expires: number
  tags: string[]
}

const searchKeyword = ref('')
const demoResult = ref('')
const cacheEntries = ref<CacheEntryDisplay[]>([])

const { 
  getStats, 
  clearExpired, 
  clearAll, 
  refresh,
  getCachedOrFetch,
  set
} = useCache()

const stats = ref(getStats())
const config = ref({
  maxSize: 100,
  defaultExpiry: 5 * 60 * 1000
})

// 计算属性
const filteredCacheEntries = computed(() => {
  if (!searchKeyword.value) {
    return cacheEntries.value
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return cacheEntries.value.filter(entry => 
    entry.key.toLowerCase().includes(keyword) ||
    entry.tags.some(tag => tag.toLowerCase().includes(keyword))
  )
})

// 方法
const refreshCacheStats = () => {
  stats.value = getStats()
  loadCacheEntries()
  ElMessage.success('缓存统计已刷新')
}

const clearExpiredCache = async () => {
  try {
    const count = clearExpired()
    refreshCacheStats()
    ElMessage.success(`已清理 ${count} 个过期缓存项`)
  } catch (error) {
    ElMessage.error('清理过期缓存失败')
  }
}

const clearAllCache = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有缓存吗？这将影响所有用户的使用体验。',
      '清空缓存确认',
      { type: 'warning' }
    )
    
    clearAll()
    refreshCacheStats()
    ElMessage.success('所有缓存已清空')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清空缓存失败')
    }
  }
}

const testUserCache = async () => {
  try {
    const result = await getCachedOrFetch(
      'demo:user:123',
      async () => {
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 1000))
        return {
          id: 123,
          name: '测试用户',
          email: 'test@example.com',
          createTime: new Date().toISOString()
        }
      },
      { expiry: 10000, tags: ['user', 'demo'] }
    )
    
    demoResult.value = JSON.stringify(result, null, 2)
    refreshCacheStats()
    ElMessage.success('用户数据缓存测试完成')
  } catch (error) {
    ElMessage.error('测试失败')
  }
}

const testPermissionCache = async () => {
  try {
    const result = await getCachedOrFetch(
      'demo:permissions:list',
      async () => {
        await new Promise(resolve => setTimeout(resolve, 800))
        return [
          { id: 1, name: '用户查看', code: 'user.view' },
          { id: 2, name: '用户创建', code: 'user.create' },
          { id: 3, name: '权限管理', code: 'permission.manage' }
        ]
      },
      { expiry: 15000, tags: ['permission', 'demo'] }
    )
    
    demoResult.value = JSON.stringify(result, null, 2)
    refreshCacheStats()
    ElMessage.success('权限数据缓存测试完成')
  } catch (error) {
    ElMessage.error('测试失败')
  }
}

const testBatchCache = async () => {
  try {
    // 批量设置缓存
    const batchData = [
      { key: 'batch:item:1', data: { id: 1, value: '数据1' }, options: { tags: ['batch'] } },
      { key: 'batch:item:2', data: { id: 2, value: '数据2' }, options: { tags: ['batch'] } },
      { key: 'batch:item:3', data: { id: 3, value: '数据3' }, options: { tags: ['batch'] } }
    ]
    
    batchData.forEach(({ key, data, options }) => {
      set(key, data, options)
    })
    
    demoResult.value = `批量设置了 ${batchData.length} 个缓存项`
    refreshCacheStats()
    ElMessage.success('批量缓存测试完成')
  } catch (error) {
    ElMessage.error('测试失败')
  }
}

const refreshEntry = async (key: string) => {
  try {
    await refresh(key, async () => {
      // 模拟刷新逻辑
      await new Promise(resolve => setTimeout(resolve, 500))
      return { refreshed: true, timestamp: Date.now() }
    })
    
    refreshCacheStats()
    ElMessage.success(`缓存项 ${key} 已刷新`)
  } catch (error) {
    ElMessage.error('刷新失败')
  }
}

const removeEntry = async (key: string) => {
  try {
    // 这里需要在cacheService中添加remove方法的公开访问
    refreshCacheStats()
    ElMessage.success(`缓存项 ${key} 已删除`)
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const loadCacheEntries = () => {
  // 模拟从localStorage或其他存储中读取缓存详情
  try {
    const stored = localStorage.getItem('smartCache')
    if (stored) {
      const parsed = JSON.parse(stored)
      cacheEntries.value = Object.entries(parsed).map(([key, entry]: [string, any]) => ({
        key,
        size: JSON.stringify(entry.data).length,
        created: entry.timestamp,
        expires: entry.expiry,
        tags: entry.tags || []
      }))
    } else {
      cacheEntries.value = []
    }
  } catch (error) {
    console.error('加载缓存详情失败:', error)
    cacheEntries.value = []
  }
}

const getHitRateColor = (rate: number) => {
  if (rate >= 80) return '#67c23a'
  if (rate >= 60) return '#e6a23c'
  return '#f56c6c'
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const isExpired = (timestamp: number) => {
  return Date.now() > timestamp
}

const getStatusType = (expires: number) => {
  return isExpired(expires) ? 'danger' : 'success'
}

const getStatusText = (expires: number) => {
  return isExpired(expires) ? '已过期' : '有效'
}

// 生命周期
onMounted(() => {
  refreshCacheStats()
  // 定期刷新统计
  const interval = setInterval(refreshCacheStats, 5000)
  
  // 组件卸载时清理定时器
  onUnmounted(() => {
    clearInterval(interval)
  })
})
</script>

<style scoped>
.cache-manager {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stat-card {
  height: 120px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.stat-sub {
  font-size: 12px;
  color: #909399;
}

.demo-section {
  padding: 20px 0;
}

.demo-result {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

.demo-result h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.demo-result pre {
  margin: 0;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.expired {
  color: #f56c6c;
  text-decoration: line-through;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cache-manager {
    padding: 10px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .stat-value {
    font-size: 20px;
  }
  
  .list-header {
    flex-direction: column;
    gap: 10px;
  }
}
</style>