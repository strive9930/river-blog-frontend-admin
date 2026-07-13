<template>
  <div class="archives-page">
    <h2 class="page-title">📅 文章归档</h2>

    <div v-loading="loading">
      <template v-for="group in timeline" :key="group.year">
        <h3 class="year-heading">{{ group.year }}</h3>
        <div class="timeline">
          <div v-for="item in group.items" :key="item.id" class="timeline-item" @click="$router.push(`/article/${item.id}`)">
            <div class="timeline-dot" />
            <div class="timeline-content">
              <span class="tl-date">{{ formatMonth(item.createdTime || item.createTime) }}</span>
              <span class="tl-title">{{ item.title }}</span>
            </div>
          </div>
        </div>
      </template>
      <el-empty v-if="!loading && timeline.length === 0" description="暂无文章" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'PortalArchives' });

import { ref, onMounted } from 'vue';
import { getPublicArticles } from '@/api/portal';

const loading = ref(false);
const timeline = ref<any[]>([]);

onMounted(async () => {
  loading.value = true;
  try {
    const res = await getPublicArticles({ pageSize: 200, status: 'Published' });
    const list = res.data?.data || res.data || [];
    const map: Record<string, any[]> = {};
    list.forEach((a: any) => {
      const d = new Date(a.createdTime || a.createTime);
      const y = d.getFullYear();
      if (!map[y]) map[y] = [];
      map[y].push(a);
    });
    timeline.value = Object.entries(map)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, items]) => ({ year, items }));
  } catch { timeline.value = []; } finally { loading.value = false; }
});

const formatMonth = (d: string) => {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getMonth() + 1}月${dt.getDate()}日`;
};
</script>

<style scoped>
.archives-page { max-width: 700px; margin: 0 auto; }
.page-title { font-size: 24px; color: #1d2129; margin: 0 0 32px; }
.year-heading { font-size: 20px; color: #1d2129; margin: 28px 0 14px; padding-left: 8px; border-left: 3px solid #1e80ff; }
.timeline { position: relative; padding-left: 20px; border-left: 1px solid #e5e6eb; margin-left: 8px; }
.timeline-item { display: flex; align-items: baseline; gap: 14px; padding: 8px 0; cursor: pointer; transition: .15s; }
.timeline-item:hover .tl-title { color: #1e80ff; }
.timeline-dot { width: 8px; height: 8px; border-radius: 50%; background: #c0c4cc; flex-shrink: 0; margin-top: 6px; margin-left: -24px; }
.timeline-item:hover .timeline-dot { background: #1e80ff; }
.tl-date { font-size: 12px; color: #c0c4cc; min-width: 56px; }
.tl-title { font-size: 15px; color: #4e5969; transition: .15s; }
</style>
