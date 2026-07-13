<template>
  <el-button v-if="hasPermission" v-bind="$attrs">
    <slot></slot>
  </el-button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '@/store/modules/user';

// 接收外部传进来的 auth 权限标识 (字符串或数组)
const props = defineProps({
  auth: {
    type: [String, Array],
    required: true
  }
});

const userStore = useUserStore();

// 计算当前用户是否有权限显示这个按钮
const hasPermission = computed(() => {
  // 1. 超级管理员拥有所有权限，直接放行
  if (userStore.roles?.includes('Admin')) {
    return true;
  }
  
  // 2. 将传入的权限标识统一转为数组进行比对
  const requiredAuths = Array.isArray(props.auth) ? props.auth : [props.auth];
  
  // 3. 判断当前用户的权限集合中，是否包含该按钮要求的 API 权限
  const userPerms = userStore.permissions || [];
  return userPerms.some(perm => requiredAuths.includes(perm));
});
</script>