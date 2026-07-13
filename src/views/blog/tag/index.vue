<template>
  <div class="app-container">
    <el-card class="box-card" shadow="hover" style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <el-form :inline="true" :model="queryParams" class="demo-form-inline" style="margin-bottom: -18px;">
          <el-form-item label="标签名称">
            <el-input v-model="queryParams.keyword" placeholder="搜索标签" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
          </el-form-item>
        </el-form>
        <div>
          <AuthButton :auth="ApiPerms.Tag.Add" type="primary" plain @click="handleAdd">
            新增标签
          </AuthButton>
        </div>
      </div>
    </el-card>

    <el-card class="box-card" shadow="hover">
      <el-table v-loading="loading" :data="tagList" style="width: 100%" border>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="标签名称" min-width="150" align="center">
          <template #default="scope">
            <el-tag effect="plain">{{ scope.row.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="slug" label="别名" width="150" align="center">
          <template #default="scope">
            <code style="font-size: 12px;">{{ scope.row.slug }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="articleCount" label="关联文章数" width="120" align="center" />

        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <AuthButton :auth="ApiPerms.Tag.Edit" link type="primary" size="small" @click="handleEdit(scope.row)">编辑</AuthButton>
            <AuthButton :auth="ApiPerms.Tag.Delete" link type="danger" size="small" @click="handleDelete(scope.row)">删除</AuthButton>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <el-pagination
          v-model:current-page="queryParams.pageIndex"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, prev, pager, next"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="450px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="form.name" placeholder="如：微服务、Vue3" maxlength="50" />
        </el-form-item>
        <el-form-item label="路由别名" prop="slug">
          <el-input v-model="form.slug" placeholder="URL 友好名称，如：microservice" maxlength="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'BlogTag' });

import { ref, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ApiPerms } from '@/constants/api-permissions';
import api from '@/utils/request';

const loading = ref(false);
const total = ref(0);
const tagList = ref<any[]>([]);
const queryParams = ref({ pageIndex: 1, pageSize: 10, keyword: '' });

const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const formRef = ref();
const form = ref({ id: '', name: '', slug: '' });
const rules = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  slug: [{ required: true, message: '请输入路由别名', trigger: 'blur' }],
};

// --- API ---
const fetchTags = async () => {
  loading.value = true;
  try {
    const params: any = {
      pageIndex: queryParams.value.pageIndex,
      pageSize: queryParams.value.pageSize,
    };
    if (queryParams.value.keyword) params.keyword = queryParams.value.keyword;

    const res = await api.get('/api/blog/tag/page', { params });
    tagList.value = res.data || [];
    total.value = res?.totalCount || 0;
  } catch {
    tagList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.value.pageIndex = 1;
  fetchTags();
};

watch(
  () => [queryParams.value.pageIndex, queryParams.value.pageSize],
  () => fetchTags(),
);

// --- CRUD ---
const handleAdd = () => {
  dialogTitle.value = '新增标签';
  form.value = { id: '', name: '', slug: '' };
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑标签';
  form.value = { id: row.id, name: row.name, slug: row.slug };
  dialogVisible.value = true;
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    `确认删除标签 "${row.name}" 吗？该操作不会删除关联的文章。`,
    '提示',
    { type: 'warning' },
  )
    .then(async () => {
      await api.delete(`/api/blog/tag/${row.id}`);
      ElMessage.success('已删除');
      fetchTags();
    })
    .catch(() => {});
};

const handleDialogClose = () => formRef.value?.resetFields();

const submitForm = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  submitLoading.value = true;
  try {
    const payload = { name: form.value.name, slug: form.value.slug };
    if (form.value.id) {
      await api.put(`/api/blog/tag/${form.value.id}`, { id: form.value.id, ...payload });
    } else {
      await api.post('/api/blog/tag', payload);
    }
    ElMessage.success('操作成功');
    dialogVisible.value = false;
    fetchTags();
  } finally {
    submitLoading.value = false;
  }
};

onMounted(() => fetchTags());
</script>
