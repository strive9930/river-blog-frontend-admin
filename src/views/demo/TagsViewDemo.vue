<template>
  <div class="tags-demo">
    <el-card class="demo-card">
      <template #header>
        <div class="card-header">
          <span>标签页功能演示</span>
        </div>
      </template>
      
      <div class="demo-content">
        <el-alert
          title="标签页功能说明"
          type="success"
          description="点击左侧菜单项会在顶部生成对应的标签页，支持右键菜单操作"
          show-icon
          closable
        />
        
        <div class="feature-list">
          <h3>主要功能：</h3>
          <ul>
            <li>✅ 点击菜单自动生成标签页</li>
            <li>✅ 标签页可关闭（固定标签页除外）</li>
            <li>✅ 支持右键菜单操作</li>
            <li>✅ 页面缓存功能</li>
            <li>✅ 平滑的页面切换动画</li>
            <li>✅ 标签页滚动功能</li>
          </ul>
        </div>
        
        <div class="operations">
          <h3>操作演示：</h3>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-button type="primary" @click="navigateTo('/dashboard')">跳转到仪表盘</el-button>
            </el-col>
            <el-col :span="8">
              <el-button type="success" @click="navigateTo('/permissions/list')">跳转到权限管理</el-button>
            </el-col>
            <el-col :span="8">
              <el-button type="warning" @click="navigateTo('/roles/list')">跳转到角色管理</el-button>
            </el-col>
          </el-row>
          <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :span="8">
              <el-button type="danger" @click="navigateTo('/users/list')">跳转到用户管理</el-button>
            </el-col>
            <el-col :span="8">
              <el-button @click="addMultipleTabs">批量添加标签页</el-button>
            </el-col>
            <el-col :span="8">
              <el-button @click="clearAllTabs">清空所有标签页</el-button>
            </el-col>
          </el-row>
        </div>
        
        <div class="tips">
          <h3>使用提示：</h3>
          <el-alert
            title="右键菜单操作"
            type="info"
            description="在标签页上右键点击可以进行刷新、关闭、关闭其他等操作"
            show-icon
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useTagsViewStore } from '@/store/modules/tagsView'

const router = useRouter()
const tagsViewStore = useTagsViewStore()

const navigateTo = (path: string) => {
  router.push(path)
}

const addMultipleTabs = () => {
  const paths = ['/dashboard', '/permissions/list', '/roles/list', '/users/list']
  paths.forEach(path => {
    router.push(path)
  })
}

const clearAllTabs = () => {
  tagsViewStore.delAllVisitedViews()
  router.push('/')
}
</script>

<style scoped>
.tags-demo {
  padding: 20px;
}

.demo-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.demo-content {
  line-height: 1.6;
}

.feature-list h3,
.operations h3,
.tips h3 {
  margin: 20px 0 10px 0;
  color: #333;
}

.feature-list ul {
  padding-left: 20px;
}

.feature-list li {
  margin: 8px 0;
}

.operations {
  margin: 30px 0;
}

.tips {
  margin-top: 30px;
}
</style>