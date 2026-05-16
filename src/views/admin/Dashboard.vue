<template>
  <div class="admin-dashboard">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>管理面板</span>
        </div>
      </template>
      <div class="dashboard-content">
        <h2>欢迎来到管理后台</h2>
        <p>这里是系统管理的核心区域</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// 管理面板逻辑
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
}

.dashboard-content {
  text-align: center;
  padding: 40px;
}

.dashboard-content h2 {
  color: #303133;
  margin-bottom: 20px;
}

.dashboard-content p {
  color: #909399;
  font-size: 16px;
}
</style>