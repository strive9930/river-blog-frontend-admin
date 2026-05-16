<template>
  <div class="simple-tags-demo">
    <h2>标签页功能演示</h2>
    
    <div class="demo-section">
      <h3>功能说明：</h3>
      <ul>
        <li>✅ 点击左侧菜单会自动在顶部生成标签页</li>
        <li>✅ 标签页支持关闭操作（固定标签页除外）</li>
        <li>✅ 右键标签页可进行刷新、关闭等操作</li>
        <li>✅ 页面内容会被缓存，切换时不重复加载</li>
        <li>✅ 支持平滑的页面切换动画</li>
      </ul>
    </div>
    
    <div class="demo-actions">
      <h3>快速测试：</h3>
      <el-button @click="testNavigation('/dashboard')" type="primary">访问仪表盘</el-button>
      <el-button @click="testNavigation('/permissions/list')" type="success">访问权限管理</el-button>
      <el-button @click="testNavigation('/roles/list')" type="warning">访问角色管理</el-button>
      <el-button @click="testNavigation('/users/list')" type="danger">访问用户管理</el-button>
    </div>
    
    <div class="tips">
      <el-alert
        title="使用提示"
        type="info"
        description="请尝试点击左侧菜单的不同选项，观察顶部标签页的变化。右键点击标签页可以进行更多操作。"
        show-icon
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const testNavigation = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.simple-tags-demo {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.demo-section h3,
.demo-actions h3,
.tips h3 {
  margin: 20px 0 10px 0;
  color: #333;
}

.demo-section ul {
  padding-left: 20px;
}

.demo-section li {
  margin: 8px 0;
  line-height: 1.6;
}

.demo-actions {
  margin: 30px 0;
}

.demo-actions .el-button {
  margin: 5px;
}

.tips {
  margin-top: 30px;
}
</style>