<template>
  <div class="app-container">
    <el-card class="box-card" shadow="hover" style="margin-bottom: 20px;">
      <el-button type="primary" icon="Plus" @click="handleAdd()">新增顶级菜单</el-button>
    </el-card>

    <el-card class="box-card" shadow="hover">
      <el-table 
        v-loading="loading" 
        :data="menuList" 
        row-key="id" 
        border 
        default-expand-all 
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="title" label="菜单名称" min-width="180" />
        <el-table-column prop="icon" label="图标" width="80" align="center">
          <template #default="scope">
            <el-icon v-if="scope.row.icon"><component :is="scope.row.icon" /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="路由Name" min-width="150" />
        <el-table-column prop="path" label="路由路径" min-width="180" />
        <el-table-column prop="component" label="组件路径" min-width="200" />
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleAdd(scope.row)">新增下级</el-button>
            <el-button link type="success" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        
        <el-form-item label="上级菜单" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="menuOptions"
            :props="{ label: 'title', value: 'id', children: 'children' }"
            placeholder="选择上级菜单 (不选则为顶级菜单)"
            clearable
            check-strictly
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="菜单标题" prop="title">
          <el-input v-model="form.title" placeholder="如: 用户管理 (UI侧边栏显示文本)" />
        </el-form-item>
        
        <el-form-item label="路由名称" prop="name">
          <el-input v-model="form.name" placeholder="如: SystemUser (必须与Vue组件内name一致)" />
        </el-form-item>

        <el-form-item label="路由路径" prop="path">
          <el-input v-model="form.path" placeholder="如: user (如果是顶级填 /system)" />
        </el-form-item>

        <el-form-item label="组件路径" prop="component">
          <el-input v-model="form.component" placeholder="如: system/user/index (顶级填 Layout)" />
        </el-form-item>

        <el-form-item label="菜单图标" prop="icon">
          <el-input v-model="form.icon" placeholder="Element Plus Icon 纯文本 (如: User)" />
        </el-form-item>

        <el-form-item label="显示排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="1" controls-position="right" />
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
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus';
import api from '@/utils/request';

// --- 状态定义 ---
const loading = ref(false);
const menuList = ref([]);
const menuOptions = ref([]); // 用于上级菜单下拉框

const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const formRef = ref<FormInstance>();

const form = ref({
  id: '',
  parentId: null,
  title: '',
  name: '',
  path: '',
  component: '',
  icon: '',
  sortOrder: 1
});

const rules = reactive({
  title: [{ required: true, message: '请输入菜单标题', trigger: 'blur' }],
  name: [{ required: true, message: '请输入路由名称', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路由路径', trigger: 'blur' }]
});

// --- 获取菜单树数据 ---
const getMenuList = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/identity/menus/tree');
    menuList.value = res.data || [];
    menuOptions.value = res.data || []; // 下拉框数据同样复用
  } finally {
    loading.value = false;
  }
};

// --- 操作逻辑 ---
const handleAdd = (row?: any) => {
  dialogTitle.value = '新增菜单';
  form.value = {
    id: '',
    parentId: row ? row.id : null, // 如果点击了某行的"新增下级"，自动带入 parentId
    title: '', name: '', path: '', component: '', icon: '', sortOrder: 1
  };
  dialogVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
};

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑菜单';
  form.value = { 
    id: row.id, parentId: row.parentId === '0' ? null : row.parentId, // 后端根节点可能是'0'，转换为 null 适配前端
    title: row.title, name: row.name, path: row.path, 
    component: row.component, icon: row.icon, sortOrder: row.sortOrder 
  };
  dialogVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        // 如果 parentId 为空，发送给后端时应处理为根节点（视您的后端 DDD 逻辑而定）
        const payload = { ...form.value, parentId: form.value.parentId || null };

        if (form.value.id) {
          await api.put(`/api/identity/menus/${form.value.id}`, payload);
        } else {
          await api.post('/api/identity/menus', payload);
        }
        ElMessage.success('操作成功');
        dialogVisible.value = false;
        getMenuList();
      } finally { submitLoading.value = false; }
    }
  });
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认删除菜单 "${row.title}"？（若有子菜单将一同删除或拒绝执行）`, '警告', { type: 'warning' })
    .then(async () => {
      await api.delete(`/api/identity/menus/${row.id}`);
      ElMessage.success('删除成功');
      getMenuList();
    }).catch(() => {});
};

const handleDialogClose = () => formRef.value?.resetFields();

onMounted(() => getMenuList());
</script>