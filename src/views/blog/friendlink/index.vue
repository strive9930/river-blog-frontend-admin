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
        <el-table-column prop="siteName" label="站点名称" width="180" />
        <el-table-column label="链接" min-width="200">
          <template #default="scope">
            <el-link type="primary" :href="scope.row.url" target="_blank" :underline="false">
              {{ scope.row.url }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="站长" width="120" align="center" />
        <el-table-column prop="siteDescription" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="置顶" width="70" align="center">
          <template #default="scope">
            <el-icon v-if="scope.row.isTop" color="#f59e0b" :size="18"><StarFilled /></el-icon>
            <span v-else style="color:#c0c4cc">—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'Pending'" type="warning">待审核</el-tag>
            <el-tag v-else-if="scope.row.status === 'Approved'" type="success">已通过</el-tag>
            <el-tag v-else-if="scope.row.status === 'Rejected'" type="danger">已拒绝</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdTime" label="申请时间" width="160" align="center">
          <template #default="scope">
            {{ formatTime(scope.row.createdTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="scope">
            <AuthButton
              v-if="scope.row.status === 'Pending'"
              :auth="ApiPerms.FriendLink.Audit"
              link type="success" size="small"
              @click="handleAudit(scope.row, 'Approved')"
            >
              通过
            </AuthButton>
            <AuthButton
              v-if="scope.row.status === 'Pending'"
              :auth="ApiPerms.FriendLink.Audit"
              link type="warning" size="small"
              @click="handleAudit(scope.row, 'Rejected')"
            >
              拒绝
            </AuthButton>
            <el-button
              link type="primary" size="small"
              @click="handleToggleTop(scope.row)"
            >
              {{ scope.row.isTop ? '取消置顶' : '置顶' }}
            </el-button>
            <el-button link type="primary" size="small" icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
            <el-popconfirm title="确定要删除该友链吗？" @confirm="handleDelete(scope.row)">
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

    <!-- 编辑弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="550px" @close="resetForm">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="站点名称" prop="siteName">
          <el-input v-model="formData.siteName" placeholder="如：张三的博客" />
        </el-form-item>
        <el-form-item label="站点链接" prop="url">
          <el-input v-model="formData.url" placeholder="https://example.com" />
        </el-form-item>
        <el-form-item label="站点描述" prop="siteDescription">
          <el-input v-model="formData.siteDescription" type="textarea" :rows="3" placeholder="简单描述一下这个站点" />
        </el-form-item>
        <el-form-item label="站长昵称" prop="owner">
          <el-input v-model="formData.owner" placeholder="对方昵称" />
        </el-form-item>
        <el-form-item label="头像 URL" prop="avatarUrl">
          <el-input v-model="formData.avatarUrl" placeholder="可选，头像图片地址" />
        </el-form-item>
        <el-form-item label="RSS 地址" prop="rssUrl">
          <el-input v-model="formData.rssUrl" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'BlogFriendLink' });

import { ref, reactive, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ApiPerms } from '@/constants/api-permissions';
import { getFriendLinksAdmin, createFriendLink, updateFriendLink, deleteFriendLink, auditFriendLink, toggleTopFriendLink } from '@/api/blog/friendlink';

const loading = ref(false);
const total = ref(0);
const tableData = ref<any[]>([]);
const queryParams = reactive({ pageIndex: 1, pageSize: 10, status: '' });

const fetchData = async () => {
  loading.value = true;
  try {
    const params: any = { pageIndex: queryParams.pageIndex, pageSize: queryParams.pageSize };
    if (queryParams.status) params.status = queryParams.status;
    const res = await getFriendLinksAdmin(params);
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

// --- 审核 ---
const handleAudit = async (row: any, targetStatus: string) => {
  const label = targetStatus === 'Approved' ? '通过' : '拒绝';
  const statusCode = targetStatus === 'Approved' ? 1 : 2;
  ElMessageBox.confirm(`确认要${label}该友链申请吗？`, '审核确认', {
    confirmButtonText: '确定', cancelButtonText: '取消',
    type: targetStatus === 'Approved' ? 'success' : 'warning',
  }).then(async () => {
    await auditFriendLink(row.id, statusCode);
    row.status = targetStatus;
    ElMessage.success(`已${label}`);
  }).catch(() => {});
};

// --- 置顶切换 ---
const handleToggleTop = async (row: any) => {
  try {
    await toggleTopFriendLink(row.id);
    row.isTop = !row.isTop;
    ElMessage.success(row.isTop ? '已置顶' : '已取消置顶');
  } catch { /* */ }
};

// --- 删除 ---
const handleDelete = (row: any) => {
  ElMessageBox.confirm('确认永久删除该友链吗？', '高危操作', { type: 'error' })
    .then(async () => {
      await deleteFriendLink(row.id);
      ElMessage.success('已删除');
      fetchData();
    }).catch(() => {});
};

// --- 弹窗编辑 ---
const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const formRef = ref<any>(null);
const formData = reactive({
  id: null as string | null,
  siteName: '',
  url: '',
  siteDescription: '',
  owner: '',
  avatarUrl: '',
  rssUrl: '',
});
const rules = {
  siteName: [{ required: true, message: '请输入站点名称', trigger: 'blur' }],
  url: [{ required: true, message: '请输入站点链接', trigger: 'blur' }],
  siteDescription: [{ required: true, message: '请输入站点描述', trigger: 'blur' }],
  owner: [{ required: true, message: '请输入站长昵称', trigger: 'blur' }],
};

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑友链';
  formData.id = row.id;
  formData.siteName = row.siteName;
  formData.url = row.url;
  formData.siteDescription = row.siteDescription;
  formData.owner = row.owner;
  formData.avatarUrl = row.avatarUrl || '';
  formData.rssUrl = row.rssUrl || '';
  dialogVisible.value = true;
};

const resetForm = () => {
  formRef.value?.resetFields();
  formData.id = null;
  formData.siteName = '';
  formData.url = '';
  formData.siteDescription = '';
  formData.owner = '';
  formData.avatarUrl = '';
  formData.rssUrl = '';
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      const payload = { ...formData };
      if (formData.id) {
        await updateFriendLink(formData.id, payload);
        ElMessage.success('更新成功');
      } else {
        await createFriendLink(payload);
        ElMessage.success('创建成功');
      }
      dialogVisible.value = false;
      fetchData();
    } catch { /* */ } finally { submitLoading.value = false; }
  });
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
