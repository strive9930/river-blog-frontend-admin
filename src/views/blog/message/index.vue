<template>
  <div class="app-container">
    <el-card class="box-card" shadow="hover" style="margin-bottom: 20px;">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="审核状态">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="待审核" value="Pending" />
            <el-option label="已通过" value="Approved" />
            <el-option label="已拒绝" value="Rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="box-card" shadow="hover">
      <el-table v-loading="loading" :data="tableData" style="width: 100%" border>
        <el-table-column prop="nickname" label="留言者" width="140" align="center" />
        <el-table-column prop="content" label="留言内容" min-width="300">
          <template #default="scope">
            <div style="font-size: 14px; color: #333; white-space: pre-wrap; word-break: break-word;">
              {{ scope.row.content }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="contact" label="联系方式" width="180" align="center">
          <template #default="scope">
            <span v-if="scope.row.contact">{{ scope.row.contact }}</span>
            <span v-else style="color: #c0c4cc">—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'Pending'" type="warning">待审核</el-tag>
            <el-tag v-else-if="scope.row.status === 'Approved'" type="success">已通过</el-tag>
            <el-tag v-else-if="scope.row.status === 'Rejected'" type="danger">已拒绝</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdTime" label="留言时间" width="160" align="center">
          <template #default="scope">
            {{ formatTime(scope.row.createdTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <AuthButton
              v-if="scope.row.status === 'Pending'"
              :auth="ApiPerms.Message.Audit"
              link type="success" size="small"
              @click="handleAudit(scope.row, 'Approved')"
            >
              通过
            </AuthButton>
            <AuthButton
              v-if="scope.row.status === 'Pending'"
              :auth="ApiPerms.Message.Audit"
              link type="warning" size="small"
              @click="handleAudit(scope.row, 'Rejected')"
            >
              拒绝
            </AuthButton>
            <el-popconfirm title="确定要删除该留言吗？" @confirm="handleDelete(scope.row)">
              <template #reference>
                <el-button link type="danger" size="small" icon="Delete">删除</el-button>
              </template>
            </el-popconfirm>
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
defineOptions({ name: 'BlogMessage' });

import { ref, reactive, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ApiPerms } from '@/constants/api-permissions';
import { getMessagesAdmin, auditMessage, deleteMessage } from '@/api/blog/message';

const loading = ref(false);
const total = ref(0);
const tableData = ref<any[]>([]);
const queryParams = reactive({ pageIndex: 1, pageSize: 10, status: '' });

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getMessagesAdmin({ pageIndex: queryParams.pageIndex, pageSize: queryParams.pageSize, status: queryParams.status || undefined });
    tableData.value = res.data?.data || res.data || [];
    total.value = res.data?.totalCount || res?.totalCount || 0;
  } catch {
    tableData.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => { queryParams.pageIndex = 1; fetchData(); };

watch(() => [queryParams.pageIndex, queryParams.pageSize], () => fetchData());

const handleAudit = async (row: any, targetStatus: string) => {
  const label = targetStatus === 'Approved' ? '通过' : '拒绝';
  ElMessageBox.confirm(`确认要${label}该留言吗？`, '审核确认', {
    confirmButtonText: '确定', cancelButtonText: '取消',
    type: targetStatus === 'Approved' ? 'success' : 'warning',
  }).then(async () => {
    await auditMessage(row.id, targetStatus);
    row.status = targetStatus;
    ElMessage.success(`已${label}`);
  }).catch(() => {});
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确认永久删除该留言吗？', '高危操作', { type: 'error' })
    .then(async () => {
      await deleteMessage(row.id);
      ElMessage.success('已删除');
      fetchData();
    }).catch(() => {});
};

const formatTime = (iso: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('zh-CN', { hour12: false });
};

onMounted(() => fetchData());
</script>

<style scoped>
.app-container { padding: 20px; background-color: #fff; border-radius: 4px; }
</style>
