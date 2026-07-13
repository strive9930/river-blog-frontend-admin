<script setup lang="ts">
defineOptions({ name: 'NotFound' });
</script>

<template>
  <div class="error-page">
    <el-empty description="404 - 抱歉，您访问的页面不存在或前端组件尚未开发" />
    <div style="text-align: center; margin-top: 20px;">
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>