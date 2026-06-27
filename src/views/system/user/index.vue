<template>
  <div class="app-container">
    <el-card class="box-card" shadow="hover" style="margin-bottom: 20px;">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="关键字">
          <el-input 
            v-model="queryParams.keyword" 
            placeholder="请输入账号或姓名" 
            clearable 
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="box-card" shadow="hover">
      <div style="margin-bottom: 15px;">
        <el-button type="primary" plain @click="handleAdd">新增用户</el-button>
        <el-button type="danger" plain :disabled="multipleSelection.length === 0">批量删除</el-button>
      </div>

      <el-table 
        v-loading="loading" 
        :data="userList" 
        style="width: 100%" 
        border 
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="username" label="登录账号" min-width="120" />
        <el-table-column prop="realName" label="真实姓名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-switch 
              v-model="scope.row.isActive" 
              active-color="#13ce66" 
              inactive-color="#ff4949"
              disabled
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="warning" size="small" @click="handleAssignRole(scope.row)">分配角色</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
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

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        label-width="80px"
      >
        <el-form-item label="登录账号" prop="username">
          <el-input v-model="form.username" placeholder="请输入登录账号" :disabled="!!form.id" />
        </el-form-item>
        
        <el-form-item v-if="!form.id" label="登录密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>

        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="电子邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入电子邮箱" />
        </el-form-item>
        <el-form-item label="用户状态" prop="isActive">
          <el-switch v-model="form.isActive" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
    <el-dialog v-model="roleDialogVisible" title="分配角色" width="500px">
      <el-form label-width="80px">
        <el-form-item label="当前用户">
          <el-input v-model="currentUser.username" disabled />
        </el-form-item>
        <el-form-item label="选择角色">
          <el-select 
            v-model="selectedRoleIds" 
            multiple 
            placeholder="请选择角色 (可多选)" 
            style="width: 100%"
          >
            <el-option
              v-for="item in allRoles"
              :key="item.id"
              :label="item.name + (item.description ? ` (${item.description})` : '')"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="roleDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitUserRoles">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus';
import api from '@/utils/request';

// --- 列表查询状态 ---
const loading = ref(false);
const userList = ref([]);
const total = ref(0);
const multipleSelection = ref([]);

const queryParams = ref({
  pageIndex: 1,
  pageSize: 10,
  keyword: ''
});
// --- 🌟 用户分配角色状态与逻辑 ---
const roleDialogVisible = ref(false);
const allRoles = ref<any[]>([]);
const selectedRoleIds = ref<string[]>([]);
const currentUser = ref<any>({});

// --- 表单弹窗状态 ---
const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const formRef = ref<FormInstance>();

// 表单数据模型
const form = ref({
  id: '',
  username: '',
  password: '',
  realName: '',
  email: '',
  isActive: true
});

// 表单验证规则
const rules = reactive({
  username: [
    { required: true, message: '请输入登录账号', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度不能小于 6 位', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入电子邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ]
});

// 打开分配角色弹窗
const handleAssignRole = async (row: any) => {
  currentUser.value = row;
  roleDialogVisible.value = true;
  
  try {
    // 1. 获取系统中所有的角色字典 (如果您的接口分页了，这里最好调一个获取全部角色的专设接口)
    const roleRes = await api.get('/api/identity/roles?pageSize=1000');
    allRoles.value = roleRes.data || [];

    // 2. 获取该用户目前已经拥有的角色 ID
    const userRolesRes = await api.get(`/api/identity/users/${row.id}/roles`);
    selectedRoleIds.value = userRolesRes.data || []; 
  } catch (error) {
    ElMessage.error('获取角色数据失败');
  }
};

// 提交用户角色
const submitUserRoles = async () => {
  submitLoading.value = true;
  try {
    await api.post(`/api/identity/users/${currentUser.value.id}/roles`, {
      roleIds: selectedRoleIds.value
    });
    ElMessage.success('角色分配成功');
    roleDialogVisible.value = false;
  } finally {
    submitLoading.value = false;
  }
};


// --- 数据获取逻辑 ---
const getUserList = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/identity/users/page', { params: queryParams.value });
    userList.value = res.data || [];
    total.value = res.totalCount || 0;
  } catch (error) {
    userList.value = [];
  } finally {
    loading.value = false;
  }
};

// --- 列表交互逻辑 ---
const handleQuery = () => {
  queryParams.value.pageIndex = 1;
  getUserList();
};

const resetQuery = () => {
  queryParams.value.keyword = '';
  handleQuery();
};

const handleSizeChange = (val: number) => {
  queryParams.value.pageSize = val;
  getUserList();
};

const handleCurrentChange = (val: number) => {
  queryParams.value.pageIndex = val;
  getUserList();
};

const handleSelectionChange = (val: any[]) => {
  multipleSelection.value = val;
};

// --- 弹窗交互逻辑 ---

// 打开新增弹窗
const handleAdd = () => {
  dialogTitle.value = '新增用户';
  form.value = {
    id: '',
    username: '',
    password: '',
    realName: '',
    email: '',
    isActive: true
  };
  dialogVisible.value = true;
  // 清除上次的验证信息
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

// 打开编辑弹窗
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑用户';
  // 将选中行的数据浅拷贝给表单
  form.value = { 
    id: row.id,
    username: row.username,
    password: '', // 编辑时不返回密码，由后端决定是否独立接口修改
    realName: row.realName,
    email: row.email,
    isActive: row.isActive
  };
  dialogVisible.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

// 关闭弹窗时重置表单
const handleDialogClose = () => {
  formRef.value?.resetFields();
};

// 提交表单 (融合新增与编辑)
const submitForm = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        if (form.value.id) {
          // 编辑操作 (PUT 请求穿透网关到 Identity 服务)
          await api.put(`/api/identity/users/${form.value.id}`, form.value);
          ElMessage.success('修改成功');
        } else {
          // 新增操作 (POST 请求)
          await api.post('/api/identity/users', form.value);
          ElMessage.success('新增成功');
        }
        dialogVisible.value = false;
        getUserList(); // 刷新列表
      } catch (error) {
        // 错误已由拦截器统一处理
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

// 预留的单行删除逻辑
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认删除用户 "${row.username}" 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await api.delete(`/api/identity/users/${row.id}`);
      ElMessage.success('删除成功');
      getUserList();
    } catch (error) {
    }
  }).catch(() => {});
};

onMounted(() => {
  getUserList();
});
</script>