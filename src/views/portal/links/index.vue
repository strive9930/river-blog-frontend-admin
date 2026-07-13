<template>
  <div class="links-page">
    <h2 class="page-title">🔗 友情链接</h2>
    <p class="page-desc">以下是我的朋友们和常逛的技术站点</p>

    <!-- 友链卡片 -->
    <div class="links-grid" v-loading="loading">
      <a
        v-for="link in linkList"
        :key="link.id || link.name"
        :href="link.url"
        target="_blank"
        rel="noopener"
        class="link-card"
      >
        <el-avatar :size="48" :src="link.avatarUrl || link.avatar || link.logoUrl" class="link-avatar">
          {{ (link.name || link.siteName || link.title || '?').charAt(0) }}
        </el-avatar>
        <div class="link-info">
          <span class="link-name">{{ link.siteName || link.name || link.title }}</span>
          <span class="link-desc">{{ link.siteDescription || link.desc || link.description }}</span>
        </div>
      </a>
    </div>

    <el-empty v-if="!loading && linkList.length === 0" description="暂无友链" :image-size="60" />

    <!-- 申请友链 -->
    <div class="apply-section">
      <el-button type="primary" size="large" icon="Plus" @click="dialogVisible = true">申请友链</el-button>
      <p class="apply-hint">想要交换友链？点击上方按钮提交申请，审核通过后即可展示</p>
    </div>

    <!-- 申请弹窗 -->
    <el-dialog title="📝 申请友链" v-model="dialogVisible" width="520px" @close="resetForm">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="90px">
        <el-form-item label="站点名称" prop="siteName">
          <el-input v-model="formData.siteName" placeholder="你的网站叫什么？" />
        </el-form-item>
        <el-form-item label="站点链接" prop="url">
          <el-input v-model="formData.url" placeholder="https://your-site.com" />
        </el-form-item>
        <el-form-item label="站点描述" prop="siteDescription">
          <el-input v-model="formData.siteDescription" type="textarea" :rows="3" placeholder="一句话介绍一下你的站点" />
        </el-form-item>
        <el-form-item label="站长昵称" prop="owner">
          <el-input v-model="formData.owner" placeholder="怎么称呼你？" />
        </el-form-item>
        <el-form-item label="头像 URL" prop="avatarUrl">
          <el-input v-model="formData.avatarUrl" placeholder="可选，站点头像图片地址" />
        </el-form-item>
        <el-form-item label="RSS 地址" prop="rssUrl">
          <el-input v-model="formData.rssUrl" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitApply">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'PortalLinks' });

import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getFriendLinks, applyFriendLink } from '@/api/portal';

const loading = ref(false);
const linkList = ref<any[]>([]);

// 默认降级数据（后端不可用时使用）
const fallbackLinks = [
  { id: 1, name: 'Vue.js', url: 'https://cn.vuejs.org/', desc: '渐进式 JavaScript 框架', avatar: 'https://cn.vuejs.org/logo.svg' },
  { id: 2, name: 'Element Plus', url: 'https://element-plus.org/', desc: 'Vue 3 UI 组件库', avatar: 'https://element-plus.org/images/element-plus-logo.svg' },
  { id: 3, name: '.NET', url: 'https://dotnet.microsoft.com/', desc: '微软跨平台开发平台', avatar: 'https://dotnet.microsoft.com/favicon.ico' },
  { id: 4, name: 'Vite', url: 'https://vitejs.dev/', desc: '下一代前端构建工具', avatar: 'https://vitejs.dev/logo.svg' },
  { id: 5, name: 'GitHub', url: 'https://github.com/', desc: '全球最大的代码托管平台', avatar: 'https://github.com/favicon.ico' },
  { id: 6, name: 'MDN', url: 'https://developer.mozilla.org/', desc: 'Web 开发技术文档', avatar: 'https://developer.mozilla.org/favicon.ico' },
];

onMounted(async () => {
  loading.value = true;
  try {
    const res = await getFriendLinks();
    const data = res.data?.data || res.data;
    if (data && Array.isArray(data) && data.length > 0) {
      linkList.value = data;
    } else {
      linkList.value = fallbackLinks;
    }
  } catch {
    linkList.value = fallbackLinks;
  } finally {
    loading.value = false;
  }
});

// === 申请友链 ===
const dialogVisible = ref(false);
const submitLoading = ref(false);
const formRef = ref<any>(null);
const formData = reactive({
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

const resetForm = () => {
  formRef.value?.resetFields();
  formData.siteName = '';
  formData.url = '';
  formData.siteDescription = '';
  formData.owner = '';
  formData.avatarUrl = '';
  formData.rssUrl = '';
};

const submitApply = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      await applyFriendLink({
        siteName: formData.siteName,
        url: formData.url,
        siteDescription: formData.siteDescription,
        owner: formData.owner,
        avatarUrl: formData.avatarUrl || undefined,
        rssUrl: formData.rssUrl || undefined,
      });
      ElMessage.success('友链申请已提交，审核通过后将公开展示！');
      dialogVisible.value = false;
      resetForm();
    } catch { /* */ } finally {
      submitLoading.value = false;
    }
  });
};
</script>

<style scoped>
.links-page { max-width: 760px; margin: 0 auto; }
.page-title { font-size: 24px; color: #1d2129; margin: 0 0 6px; }
.page-desc { font-size: 14px; color: #8a919f; margin: 0 0 28px; }
.links-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.link-card { display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid #f0f0f0; border-radius: 10px; padding: 16px 18px; text-decoration: none; transition: all .2s; }
.link-card:hover { border-color: #1e80ff; box-shadow: 0 4px 12px rgba(30,128,255,.1); transform: translateY(-2px); }
.link-avatar { flex-shrink: 0; }
.link-info { display: flex; flex-direction: column; min-width: 0; }
.link-name { font-size: 15px; font-weight: 600; color: #1d2129; }
.link-desc { font-size: 12px; color: #8a919f; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 申请友链区域 */
.apply-section {
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}
.apply-hint {
  margin-top: 12px;
  font-size: 13px;
  color: #b0b5be;
}
</style>
