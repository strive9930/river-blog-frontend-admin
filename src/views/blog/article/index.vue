<template>
  <div class="app-container">
    <!-- ===== 搜索栏 ===== -->
    <el-card class="box-card" shadow="hover" style="margin-bottom: 20px;">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="关键字">
          <el-input v-model="queryParams.keyword" placeholder="匹配标题和摘要" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="所属分类">
          <el-select v-model="queryParams.categoryId" placeholder="请选择分类" clearable style="width: 200px">
            <el-option v-for="cat in categoryOptions" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="已发布" value="Published" />
            <el-option label="草稿" value="Draft" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- ===== 表格 ===== -->
    <el-card class="box-card" shadow="hover">
      <div style="margin-bottom: 15px;">
        <AuthButton :auth="ApiPerms.Article.Add" type="primary" plain @click="handleAdd">发布新文章</AuthButton>
      </div>

      <el-table v-loading="loading" :data="articleList" style="width: 100%" border>
        <el-table-column type="index" label="#" width="55" align="center" />
        <el-table-column prop="coverUrl" label="封面" width="100" align="center">
          <template #default="scope">
            <el-image v-if="scope.row.coverUrl" style="width:60px;height:40px;border-radius:4px" :src="scope.row.coverUrl" fit="cover" :preview-src-list="[scope.row.coverUrl]" preview-teleported />
            <span v-else style="color:#999;font-size:12px">无封面</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="文章标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="categoryName" label="分类" width="100" align="center">
          <template #default="scope"><span v-if="scope.row.categoryName">{{ scope.row.categoryName }}</span><span v-else style="color:#999">—</span></template>
        </el-table-column>
        <el-table-column prop="viewCount" label="浏览" width="80" align="center" />
        <el-table-column prop="commentCount" label="评论" width="80" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status==='Published'" type="success">已发布</el-tag>
                    <el-tag v-else-if="scope.row.status==='Scheduled'" type="warning">⏰ 定时发布</el-tag>
                    <el-tag v-else type="info">草稿</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="定时发布时间" width="160" align="center">
          <template #default="scope">
            <span v-if="scope.row.scheduledPublishTime" style="color:#e6a23c;font-size:12px">
              {{ formatTime(scope.row.scheduledPublishTime) }}
            </span>
            <span v-else style="color:#999">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdTime" label="创建时间" width="160" align="center">
          <template #default="scope">{{ formatTime(scope.row.createdTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <AuthButton :auth="ApiPerms.Article.Edit" link type="primary" size="small" @click="handleEdit(scope.row)">编辑</AuthButton>
            <el-button link type="warning" size="small" @click="handleToggleStatus(scope.row)">{{ scope.row.status==='Published'?'下架':'发布' }}</el-button>
            <AuthButton :auth="ApiPerms.Article.Delete" link type="danger" size="small" @click="handleDelete(scope.row)">删除</AuthButton>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top:20px;display:flex;justify-content:flex-end">
        <el-pagination v-model:current-page="queryParams.pageIndex" v-model:page-size="queryParams.pageSize" :page-sizes="[10,20,50]" :total="total" layout="total,sizes,prev,pager,next,jumper" />
      </div>
    </el-card>

    <!-- ===== 编辑弹窗 ===== -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" fullscreen destroy-on-close :close-on-click-modal="false" @opened="onEditorOpened">
      <div class="editor-container" @paste="onEditorPaste" @keydown="onEditorKeydown">
        <!-- 顶部表单行 -->
        <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="文章标题" prop="title">
                <el-input v-model="form.title" placeholder="请输入标题..." maxlength="200" show-word-limit />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="所属分类" prop="categoryId">
                <el-select v-model="form.categoryId" placeholder="请选择" style="width:100%">
                  <el-option v-for="cat in categoryOptions" :key="cat.id" :label="cat.name" :value="cat.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="文章标签" prop="tagIds">
                <el-select v-model="form.tagIds" multiple placeholder="可选多个标签" style="width:100%">
                  <el-option v-for="tag in tagOptions" :key="tag.id" :label="`${tag.name} (${tag.articleCount}篇)`" :value="tag.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="文章摘要" prop="summary">
                <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="简要描述文章内容..." maxlength="300" show-word-limit />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="封面图URL" prop="coverUrl">
                <el-input v-model="form.coverUrl" placeholder="https://... (可拖拽图片到编辑器自动填充)" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="定时发布">
                <el-date-picker
                  v-model="form.scheduledPublishTime"
                  type="datetime"
                  placeholder="留空立即发布"
                  format="YYYY-MM-DD HH:mm"
                  value-format="YYYY-MM-DDTHH:mm:ss"
                  style="width:100%"
                  :disabled-date="(date) => date < new Date()"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <!-- Markdown 编辑器 -->
        <div ref="mdWrapperRef" class="md-wrapper">
          <MdEditor
            ref="mdEditorRef"
            v-model="form.content"
            :theme="editorTheme"
            :toolbars="toolbarConfig"
            :footers="['markdownTotal']"
            @onUploadImg="onUploadImg"
            style="height:100%"
          />
        </div>
      </div>

      <template #footer>
        <div class="editor-footer">
          <div class="footer-stats">
            <el-tag v-if="uploadingCount > 0" type="warning" size="small">📤 正在上传 {{ uploadingCount }} 张图片...</el-tag>
            <span class="word-count">📝 {{ charCount }} 字符</span>
            <span v-if="isDirty" class="dirty-indicator">● 未保存</span>
          </div>
          <div class="footer-buttons">
            <el-button @click="dialogVisible = false">取 消</el-button>
            <el-button type="info" plain @click="submitForm('Draft')">保存草稿 <kbd>Ctrl+S</kbd></el-button>
            <el-button type="primary" @click="submitForm(form.scheduledPublishTime ? 'Scheduled' : 'Published')">
                  {{ form.scheduledPublishTime ? '⏰ 定时发布' : '正式发布' }}
                </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'BlogArticle' });

import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ApiPerms } from '@/constants/api-permissions';
import api from '@/utils/request';
import { uploadImage as uploadImageApi } from '@/api/file';

import { MdEditor } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';

// --- 编辑器配置 ---
const toolbarConfig = [
  'bold', 'italic', 'strikethrough', 'title', '-',
  'unorderedList', 'orderedList', 'task', '-',
  'code', 'quote', 'link', 'image', 'table', '-',
  'revoke', 'next', 'save', '=', 'preview', 'htmlPreview',
];

// --- 数据状态 ---
const loading = ref(false);
const total = ref(0);
const articleList = ref<any[]>([]);
const categoryOptions = ref<any[]>([]);
const tagOptions = ref<any[]>([]);
const editorTheme = ref('light');

const queryParams = ref({
  pageIndex: 1, pageSize: 10, keyword: '', categoryId: '', status: '' as string,
});

// --- 弹窗状态 ---
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();
const mdEditorRef = ref();
const mdWrapperRef = ref<HTMLElement>();
const uploadingCount = ref(0);
const isDirty = ref(false);
let initialContent = '';

const form = ref({
  id: '', title: '', summary: '', content: '', coverUrl: '', categoryId: '', tagIds: [] as string[],
  scheduledPublishTime: '' as string,
});

const charCount = computed(() => form.value.content.length);
const rules = {
  title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择文章分类', trigger: 'change' }],
  content: [{ required: true, message: '正文内容不能为空', trigger: 'blur' }],
  summary: [{ required: true, message: '请输入文章摘要', trigger: 'blur' }],
};

// --- API ---
const fetchCategories = async () => {
  try { const res = await api.get('/api/blog/category/options'); categoryOptions.value = res.data || []; } catch { /* */ }
};
const fetchTags = async () => {
  try { const res = await api.get('/api/blog/tag/page', { params: { pageSize: 200 } }); tagOptions.value = res.data || []; } catch { /* */ }
};
const fetchArticles = async () => {
  loading.value = true;
  try {
    const params: any = { pageIndex: queryParams.value.pageIndex, pageSize: queryParams.value.pageSize };
    if (queryParams.value.keyword) params.keyword = queryParams.value.keyword;
    if (queryParams.value.categoryId) params.categoryId = queryParams.value.categoryId;
    if (queryParams.value.status) params.status = queryParams.value.status;
    const res = await api.get('/api/blog/article/page', { params });
    articleList.value = res.data || [];
    total.value = res?.totalCount || 0;
  } catch { articleList.value = []; total.value = 0; } finally { loading.value = false; }
};
const handleQuery = () => { queryParams.value.pageIndex = 1; fetchArticles(); };
const resetQuery = () => { queryParams.value = { pageIndex: 1, pageSize: 10, keyword: '', categoryId: '', status: '' }; fetchArticles(); };
watch(() => [queryParams.value.pageIndex, queryParams.value.pageSize], () => fetchArticles());

// --- 脏状态追踪 ---
watch(() => form.value.content, (val) => { isDirty.value = val !== initialContent; });

// --- 增 / 改 ---
const handleAdd = () => {
  dialogTitle.value = '✍️ 发布新文章';
  form.value = { id: '', title: '', summary: '', content: '', coverUrl: '', categoryId: '', tagIds: [] };
  initialContent = '';
  isDirty.value = false;
  dialogVisible.value = true;
};

const handleEdit = async (row: any) => {
  dialogTitle.value = '✍️ 编辑文章';
  try {
    const res = await api.get(`/api/blog/article/${row.id}`);
    const d = res.data;
    form.value = {
      id: d.id, title: d.title, summary: d.summary || '', content: d.content || '',
      coverUrl: d.coverUrl || '', categoryId: d.categoryId || '',
      scheduledPublishTime: d.scheduledPublishTime || '',
      tagIds: (d.tags || []).map((t: any) => (typeof t === 'string' ? t : t.id)),
    };
    initialContent = form.value.content;
    isDirty.value = false;
    dialogVisible.value = true;
  } catch { ElMessage.error('获取文章详情失败'); }
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认删除文章《${row.title}》吗？`, '高危操作警告', { type: 'warning' })
    .then(async () => { await api.delete(`/api/blog/article/${row.id}`); ElMessage.success('已删除'); fetchArticles(); }).catch(() => {});
};

const handleToggleStatus = async (row: any) => {
  const newStatus = row.status === 'Published' ? 'Draft' : 'Published';
  try {
    await api.put(`/api/blog/article/${row.id}/status`, { id: row.id, status: newStatus });
    row.status = newStatus;
    ElMessage.success(`已${newStatus === 'Published' ? '发布' : '下架'}`);
  } catch { /* */ }
};

// --- 提交 ---
const submitForm = async (targetStatus: string) => {
  if (!formRef.value) return;
  try { await formRef.value.validate(); } catch { return; }
  if (!form.value.content.trim()) { ElMessage.warning('文章正文不能为空！'); return; }

  const payload = { title: form.value.title, content: form.value.content, summary: form.value.summary, coverUrl: form.value.coverUrl || null, categoryId: form.value.categoryId, tagIds: form.value.tagIds,
    scheduledPublishTime: form.value.scheduledPublishTime || null,
  };

  try {
    if (form.value.id) {
      await api.put(`/api/blog/article/${form.value.id}`, { id: form.value.id, ...payload });
      await api.put(`/api/blog/article/${form.value.id}/status`, { id: form.value.id, status: targetStatus });
    } else {
      const res = await api.post('/api/blog/article', payload);
      await api.put(`/api/blog/article/${res.data}/status`, { id: res.data, status: targetStatus });
    }
    ElMessage.success(targetStatus === 'Published' ? '文章发布成功！' : '草稿已保存');
    isDirty.value = false;
    initialContent = form.value.content;
    dialogVisible.value = false;
    fetchArticles();
  } catch { /* */ }
};

// ============================================================
// 🖼️ 图片上传 — 支持拖拽、工具栏选取、Ctrl+V 粘贴
// ============================================================
const uploadImage = async (file: File): Promise<string | null> => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!allowed.includes(file.type)) {
    ElMessage.warning(`不支持的格式: ${file.type || '未知'}`);
    return null;
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning(`图片过大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，限制 5MB`);
    return null;
  }

  try {
    uploadingCount.value++;
    const res = await uploadImageApi(file);
    const url = res.data as string;
    ElMessage.success({ message: `图片已上传`, duration: 1000, showClose: false, center: true });
    return url;
  } catch {
    return null;
  } finally {
    uploadingCount.value--;
  }
};

// md-editor-v3 回调 (拖拽 / 工具栏选取 / 编辑器内置粘贴)
const onUploadImg = async (files: Array<File>, callback: (urls: Array<string>) => void) => {
  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadImage(file);
    if (url) urls.push(url);
  }
  if (urls.length > 0) callback(urls);
};

// Ctrl+V 粘贴图片 — 兜底处理 (处理编辑器未能捕获的剪贴板图片)
const onEditorPaste = async (e: ClipboardEvent) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      if (!file) continue;

      const url = await uploadImage(file);
      if (url) {
        // 如果编辑器没自动处理，手动在光标处插入 Markdown 图片语法
        // md-editor-v3 内部已有 paste 处理，此处分两种情况：
        // 1. 编辑器正确处理 → preventDefault + 编辑器已接管
        // 2. 编辑器未处理边缘格式 (如 screenshot blob) → 手动插入
        insertImageAtCursor(url, file.name || 'image');
      }
      break;
    }
  }
};

// 在编辑器末尾插入图片 Markdown
const insertImageAtCursor = (url: string, alt: string) => {
  const imgMd = `![${alt}](${url})\n`;
  form.value.content += imgMd;
};

// ============================================================
// ⌨️ 快捷键
// ============================================================
const onEditorKeydown = (e: KeyboardEvent) => {
  // Ctrl+S / Cmd+S → 保存草稿
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    submitForm('Draft');
  }
};

// 编辑器打开后聚焦
const onEditorOpened = () => {
  nextTick(() => {
    // 聚焦到标题输入框
    const titleInput = document.querySelector('.editor-container input') as HTMLInputElement;
    titleInput?.focus();
  });
};

// ============================================================
// 🔧 工具
// ============================================================
const formatTime = (iso: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('zh-CN', { hour12: false });
};

onMounted(() => { fetchCategories(); fetchTags(); fetchArticles(); });
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 180px);
}
.md-wrapper {
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 12px;
}
:deep(.el-dialog__body) {
  padding-top: 10px;
}

/* ---- 底部状态栏 ---- */
.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.footer-stats {
  display: flex;
  align-items: center;
  gap: 14px;
}
.word-count {
  font-size: 13px;
  color: #909399;
}
.dirty-indicator {
  font-size: 12px;
  color: #e6a23c;
}
.footer-buttons {
  display: flex;
  gap: 8px;
}
kbd {
  padding: 1px 5px;
  font-size: 11px;
  color: #909399;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  background: #f5f7fa;
  margin-left: 4px;
}
</style>
