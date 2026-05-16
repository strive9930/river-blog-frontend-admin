<template>
  <div class="login-container">
    <div class="login-form">
      <div class="login-header">
        <div class="logo">
          <el-icon size="40" color="#409EFF"><Management /></el-icon>
        </div>
        <h2 class="title">River Blog 管理后台</h2>
        <p class="subtitle">请使用您的账号登录</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form-content"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            placeholder="请输入邮箱"
            size="large"
            prefix-icon="Message"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
          <a href="#" class="forgot-password">忘记密码？</a>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
            block
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>© 2024 River Blog. All rights reserved.</p>
      </div>
    </div>
    
    <div class="login-background">
      <div class="background-overlay"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../store/modules/user'
import { usePermissionStore } from '../../store/modules/permission'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

// 表单引用
const loginFormRef = ref<FormInstance>()

// 登录状态
const loading = ref(false)

// 登录表单数据
const loginForm = reactive({
  email: 'admin@example.com',
  password: 'Admin123!',
  rememberMe: true
})

// 表单验证规则
const loginRules = reactive<FormRules>({
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
})

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    // 表单验证
    await loginFormRef.value.validate()
    
    loading.value = true
    
    console.log('开始调用登录方法');
    // 调用登录方法
    const result = await userStore.login({
      email: loginForm.email,
      password: loginForm.password
    })
    
    console.log('登录方法返回结果:', result);
    
    if (result.success) {
      console.log('登录成功，准备跳转');
      console.log('当前用户信息:', {
        id: userStore.userInfo?.id,
        nickName: userStore.userInfo?.nickName,
        email: userStore.userInfo?.email,
        avatar: userStore.userInfo?.avatar,
        roles: userStore.userInfo?.roles
      });
      console.log('当前昵称:', userStore.nickName);
      
      ElMessage.success('登录成功')
      
      // 获取用户信息
      await userStore.getUserInfo()
      
      // 生成可访问的路由菜单
      await permissionStore.generateRoutes(userStore.permissions)
      
      // 跳转到首页
      console.log('即将跳转到首页');
      router.push('/')
    } else {
      console.log('登录失败，显示错误消息');
      ElMessage.error(result.message || '登录失败')
    }
  } catch (error: any) {
    console.error('登录错误:', error)
    ElMessage.error(error.message || '登录失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.login-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  background: white;
  z-index: 2;
  position: relative;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  margin-bottom: 20px;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 10px 0;
}

.subtitle {
  font-size: 16px;
  color: #909399;
  margin: 0;
}

.login-form-content {
  width: 100%;
  max-width: 400px;
}

.login-button {
  margin-top: 20px;
}

.forgot-password {
  float: right;
  font-size: 14px;
  color: #409EFF;
  text-decoration: none;
}

.forgot-password:hover {
  color: #66b1ff;
}

.login-footer {
  margin-top: 40px;
  text-align: center;
}

.login-footer p {
  font-size: 12px;
  color: #c0c4cc;
  margin: 0;
}

.login-background {
  flex: 1;
  position: relative;
  background: url('@/assets/background.jpg') center/cover;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }
  
  .login-background {
    display: none;
  }
  
  .login-form {
    width: 100%;
    padding: 20px;
  }
  
  .title {
    font-size: 24px;
  }
}

/* 动画效果 */
.login-form {
  animation: slideInLeft 0.6s ease-out;
}

.login-background {
  animation: slideInRight 0.6s ease-out;
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>