<template>
  <div class="role-management-test">
    <h2>角色管理测试页面</h2>
    <el-button @click="testPermissionView">测试权限视图</el-button>
    <div v-if="showPermissionView">
      <RolePermissionView 
        role-id="1" 
        @saved="handlePermissionSaved"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RolePermissionView from '@/components/RolePermissionView.vue'

const showPermissionView = ref(false)

const testPermissionView = () => {
  showPermissionView.value = !showPermissionView.value
}

const handlePermissionSaved = () => {
  console.log('权限保存成功')
}
</script>

<style scoped>
.role-management-test {
  padding: 20px;
}
</style>