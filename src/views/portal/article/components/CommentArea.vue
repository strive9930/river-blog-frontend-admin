<template>
  <div class="comment-area-container">
    <div class="area-header">
      <h3>全部评论 <span class="comment-count">({{ total }})</span></h3>
    </div>

    <div class="comment-editor">
      <div class="editor-avatar">
        <el-avatar :size="48" src="https://api.dicebear.com/7.x/identicon/svg?seed=guest" />
      </div>
      <div class="editor-main">
        <el-form ref="formRef" :model="formData" :rules="rules">
          <el-row :gutter="20" style="margin-bottom: 15px;">
            <el-col :span="12">
              <el-form-item prop="nickName" style="margin-bottom: 0;">
                <el-input v-model="formData.nickName" placeholder="怎么称呼您？(必填)" prefix-icon="User" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="email" style="margin-bottom: 0;">
                <el-input v-model="formData.email" placeholder="您的邮箱 (选填，不会公开)" prefix-icon="Message" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item prop="content" style="margin-bottom: 15px;">
            <el-input
              v-model="formData.content"
              type="textarea"
              :rows="4"
              placeholder="分享您的真知灼见..."
              maxlength="500"
              show-word-limit
              resize="none"
            />
          </el-form-item>
          
          <div class="editor-footer">
            <span class="tip">支持基础的 Markdown 语法</span>
            <el-button type="primary" :loading="submitLoading" @click="onSubmit">发表评论</el-button>
          </div>
        </el-form>
      </div>
    </div>

    <div class="comment-list" v-loading="loading">
      <el-empty v-if="comments.length === 0" description="还没有人评论，快来抢沙发吧！" />
      
      <div class="comment-item" v-for="item in comments" :key="item.id">
        <div class="item-avatar">
          <el-avatar :size="40" :src="`https://api.dicebear.com/7.x/identicon/svg?seed=${item.nickName}`" />
        </div>
        <div class="item-main">
          <div class="item-header">
            <span class="nickname">{{ item.nickName }}</span>
            <span class="time">{{ formatTime(item.createTime) }}</span>
          </div>
          <div class="item-content">{{ item.content }}</div>
        </div>
      </div>

      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="queryParams.pageIndex"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          layout="prev, pager, next"
          background
          @current-change="fetchComments"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getPublicComments, submitPublicComment } from '@/api/portal'

// 接收外部传入的 articleId
const props = defineProps({
  articleId: {
    type: String,
    required: true
  }
})

// === 状态定义 ===
const loading = ref(false)
const submitLoading = ref(false)
const comments = ref([])
const total = ref(0)
const formRef = ref(null)

// === 列表查询参数 ===
const queryParams = reactive({
  articleId: props.articleId,
  pageIndex: 1,
  pageSize: 10
})

// === 提交表单数据 ===
const formData = reactive({
  articleId: props.articleId,
  nickName: '',
  email: '',
  content: ''
})

const rules = {
  nickName: [{ required: true, message: '请输入您的称呼', trigger: 'blur' }],
  content: [{ required: true, message: '评论内容不能为空', trigger: 'blur' }]
}

// === 拉取评论列表 ===
const fetchComments = async () => {
  loading.value = true
  try {
    const res = await getPublicComments(queryParams)
    if (res.data && res.data.succeeded) {
      comments.value = res.data || []
      total.value = res?.totalCount || 0
    } else {
      comments.value = res.data || []
      total.value = res?.totalCount || 0
    }
  } catch (error) {
    console.error('获取评论失败', error)
  } finally {
    loading.value = false
  }
}

// === 提交评论 ===
const onSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        await submitPublicComment(formData)
        ElMessage.success('评论发布成功！(如果后台设置了审核，将等待博主通过)')
        // 清空表单内容，保留昵称和邮箱以便下次评论
        formData.content = ''
        // 刷新列表，看自己的最新评论
        queryParams.pageIndex = 1
        fetchComments()
      } catch (error) {
        console.error('提交评论失败', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 初始化加载
onMounted(() => {
  fetchComments()
})

// 监听 articleId 变化（SPA 内导航到其他文章时）
watch(() => props.articleId, (newId) => {
  formData.articleId = newId
  queryParams.articleId = newId
  queryParams.pageIndex = 1
  fetchComments()
})

// 简单的时间格式化（可以换成 dayjs 获取 "刚刚", "2小时前" 的效果）
const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.comment-area-container {
  margin-top: 50px;
  padding-top: 30px;
  border-top: 1px solid #f0f2f5;
}

.area-header h3 {
  font-size: 20px;
  color: #1d2129;
  margin-bottom: 24px;
}

.comment-count {
  color: #86909c;
  font-weight: normal;
  font-size: 16px;
}

/* 编辑器区域 */
.comment-editor {
  display: flex;
  gap: 16px;
  margin-bottom: 40px;
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.editor-main {
  flex: 1;
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

/* 评论列表区域 */
.comment-list {
  display: flex;
  flex-direction: column;
}

.comment-item {
  display: flex;
  gap: 16px;
  padding: 20px 0;
  border-bottom: 1px solid #f0f2f5;
}

.item-main {
  flex: 1;
}

.item-header {
  margin-bottom: 8px;
}

.item-header .nickname {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
  margin-right: 12px;
}

.item-header .time {
  font-size: 13px;
  color: #86909c;
}

.item-content {
  font-size: 15px;
  color: #4e5969;
  line-height: 1.6;
  white-space: pre-wrap; /* 保留换行符 */
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>