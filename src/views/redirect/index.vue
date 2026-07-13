<script setup lang="ts">
import { onBeforeMount } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { path } = route.params;

onBeforeMount(() => {
  const targetPath = Array.isArray(path) ? path.join('/') : path;
  router.replace({ path: '/' + targetPath, query: route.query });
});
</script>

<template>
  <div style="display: none;" />
</template>
