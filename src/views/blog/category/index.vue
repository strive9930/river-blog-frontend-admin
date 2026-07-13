<template>
  <div class="app-container">
    <el-card class="box-card" shadow="hover" style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <el-form :inline="true" :model="queryParams" class="demo-form-inline" style="margin-bottom: -18px;">
          <el-form-item label="分类名称">
            <el-input v-model="queryParams.name" placeholder="搜索分类" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
          </el-form-item>
        </el-form>

        <div>
          <AuthButton :auth="ApiPerms.Category.Add" type="primary" plain @click="handleAdd(null)">
            新增顶层分类
          </AuthButton>
        </div>
      </div>
    </el-card>

    <el-card class="box-card" shadow="hover">
      <el-table
        v-loading="loading"
        :data="categoryTree"
        style="width: 100%"
        border
        row-key="id"
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="name" label="分类名称" min-width="180" />
        <el-table-column prop="slug" label="路由别名" width="150" align="center">
          <template #default="scope">
            <el-tag size="small" effect="plain">{{ scope.row.slug }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column prop="articleCount" label="文章数" width="100" align="center" />

        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="scope">
            <AuthButton :auth="ApiPerms.Category.Add" link type="primary" size="small" @click="handleAdd(scope.row)">
              添加子类
            </AuthButton>
            <AuthButton :auth="ApiPerms.Category.Edit" link type="primary" size="small" @click="handleEdit(scope.row)">
              编辑
            </AuthButton>
            <AuthButton :auth="ApiPerms.Category.Delete" link type="danger" size="small" @click="handleDelete(scope.row)">
              删除
            </AuthButton>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="上级分类" v-if="form.parentId">
          <el-input :model-value="parentName" disabled />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="如：后端架构" maxlength="50" />
        </el-form-item>
        <el-form-item label="路由别名" prop="slug">
          <el-input v-model="form.slug" placeholder="URL 友好名称，如：backend" maxlength="100" />
        </el-form-item>
        <el-form-item label="排序权重" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="分类描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="简单描述一下这个分类..." />
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
defineOptions({ name: 'BlogCategory' });

import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ApiPerms } from '@/constants/api-permissions';
import api from '@/utils/request';

// --- 数据状态 ---
const loading = ref(false);
const categoryTree = ref<any[]>([]);
const allcategorys = ref<any[]>([]); // 扁平化全量（用于前端搜索过滤）
const queryParams = reactive({ name: '' });

// --- 弹窗状态 ---
const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const parentName = ref('');
const formRef = ref();

const form = ref({
  id: '',
  parentId: null as string | null,
  name: '',
  slug: '',
  sortOrder: 0,
  description: '',
});

const rules = reactive({
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  slug: [{ required: true, message: '请输入路由别名', trigger: 'blur' }],
});

// --- API ---
const fetchcategorys = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/blog/category/tree');
    allcategorys.value = res.data || [];
    applyFilter();
  } catch {
    allcategorys.value = [];
    categoryTree.value = [];
  } finally {
    loading.value = false;
  }
};

const applyFilter = () => {
  const q = queryParams.name.toLowerCase();
  if (!q) {
    categoryTree.value = allcategorys.value;
    return;
  }
  // 递归过滤：保留匹配节点及其祖先链路
  categoryTree.value = filterTree(allcategorys.value, q);
};

const filterTree = (nodes: any[], q: string): any[] => {
  return nodes
    .map((node: any) => {
      const children = node.children ? filterTree(node.children, q) : [];
      if (node.name.toLowerCase().includes(q) || children.length > 0) {
        return { ...node, children };
      }
      return null;
    })
    .filter(Boolean) as any[];
};

const handleQuery = () => applyFilter();

// --- CRUD ---
const handleAdd = (parent: any) => {
  dialogTitle.value = parent ? `添加 [${parent.name}] 的子分类` : '新增顶层分类';
  parentName.value = parent ? parent.name : '';
  form.value = {
    id: '',
    parentId: parent ? parent.id : null,
    name: '',
    slug: '',
    sortOrder: 0,
    description: '',
  };
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑分类';
  form.value = {
    id: row.id,
    parentId: row.parentId || null,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sortOrder ?? 0,
    description: row.description || '',
  };
  dialogVisible.value = true;
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    `警告：删除分类 "${row.name}" 可能导致该类下的文章变成"未分类"状态，确认删除？`,
    '危险操作',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
  )
    .then(async () => {
      await api.delete(`/api/blog/category/${row.id}`);
      ElMessage.success('已删除');
      fetchcategorys();
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
    const payload = {
      name: form.value.name,
      slug: form.value.slug,
      description: form.value.description || null,
      parentId: form.value.parentId || null,
      sortOrder: form.value.sortOrder,
    };

    if (form.value.id) {
      await api.put(`/api/blog/category/${form.value.id}`, { id: form.value.id, ...payload });
    } else {
      await api.post('/api/blog/category', payload);
    }

    ElMessage.success('操作成功');
    dialogVisible.value = false;
    fetchcategorys();
  } finally {
    submitLoading.value = false;
  }
};

onMounted(() => fetchcategorys());
</script>
