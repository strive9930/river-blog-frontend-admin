<template>
  <div class="app-container">
    <el-card class="box-card" shadow="hover" style="margin-bottom: 20px;">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="角色名称">
          <el-input v-model="queryParams.keyword" placeholder="请输入角色名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="box-card" shadow="hover">
      <div style="margin-bottom: 15px;">
        <el-button type="primary" plain @click="handleAdd">新增角色</el-button>
      </div>

      <el-table v-loading="loading" :data="roleList" border style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="角色编码" min-width="120" />
        <el-table-column prop="description" label="角色描述" min-width="180" />
        <el-table-column label="操作" width="250" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="success" size="small" @click="handleAssignPermission(scope.row)">分配权限</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link type="danger" size="small" :disabled="scope.row.name === 'Admin'" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <el-pagination
          v-model:current-page="queryParams.pageIndex"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="角色编码" prop="name">
          <el-input v-model="form.name" placeholder="如: Admin, Editor" :disabled="form.name === 'Admin'" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入角色描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="permissionDialogVisible" title="分配权限 (双域解耦)" width="650px" destroy-on-close>
      <el-tabs v-model="activeTab" class="demo-tabs">
        
        <el-tab-pane label="🌐 UI 页面菜单" name="menu">
          <div style="height: 400px; overflow-y: auto;">
            <el-tree
              ref="menuTreeRef"
              :data="menuTreeData"
              show-checkbox
              node-key="id"
              :props="{ label: 'title', children: 'children' }"
              default-expand-all
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="⚙️ 后端 API 接口" name="api">
          <div style="height: 400px; overflow-y: auto;">
            <el-tree
              ref="apiTreeRef"
              :data="apiTreeData"
              show-checkbox
              node-key="id"
              :props="{ label: 'label', children: 'children' }"
            >
               <template #default="{ node, data }">
                 <span class="custom-tree-node">
                   <el-tag 
                     v-if="data.method" 
                     :type="getMethodTagType(data.method)" 
                     size="small" 
                     style="margin-right: 8px"
                   >
                     {{ data.method }}
                   </el-tag>
                   <span>{{ node.label }}</span>
                 </span>
               </template>
            </el-tree>
          </div>
        </el-tab-pane>

      </el-tabs>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitPermission">保存全部权限</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus';
import api from '@/utils/request';

// --- 基础状态 ---
const loading = ref(false);
const roleList = ref([]);
const total = ref(0);
const queryParams = ref({ pageIndex: 1, pageSize: 10, keyword: '' });

// --- 表单状态 ---
const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const formRef = ref<FormInstance>();
const form = ref({ id: '', name: '', description: '' });
const rules = reactive({ name: [{ required: true, message: '请输入角色编码', trigger: 'blur' }] });

// --- 🌟 权限分配状态 ---
const permissionDialogVisible = ref(false);
const activeTab = ref('menu'); // 默认显示菜单 tab
const currentRoleId = ref('');
const menuTreeData = ref([]);
const menuTreeRef = ref();
const apiTreeData = ref([]);
const apiTreeRef = ref();

// 辅助：获取 Method 对应颜色
const getMethodTagType = (method: string) => {
  const map: Record<string, string> = { GET: 'success', POST: 'warning', PUT: 'primary', DELETE: 'danger' };
  return map[method?.toUpperCase()] || 'info';
};

// --- 列表与 CRUD 逻辑 ---
const getRoleList = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/identity/roles/page', { params: queryParams.value });
    roleList.value = res.data || [];
    total.value = res.totalCount || 0;
  } finally {
    loading.value = false;
  }
};
const handleQuery = () => { queryParams.value.pageIndex = 1; getRoleList(); };
const handleSizeChange = (val: number) => { queryParams.value.pageSize = val; getRoleList(); };
const handleCurrentChange = (val: number) => { queryParams.value.pageIndex = val; getRoleList(); };

const handleAdd = () => {
  dialogTitle.value = '新增角色';
  form.value = { id: '', name: '', description: '' };
  dialogVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
};

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑角色';
  form.value = { id: row.id, name: row.name, description: row.description };
  dialogVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        if (form.value.id) await api.put(`/api/identity/roles/${form.value.id}`, form.value);
        else await api.post('/api/identity/roles', form.value);
        ElMessage.success('操作成功');
        dialogVisible.value = false;
        getRoleList();
      } finally { submitLoading.value = false; }
    }
  });
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认删除角色 "${row.name}"？`, '警告', { type: 'warning' }).then(async () => {
    await api.delete(`/api/identity/roles/${row.id}`);
    ElMessage.success('删除成功');
    getRoleList();
  }).catch(() => {});
};
const handleDialogClose = () => formRef.value?.resetFields();

// --- 🌟 双域权限分配核心逻辑 ---
const handleAssignPermission = async (row: any) => {
  currentRoleId.value = row.id;
  activeTab.value = 'menu';
  permissionDialogVisible.value = true;
  
  try {
    // === 1. 渲染 UI 菜单树 ===
    const menuTreeRes = await api.get('/api/identity/menus/tree');
    menuTreeData.value = menuTreeRes.data || [];
    
    const roleMenusRes = await api.get(`/api/identity/roles/${row.id}/menus`);
    const backendMenuIds = roleMenusRes.data || [];
    const allMenuLeafIds: string[] = [];
    const extractMenuLeafs = (nodes: any[]) => {
      nodes.forEach(n => n.children?.length > 0 ? extractMenuLeafs(n.children) : allMenuLeafIds.push(n.id));
    };
    extractMenuLeafs(menuTreeData.value);
    const leafMenuKeys = backendMenuIds.filter((id: string) => allMenuLeafIds.includes(id));
    
    // === 2. 渲染 后端 API 树 ===
    const apiTreeRes = await api.get('/api/identity/apiresources/tree');
    apiTreeData.value = apiTreeRes.data || [];
    
    const roleApisRes = await api.get(`/api/identity/roles/${row.id}/apis`);
    const backendApiIds = roleApisRes.data || [];
    const allApiLeafIds: string[] = [];
    const extractApiLeafs = (nodes: any[]) => {
      nodes.forEach(n => n.children?.length > 0 ? extractApiLeafs(n.children) : allApiLeafIds.push(n.id));
    };
    extractApiLeafs(apiTreeData.value);
    const leafApiKeys = backendApiIds.filter((id: string) => allApiLeafIds.includes(id));

    // === 3. 执行视图回显打勾 ===
    nextTick(() => {
      menuTreeRef.value?.setCheckedKeys(leafMenuKeys);
      apiTreeRef.value?.setCheckedKeys(leafApiKeys);
    });
  } catch (error) {
    ElMessage.error('获取权限数据失败，请确保相关后端接口已就绪');
  }
};

const submitPermission = async () => {
  submitLoading.value = true;
  try {
    // 1. 获取菜单 UI IDs (包含半选父节点)
    const menuChecked = menuTreeRef.value?.getCheckedKeys() || [];
    const menuHalfChecked = menuTreeRef.value?.getHalfCheckedKeys() || [];
    const finalMenuIds = [...menuChecked, ...menuHalfChecked];

    // 2. 获取 API IDs (通常只取叶子节点的真实 API ID，过滤掉分组的虚拟 ID)
    const apiChecked = apiTreeRef.value?.getCheckedKeys() || [];
    const finalApiIds = apiChecked.filter((id: string) => !id.toString().startsWith('group_'));

    // 并行发送请求给后端保存
    await Promise.all([
      api.post(`/api/identity/roles/${currentRoleId.value}/menus`, { menuIds: finalMenuIds }),
      api.post(`/api/identity/roles/${currentRoleId.value}/apis`, { apiIds: finalApiIds })
    ]);

    ElMessage.success('系统权限分配成功！');
    permissionDialogVisible.value = false;
  } catch (error) {
    // 错误统一由拦截器处理
  } finally {
    submitLoading.value = false;
  }
};

onMounted(() => getRoleList());
</script>

<style scoped>
.custom-tree-node {
  display: flex;
  align-items: center;
  font-size: 14px;
}
</style>