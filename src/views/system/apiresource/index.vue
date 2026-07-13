<template>
  <div class="app-container">
    <!-- 操作栏 -->
    <el-card class="box-card" shadow="hover" style="margin-bottom: 20px;">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="微服务">
          <el-select v-model="queryParams.serviceName" placeholder="全部" clearable style="width: 160px" @change="handleQuery">
            <el-option v-for="s in serviceNames" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="请求方法">
          <el-select v-model="queryParams.method" placeholder="全部" clearable style="width: 120px" @change="handleQuery">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
          </el-select>
        </el-form-item>
        <el-form-item label="路由">
          <el-input v-model="queryParams.route" placeholder="搜索路由路径" clearable style="width: 220px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="action-bar">
        <el-button type="primary" icon="Plus" @click="handleAdd">新增资源</el-button>
        <el-button icon="Upload" @click="handleSync" :loading="syncing">同步资源</el-button>
        <el-button icon="Flag" @click="handleReport" :loading="reporting">上报资源</el-button>
      </div>
    </el-card>

    <!-- 表格 -->
    <el-card class="box-card" shadow="hover">
      <el-table v-loading="loading" :data="tableData" style="width: 100%" border stripe>
        <el-table-column prop="serviceName" label="微服务" width="140" align="center" />
        <el-table-column label="方法" width="90" align="center">
          <template #default="scope">
            <el-tag
              :type="methodType(scope.row.method)"
              effect="dark"
              size="small"
            >{{ scope.row.method }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="route" label="路由" min-width="280">
          <template #default="scope">
            <code class="route-code">{{ scope.row.route }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="公开" width="70" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.isPublic ? 'success' : 'info'" size="small">
              {{ scope.row.isPublic ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
            <el-popconfirm title="确定删除？" @confirm="handleDelete(scope.row.id)">
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
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="560px" @close="resetForm">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="90px">
        <el-form-item label="微服务" prop="serviceName">
          <el-input v-model="formData.serviceName" placeholder="如：IdentityService" />
        </el-form-item>
        <el-form-item label="请求方法" prop="method">
          <el-select v-model="formData.method" placeholder="请选择">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
          </el-select>
        </el-form-item>
        <el-form-item label="路由" prop="route">
          <el-input v-model="formData.route" placeholder="如：/api/identity/Users/page" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="简要说明该接口的作用" />
        </el-form-item>
        <el-form-item label="是否公开" prop="isPublic">
          <el-switch v-model="formData.isPublic" />
          <span style="margin-left:8px;font-size:12px;color:#909399;">公开接口无需鉴权即可访问</span>
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
defineOptions({ name: 'ApiResource' });

import { ref, reactive, watch, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getApiResourcePage,
  createApiResource,
  updateApiResource,
  deleteApiResource,
  syncApiResources,
  reportApiResources,
} from '@/api/system/apiResource';

// === 表格状态 ===
const loading = ref(false);
const total = ref(0);
const tableData = ref<any[]>([]);
const serviceNames = ref<string[]>([]);

const queryParams = reactive({
  pageIndex: 1,
  pageSize: 20,
  serviceName: '',
  method: '',
  route: '',
});

// === 请求方法颜色映射 ===
const methodType = (m: string) => {
  const map: Record<string, string> = { GET: 'success', POST: 'primary', PUT: 'warning', DELETE: 'danger' };
  return map[m] || 'info';
};

// === 加载数据 ===
const fetchData = async () => {
  loading.value = true;
  try {
    const params: any = {
      pageIndex: queryParams.pageIndex,
      pageSize: queryParams.pageSize,
    };
    if (queryParams.serviceName) params.serviceName = queryParams.serviceName;
    if (queryParams.method) params.method = queryParams.method;
    if (queryParams.route) params.route = queryParams.route;

    const res = await getApiResourcePage(params);
    tableData.value = res.data?.data || res.data || [];
    total.value = res.data?.totalCount || res?.totalCount || 0;

    // 提取去重的 serviceName 列表
    if (!queryParams.serviceName && !queryParams.method && !queryParams.route && queryParams.pageIndex === 1) {
      const names = new Set<string>();
      tableData.value.forEach((r: any) => { if (r.serviceName) names.add(r.serviceName); });
      // 补充完整列表需要一次不带分页的请求，为了性能仅在首次加载时获取
      if (serviceNames.value.length === 0) {
        try {
          const allRes = await getApiResourcePage({ pageIndex: 1, pageSize: 200 });
          const allData = allRes.data?.data || allRes.data || [];
          const allNames = new Set<string>();
          allData.forEach((r: any) => { if (r.serviceName) allNames.add(r.serviceName); });
          serviceNames.value = Array.from(allNames).sort();
        } catch { /* */ }
      }
    }
  } catch {
    tableData.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.pageIndex = 1;
  fetchData();
};

const resetQuery = () => {
  queryParams.serviceName = '';
  queryParams.method = '';
  queryParams.route = '';
  handleQuery();
};

watch(
  () => [queryParams.pageIndex, queryParams.pageSize],
  () => fetchData(),
);

// === 同步 & 上报 ===
const syncing = ref(false);
const reporting = ref(false);

const handleSync = () => {
  ElMessageBox.confirm('同步将从项目扫描所有 API 并更新数据库，确认继续？', '提示', { type: 'info' })
    .then(async () => {
      syncing.value = true;
      try {
        const res = await syncApiResources();
        ElMessage.success(res.data?.message || '同步成功');
        fetchData();
      } catch { /* */ } finally { syncing.value = false; }
    }).catch(() => {});
};

const handleReport = () => {
  ElMessageBox.confirm('上报将把当前数据库中所有 API 资源重新扫描入库，确认继续？', '提示', { type: 'info' })
    .then(async () => {
      reporting.value = true;
      try {
        const res = await reportApiResources();
        ElMessage.success(res.data?.message || '上报成功');
        fetchData();
      } catch { /* */ } finally { reporting.value = false; }
    }).catch(() => {});
};

// === 弹窗操作 ===
const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const formRef = ref<any>(null);
const formData = reactive({
  id: null as string | null,
  serviceName: '',
  method: 'GET' as string,
  route: '',
  description: '',
  isPublic: false,
});

const rules = {
  serviceName: [{ required: true, message: '请输入微服务名称', trigger: 'blur' }],
  method: [{ required: true, message: '请选择请求方法', trigger: 'change' }],
  route: [{ required: true, message: '请输入路由', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
};

const handleAdd = () => {
  dialogTitle.value = '新增 API 资源';
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑 API 资源';
  formData.id = row.id;
  formData.serviceName = row.serviceName;
  formData.method = row.method;
  formData.route = row.route;
  formData.description = row.description || '';
  formData.isPublic = row.isPublic;
  dialogVisible.value = true;
};

const resetForm = () => {
  formRef.value?.resetFields();
  formData.id = null;
  formData.serviceName = '';
  formData.method = 'GET';
  formData.route = '';
  formData.description = '';
  formData.isPublic = false;
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      const payload = { ...formData };
      if (formData.id) {
        await updateApiResource(payload);
        ElMessage.success('更新成功');
      } else {
        await createApiResource(payload);
        ElMessage.success('创建成功');
      }
      dialogVisible.value = false;
      fetchData();
    } catch { /* */ } finally { submitLoading.value = false; }
  });
};

// === 删除 ===
const handleDelete = async (id: string) => {
  try {
    await deleteApiResource(id);
    ElMessage.success('已删除');
    fetchData();
  } catch { /* */ }
};

onMounted(() => fetchData());
</script>

<style scoped>
.app-container { padding: 20px; background-color: #fff; border-radius: 4px; }
.action-bar { display: flex; gap: 10px; margin-top: 4px; }
.route-code {
  font-family: 'SF Mono', 'Cascadia Code', Consolas, monospace;
  font-size: 13px;
  background: #f4f5f5;
  padding: 2px 8px;
  border-radius: 4px;
  color: #1d2129;
}
</style>
