<template>
  <div class="app-container">
    <el-card class="box-card" shadow="hover" style="margin-bottom: 20px;">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="审核状态">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="待审核" value="Pending" />
            <el-option label="已通过" value="Approved" />
            <el-option label="已拒绝" value="Rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属文章">
          <el-input v-model="queryParams.articleId" placeholder="文章 ID" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="box-card" shadow="hover">
      <el-table v-loading="loading" :data="commentList" style="width: 100%" border>
        <el-table-column prop="content" label="评论内容" min-width="300">
          <template #default="scope">
            <div style="font-size: 14px; color: #333; margin-bottom: 5px;">{{ scope.row.content }}</div>
            <div style="font-size: 12px; color: #999;">
              评论于：<el-link type="primary" :underline="false">{{ scope.row.articleTitle }}</el-link>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="reviewerName" label="评论人" width="150" align="center">
          <template #default="scope">
            <el-avatar size="small" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" style="vertical-align: middle; margin-right: 5px;" />
            <span>{{ scope.row.reviewerName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'Pending'" type="warning">待审核</el-tag>
            <el-tag v-else-if="scope.row.status === 'Approved'" type="success">已通过</el-tag>
            <el-tag v-else-if="scope.row.status === 'Rejected'" type="danger">已拒绝</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdTime" label="评论时间" width="160" align="center">
          <template #default="scope">
            {{ formatTime(scope.row.createdTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <AuthButton
              v-if="scope.row.status === 'Pending'"
              :auth="ApiPerms.Comment.Audit"
              link type="success" size="small"
              @click="handleAudit(scope.row, 'Approved')"
            >
              通过
            </AuthButton>
            <AuthButton
              v-if="scope.row.status === 'Pending'"
              :auth="ApiPerms.Comment.Audit"
              link type="warning" size="small"
              @click="handleAudit(scope.row, 'Rejected')"
            >
              拒绝
            </AuthButton>
            <AuthButton :auth="ApiPerms.Comment.Delete" link type="danger" size="small" @click="handleDelete(scope.row)">
              删除
            </AuthButton>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <el-pagination
          v-model:current-page="queryParams.pageIndex"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'BlogComment' });

import { ref, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ApiPerms } from '@/constants/api-permissions';
import api from '@/utils/request';

const loading = ref(false);
const total = ref(0);
const commentList = ref<any[]>([]);
const queryParams = ref({ pageIndex: 1, pageSize: 10, status: '', articleId: '' });

// --- API ---
const fetchComments = async () => {
  loading.value = true;
  try {
    const params: any = {
      pageIndex: queryParams.value.pageIndex,
      pageSize: queryParams.value.pageSize,
    };
    if (queryParams.value.status) params.status = queryParams.value.status;
    if (queryParams.value.articleId) params.articleId = queryParams.value.articleId;

    const res = await api.get('/api/blog/comment/page', { params });
    commentList.value = res.data || [];
    total.value = res?.totalCount || 0;
  } catch {
    commentList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.value.pageIndex = 1;
  fetchComments();
};

watch(
  () => [queryParams.value.pageIndex, queryParams.value.pageSize],
  () => fetchComments(),
);

// --- 审核 ---
const handleAudit = async (row: any, targetStatus: string) => {
  const label = targetStatus === 'Approved' ? '通过' : '拒绝';
  ElMessageBox.confirm(`确认要${label}该条评论吗？`, '审核确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: targetStatus === 'Approved' ? 'success' : 'warning',
  })
    .then(async () => {
      await api.put(`/api/blog/comment/${row.id}/audit`, { id: row.id, status: targetStatus });
      row.status = targetStatus;
      ElMessage.success(`已${label}`);
    })
    .catch(() => {});
};

// --- 删除 ---
const handleDelete = (row: any) => {
  ElMessageBox.confirm('确认永久删除该评论吗？不可恢复。', '高危操作', { type: 'error' })
    .then(async () => {
      await api.delete(`/api/blog/comment/${row.id}`);
      ElMessage.success('已删除');
      fetchComments();
    })
    .catch(() => {});
};

const formatTime = (iso: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('zh-CN', { hour12: false });
};

onMounted(() => fetchComments());
</script>
