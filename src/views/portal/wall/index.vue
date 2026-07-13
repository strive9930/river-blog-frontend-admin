<template>
  <div class="wall-page">
    <h2 class="page-title">💬 留言墙</h2>
    <p class="page-desc">欢迎留下你的足迹，审核通过后将展示在这里</p>

    <!-- 留言表单 -->
    <div class="message-editor">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="0">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item prop="nickname">
              <el-input v-model="formData.nickname" placeholder="怎么称呼您？(必填)" prefix-icon="User" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item prop="contact">
              <el-input v-model="formData.contact" placeholder="邮箱或其他联系方式 (选填)" prefix-icon="Message" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="4"
            placeholder="说点什么吧..."
            maxlength="500"
            show-word-limit
            resize="none"
          />
        </el-form-item>
        <div class="editor-footer">
          <span class="tip">支持 Markdown 语法</span>
          <el-button type="primary" :loading="submitLoading" @click="onSubmit">提交留言</el-button>
        </div>
      </el-form>
    </div>

    <!-- 留言列表 -->
    <div class="message-list" v-loading="loading">
      <el-empty v-if="!loading && messages.length === 0" description="暂无留言，快来抢沙发吧！" :image-size="80" />

      <div class="message-item" v-for="item in messages" :key="item.id">
        <div class="msg-avatar">
          <el-avatar :size="44" :src="`https://api.dicebear.com/7.x/identicon/svg?seed=${item.nickname}`" />
        </div>
        <div class="msg-body">
          <div class="msg-header">
            <span class="msg-nickname">{{ item.nickname }}</span>
            <span class="msg-time">{{ formatTime(item.createdTime) }}</span>
          </div>
          <div class="msg-content">{{ item.content }}</div>
          <div class="msg-contact" v-if="item.contact">
            <el-icon size="14"><Message /></el-icon>
            {{ item.contact }}
          </div>
        </div>
      </div>

      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="queryParams.pageIndex"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20]"
          layout="total, prev, pager, next"
          background
          @current-change="fetchMessages"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'PortalMessageWall' });

import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getPublicMessages, submitPublicMessage } from '@/api/portal';

const loading = ref(false);
const submitLoading = ref(false);
const messages = ref<any[]>([]);
const total = ref(0);
const formRef = ref<any>(null);
const queryParams = reactive({ pageIndex: 1, pageSize: 10 });

const formData = reactive({
  nickname: '',
  contact: '',
  content: '',
});

const rules = {
  nickname: [{ required: true, message: '请输入您的称呼', trigger: 'blur' }],
  content: [{ required: true, message: '留言内容不能为空', trigger: 'blur' }],
};

const fetchMessages = async () => {
  loading.value = true;
  try {
    const res = await getPublicMessages({ pageIndex: queryParams.pageIndex, pageSize: queryParams.pageSize });
    messages.value = res.data?.data || res.data || [];
    total.value = res.data?.totalCount || res?.totalCount || 0;
  } catch {
    messages.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const onSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      await submitPublicMessage({
        nickname: formData.nickname,
        content: formData.content,
        contact: formData.contact || undefined,
      });
      ElMessage.success('留言已提交，审核通过后将展示！');
      formData.content = '';
      queryParams.pageIndex = 1;
      fetchMessages();
    } catch {
      /* */
    } finally {
      submitLoading.value = false;
    }
  });
};

const formatTime = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

onMounted(() => fetchMessages());
</script>

<style scoped>
.wall-page { max-width: 760px; margin: 0 auto; }
.page-title { font-size: 24px; color: #1d2129; margin: 0 0 6px; }
.page-desc { font-size: 14px; color: #8a919f; margin: 0 0 28px; }

/* 编辑器 */
.message-editor {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 32px;
}
.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.editor-footer .tip {
  font-size: 13px;
  color: #86909c;
}

/* 留言列表 */
.message-item {
  display: flex;
  gap: 14px;
  padding: 20px 0;
  border-bottom: 1px solid #f0f2f5;
}
.msg-avatar { flex-shrink: 0; }
.msg-body { flex: 1; min-width: 0; }
.msg-header { margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
.msg-nickname { font-size: 15px; font-weight: 600; color: #1d2129; }
.msg-time { font-size: 13px; color: #86909c; }
.msg-content { font-size: 15px; color: #4e5969; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
.msg-contact { margin-top: 6px; font-size: 12px; color: #8a919f; display: flex; align-items: center; gap: 4px; }

.pagination-wrapper { margin-top: 24px; display: flex; justify-content: center; }
</style>
