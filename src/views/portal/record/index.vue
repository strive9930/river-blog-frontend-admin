<template>
  <div class="record-page">
    <h2 class="page-title">💬 说说</h2>
    <p class="page-desc">一些碎碎念和日常动态</p>

    <div class="record-list" v-loading="loading">
      <el-empty v-if="!loading && records.length === 0" description="暂无动态" :image-size="80" />

      <div class="record-item" v-for="item in records" :key="item.id">
        <div class="record-header">
          <span class="record-time">📅 {{ formatTime(item.createdTime) }}</span>
          <span class="record-location" v-if="item.location">📍 {{ item.location }}</span>
        </div>
        <div class="record-body">
          <p class="record-content">{{ item.content }}</p>
          <div class="record-images" v-if="imageList(item.imageUrls).length > 0">
            <el-image
              v-for="(img, idx) in imageList(item.imageUrls)"
              :key="idx"
              :src="img"
              fit="cover"
              lazy
              class="record-image"
              :preview-src-list="imageList(item.imageUrls)"
              :initial-index="idx"
            />
          </div>
        </div>
      </div>

      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="queryParams.pageIndex"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20]"
          layout="total, prev, pager, next"
          background
          @current-change="fetchRecords"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'PortalRecords' });

import { ref, reactive, onMounted } from 'vue';
import { getPublicRecords } from '@/api/portal';

const loading = ref(false);
const records = ref<any[]>([]);
const total = ref(0);
const queryParams = reactive({ pageIndex: 1, pageSize: 10 });

const fetchRecords = async () => {
  loading.value = true;
  try {
    const res = await getPublicRecords({ pageIndex: queryParams.pageIndex, pageSize: queryParams.pageSize });
    records.value = res.data?.data || res.data || [];
    total.value = res.data?.totalCount || res?.totalCount || 0;
  } catch {
    records.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const imageList = (urls: string | null | undefined): string[] => {
  if (!urls) return [];
  return urls.split(',').map((s) => s.trim()).filter(Boolean);
};

const formatTime = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

onMounted(() => fetchRecords());
</script>

<style scoped>
.record-page { max-width: 700px; margin: 0 auto; }
.page-title { font-size: 24px; color: #1d2129; margin: 0 0 6px; }
.page-desc { font-size: 14px; color: #8a919f; margin: 0 0 28px; }

.record-item {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 20px 24px;
  margin-bottom: 16px;
  transition: all .2s;
}
.record-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,.04); }

.record-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #8a919f;
}
.record-content {
  font-size: 15px;
  color: #4e5969;
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.record-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.record-image {
  width: 120px;
  height: 120px;
  border-radius: 6px;
  cursor: pointer;
  object-fit: cover;
}

.pagination-wrapper { margin-top: 24px; display: flex; justify-content: center; }
</style>
