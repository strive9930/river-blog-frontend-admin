<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2 class="title">RiverLi Blog 系统</h2>
        <p class="subtitle">微服务后台管理中心</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
      >
        <el-form-item prop="userName">
          <el-input
            v-model="loginForm.userName"
            placeholder="请输入账号"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            :loading="loading"
            type="primary"
            class="login-btn"
            size="large"
            @click="handleLogin"
          >
            {{ loading ? '登 录 中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 🌟 角色选择弹窗 — 多角色用户登录后选择目的地 -->
    <el-dialog v-model="roleDialogVisible" title="选择目的地" width="420px" :close-on-click-modal="false" :show-close="false" center>
      <div class="role-choice">
        <p class="choice-hint">检测到您拥有多个角色，请选择要进入的端：</p>
        <div class="choice-cards">
          <div class="choice-card" @click="goToAdmin">
            <el-icon :size="40" color="#409eff"><Monitor /></el-icon>
            <span class="card-label">管理后台</span>
            <span class="card-desc">文章管理 · 审核 · 系统配置</span>
          </div>
          <div class="choice-card" @click="goToPortal">
            <el-icon :size="40" color="#67c23a"><HomeFilled /></el-icon>
            <span class="card-label">博客前台</span>
            <span class="card-desc">浏览文章 · 评论互动</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'Login' });

import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock, Monitor, HomeFilled } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

const loginFormRef = ref();
const loading = ref(false);
const roleDialogVisible = ref(false);

const loginForm = reactive({ userName: '', password: '' });

const loginRules = reactive({
  userName: [{ required: true, message: '账号不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '密码不能为空', trigger: 'blur' }],
});

// 判断是否有多个可选端点
const hasMultipleEndpoints = () => {
  const roles = userStore.roles || [];
  const hasAdmin = roles.some((r: string) => r.toLowerCase() === 'admin');
  const hasOther = roles.some((r: string) => r.toLowerCase() !== 'admin');
  return hasAdmin && hasOther;
};

const handleLogin = () => {
  if (!loginFormRef.value) return;

  loginFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return;

    loading.value = true;
    try {
      await userStore.login(loginForm);
      ElMessage.success('登录成功，欢迎回来！');

      if (hasMultipleEndpoints()) {
        // 多角色 → 弹出选择
        roleDialogVisible.value = true;
      } else if (userStore.roles?.some((r: string) => r.toLowerCase() === 'admin')) {
        // 纯管理员 → 直接进后台
        router.push((route.query.redirect as string) || '/admin/dashboard');
      } else {
        // 非管理员 → 去前台
        router.push((route.query.redirect as string) || '/');
      }
    } catch (error: any) {
      console.error('登录失败', error);
      ElMessage.error(error.message || '登录失败，请检查账号密码');
    } finally {
      loading.value = false;
    }
  });
};

const goToAdmin = () => {
  roleDialogVisible.value = false;
  router.push('/admin/dashboard');
};

const goToPortal = () => {
  roleDialogVisible.value = false;
  router.push('/');
};
</script>

<style scoped>
.login-container { height: 100vh; display: flex; justify-content: center; align-items: center; background-color: #2d3a4b; }
.login-box { width: 400px; padding: 40px; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.login-header { text-align: center; margin-bottom: 30px; }
.login-header .title { margin: 0; font-size: 26px; color: #303133; font-weight: bold; }
.login-header .subtitle { margin: 10px 0 0; font-size: 14px; color: #909399; }
.login-btn { width: 100%; font-size: 16px; letter-spacing: 2px; }

/* 角色选择 */
.choice-hint { text-align: center; font-size: 14px; color: #606266; margin-bottom: 24px; }
.choice-cards { display: flex; gap: 16px; justify-content: center; }
.choice-card {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  width: 150px; padding: 24px 16px; border: 2px solid #ebeef5; border-radius: 8px;
  cursor: pointer; transition: all 0.2s;
}
.choice-card:hover { border-color: #409eff; box-shadow: 0 2px 12px rgba(64,158,255,0.15); transform: translateY(-2px); }
.card-label { font-size: 16px; font-weight: 600; color: #303133; }
.card-desc { font-size: 12px; color: #909399; }
</style>
