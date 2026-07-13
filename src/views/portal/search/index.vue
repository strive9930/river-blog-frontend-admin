<template>
  <div class="search-page">
    <div class="search-header">
      <h2>搜索结果</h2>
      <p v-if="keyword">关键词：<strong>{{ keyword }}</strong>，共 {{ total }} 条结果</p>
    </div>

    <div v-loading="loading" class="result-list">
      <article v-for="item in list" :key="item.id" class="result-card" @click="$router.push(`/article/${item.id}`)">
        <h3 class="result-title">{{ item.title }}</h3>
        <p class="result-summary" v-html="highlight(item.summary || '')" />
        <div class="result-meta">
          <span>{{ formatDate(item.createdTime || item.createTime) }}</span>
          <span v-if="item.categoryName">{{ item.categoryName }}</span>
        </div>
      </article>
      <el-empty v-if="!loading && list.length === 0" description="未找到相关文章" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'PortalSearch' });

import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getPublicArticles } from '@/api/portal';

const route = useRoute();
const loading = ref(false);
const keyword = ref('');
const total = ref(0);
const list = ref<any[]>([]);

const highlight = (text: string) => {
  if (!keyword.value) return text;
  const re = new RegExp(`(${keyword.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(re, '<em style="color:#e6a23c;font-style:normal">$1</em>');
};

onMounted(async () => {
  keyword.value = (route.query.q as string) || '';
  if (!keyword.value) return;
  loading.value = true;
  try {
    const res = await getPublicArticles({ pageIndex: 1, pageSize: 20, keyword: keyword.value, status: 'Published' });
    list.value = res.data?.data || res.data || [];
    total.value = res.data?.totalCount || list.value.length;
  } catch { list.value = []; } finally { loading.value = false; }
});

const formatDate = (d: string) => { if (!d) return ''; const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; };
</script>

<style scoped>
.search-page { max-width: 800px; margin: 0 auto; }
.search-header { margin-bottom: 24px; }
.search-header h2 { font-size: 22px; color: #1d2129; margin: 0 0 6px; }
.search-header p { font-size: 14px; color: #8a919f; margin: 0; }
.result-card { background: #fff; border-radius: 8px; padding: 20px 24px; margin-bottom: 12px; cursor: pointer; border: 1px solid #f0f0f0; transition: all .2s; }
.result-card:hover { border-color: #1e80ff; box-shadow: 0 2px 8px rgba(30,128,255,.08); }
.result-title { font-size: 17px; color: #1d2129; margin: 0 0 8px; }
.result-summary { font-size: 13px; color: #8a919f; margin: 0 0 10px; line-height: 1.6; }
.result-meta { font-size: 12px; color: #c0c4cc; display: flex; gap: 14px; }
</style>
