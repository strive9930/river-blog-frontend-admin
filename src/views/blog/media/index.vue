<template>
  <div class="app-container">
    <el-card class="box-card" shadow="hover" style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <el-form :inline="true" :model="queryParams" class="demo-form-inline" style="margin-bottom: -18px;">
          <el-form-item label="文件名">
            <el-input v-model="queryParams.keyword" placeholder="搜索文件" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
          </el-form-item>
        </el-form>
        <div>
          <AuthButton :auth="ApiPerms.Media.Upload" type="primary" plain @click="triggerUpload">
            上传图片
          </AuthButton>
          <input
            ref="fileInputRef"
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.webp,.svg"
            style="display: none"
            @change="handleFileChange"
          />
        </div>
      </div>
    </el-card>

    <el-card class="box-card" shadow="hover">
      <el-table v-loading="loading" :data="mediaList" style="width: 100%" border>
        <el-table-column label="预览" width="120" align="center">
          <template #default="scope">
            <el-image
              v-if="isImage(scope.row.contentType)"
              style="width: 80px; height: 60px; border-radius: 4px;"
              :src="scope.row.url"
              fit="cover"
              :preview-src-list="[scope.row.url]"
              preview-teleported
            />
            <el-icon v-else :size="32" color="#909399"><Document /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="fileName" label="文件名" min-width="200" show-overflow-tooltip />
        <el-table-column label="类型" width="120" align="center">
          <template #default="scope">
            <el-tag size="small" effect="plain">{{ formatType(scope.row.contentType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="大小" width="100" align="center">
          <template #default="scope">
            {{ formatSize(scope.row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="上传时间" width="160" align="center">
          <template #default="scope">
            {{ formatTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="URL" min-width="180">
          <template #default="scope">
            <div style="display: flex; align-items: center; gap: 6px;">
              <code style="font-size: 11px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ scope.row.url }}</code>
              <el-button link type="primary" size="small" @click="copyUrl(scope.row.url)">复制</el-button>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="scope">
            <AuthButton :auth="ApiPerms.Media.Delete" link type="danger" size="small" @click="handleDelete(scope.row)">
              删除
            </AuthButton>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <el-pagination
          v-model:current-page="queryParams.pageIndex"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[12, 24, 48]"
          :total="total"
          layout="total, sizes, prev, pager, next"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'BlogMedia' });

import { ref, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Document } from '@element-plus/icons-vue';
import { ApiPerms } from '@/constants/api-permissions';
import { getFileList, uploadImage, deleteFile } from '@/api/file';

const loading = ref(false);
const total = ref(0);
const mediaList = ref<any[]>([]);
const queryParams = ref({ pageIndex: 1, pageSize: 12, keyword: '' });
const fileInputRef = ref<HTMLInputElement>();

// --- API ---
const fetchMedia = async () => {
  loading.value = true;
  try {
    const params: any = {
      pageIndex: queryParams.value.pageIndex,
      pageSize: queryParams.value.pageSize,
      contentType: 'image/',
    };
    if (queryParams.value.keyword) params.keyword = queryParams.value.keyword;

    const res = await getFileList(params);
    mediaList.value = res.data?.data || [];
    total.value = res?.totalCount || 0;
  } catch {
    mediaList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.value.pageIndex = 1;
  fetchMedia();
};

watch(
  () => [queryParams.value.pageIndex, queryParams.value.pageSize],
  () => fetchMedia(),
);

// --- 上传 ---
const triggerUpload = () => fileInputRef.value?.click();

const handleFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const res = await uploadImage(file);
    ElMessage.success(`上传成功: ${res.data}`);
    fetchMedia();
  } catch {
    /* 错误已在拦截器中处理 */
  } finally {
    input.value = '';
  }
};

// --- 删除 ---
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认永久删除 "${row.fileName}" 吗？`, '高危操作', { type: 'error' })
    .then(async () => {
      await deleteFile(row.id);
      ElMessage.success('已删除');
      fetchMedia();
    })
    .catch(() => {});
};

// --- 工具 ---
const copyUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url);
    ElMessage.success('URL 已复制');
  } catch {
    ElMessage.error('复制失败');
  }
};

const isImage = (ct: string) => ct?.startsWith('image/');

const formatType = (ct: string) => {
  if (!ct) return '—';
  return ct.split('/')[1]?.toUpperCase() || ct;
};

const formatSize = (bytes: number) => {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

const formatTime = (iso: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('zh-CN', { hour12: false });
};

onMounted(() => fetchMedia());
</script>
