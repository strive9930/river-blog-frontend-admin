<template>
  <div class="app-container">
    <el-card class="box-card" shadow="hover" style="margin-bottom: 20px;">
      <el-button type="primary" icon="Plus" @click="handleAdd">发布动态</el-button>
    </el-card>

    <el-card class="box-card" shadow="hover">
      <el-table v-loading="loading" :data="tableData" style="width: 100%" border>
        <el-table-column prop="content" label="内容" min-width="300">
          <template #default="scope">
            <div style="font-size: 14px; color: #333; white-space: pre-wrap; word-break: break-word;">
              {{ scope.row.content }}
            </div>
            <div v-if="scope.row.imageUrls" style="margin-top: 6px; font-size: 12px; color: #8a919f;">
              📷 {{ scope.row.imageUrls }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="位置" width="120" align="center">
          <template #default="scope">
            <span v-if="scope.row.location">📍 {{ scope.row.location }}</span>
            <span v-else style="color: #c0c4cc">—</span>
          </template>
        </el-table-column>
        <el-table-column label="公开" width="70" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.isPublic ? 'success' : 'info'" size="small">
              {{ scope.row.isPublic ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdTime" label="发布时间" width="160" align="center">
          <template #default="scope">
            {{ formatTime(scope.row.createdTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
            <el-popconfirm title="确定要删除该动态吗？" @confirm="handleDelete(scope.row)">
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="550px" @close="resetForm">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="内容" prop="content">
          <el-input v-model="formData.content" type="textarea" :rows="5" placeholder="分享你的动态..." maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="图片" prop="imageUrls">
          <el-input v-model="formData.imageUrls" placeholder="图片 URL，多个用逗号分隔" />
        </el-form-item>
        <el-form-item label="位置" prop="location">
          <el-input v-model="formData.location" placeholder="如：北京" />
        </el-form-item>
        <el-form-item label="公开" prop="isPublic">
          <el-switch v-model="formData.isPublic" />
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
defineOptions({ name: 'BlogRecord' });

import { ref, reactive, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getRecordsAdmin, createRecord, updateRecord, deleteRecord } from '@/api/blog/record';

const loading = ref(false);
const total = ref(0);
const tableData = ref<any[]>([]);
const queryParams = reactive({ pageIndex: 1, pageSize: 10 });

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getRecordsAdmin({ pageIndex: queryParams.pageIndex, pageSize: queryParams.pageSize });
    tableData.value = res.data?.data || res.data || [];
    total.value = res.data?.totalCount || res?.totalCount || 0;
  } catch {
    tableData.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

watch(() => [queryParams.pageIndex, queryParams.pageSize], () => fetchData());

// --- 删除 ---
const handleDelete = (row: any) => {
  ElMessageBox.confirm('确认永久删除该动态吗？', '高危操作', { type: 'error' })
    .then(async () => {
      await deleteRecord(row.id);
      ElMessage.success('已删除');
      fetchData();
    }).catch(() => {});
};

// --- 弹窗 ---
const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const formRef = ref<any>(null);
const formData = reactive({
  id: null as string | null,
  content: '',
  imageUrls: '',
  location: '',
  isPublic: true,
});
const rules = {
  content: [{ required: true, message: '请输入动态内容', trigger: 'blur' }],
};

const handleAdd = () => {
  dialogTitle.value = '发布动态';
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑动态';
  formData.id = row.id;
  formData.content = row.content;
  formData.imageUrls = row.imageUrls || '';
  formData.location = row.location || '';
  formData.isPublic = row.isPublic;
  dialogVisible.value = true;
};

const resetForm = () => {
  formRef.value?.resetFields();
  formData.id = null;
  formData.content = '';
  formData.imageUrls = '';
  formData.location = '';
  formData.isPublic = true;
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      const payload = {
        content: formData.content,
        imageUrls: formData.imageUrls || null,
        location: formData.location || null,
        isPublic: formData.isPublic,
      };
      if (formData.id) {
        await updateRecord(formData.id, { id: formData.id, ...payload });
        ElMessage.success('更新成功');
      } else {
        await createRecord(payload);
        ElMessage.success('发布成功');
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
