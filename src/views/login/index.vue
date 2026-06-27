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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import api from '@/utils/request';

const router = useRouter();
const route = useRoute();

// --- 表单与验证状态 ---
const loginFormRef = ref();
const loading = ref(false);

const loginForm = reactive({
  userName: '',
  password: ''
});

const loginRules = reactive({
  userName: [{ required: true, message: '账号不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '密码不能为空', trigger: 'blur' }]
});

// --- 核心登录逻辑 ---
const handleLogin = () => {
  if (!loginFormRef.value) return;
  
  loginFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true;
      try {
        // 直接向 API 网关发起请求 (会自动转发给 5001 的 Identity 服务)
        const res = await api.post('/api/identity/auth/login', loginForm);
        
        // 【关键点】：保存 Token。请根据您的后端 ApiResult 结构调整这里
        // 如果后端直接返回 Token 字符串，就是 res.data；如果是对象，可能是 res.data.token
        const token = typeof res.data === 'string' ? res.data : res.data?.token;
        
        if (token) {
          localStorage.setItem('access_token', token);
          ElMessage.success('登录成功，欢迎回来！');
          
          // 获取可能存在的重定向地址，或者默认跳到首页
          const redirect = route.query.redirect as string || '/';
          router.push(redirect);
        } else {
          ElMessage.error('服务器未返回有效的凭证');
        }
      } catch (error) {
        // Axios 响应拦截器已经处理了报错提示，这里只需捕获即可
        console.error('登录失败', error);
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #2d3a4b; /* 经典的深色后台背景 */
}

.login-box {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header .title {
  margin: 0;
  font-size: 26px;
  color: #303133;
  font-weight: bold;
}

.login-header .subtitle {
  margin: 10px 0 0;
  font-size: 14px;
  color: #909399;
}

.login-btn {
  width: 100%;
  font-size: 16px;
  letter-spacing: 2px;
}
</style>