<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <!-- 个人信息卡片 -->
      <el-col :span="8">
        <el-card class="profile-card">
          <div class="profile-header">
            <el-avatar :size="100" :src="userStore.avatar" class="user-avatar">
              {{ userStore.nickName?.charAt(0) }}
            </el-avatar>
            <h2 class="user-name">{{ userStore.nickName }}</h2>
            <p class="user-email">{{ userStore.email }}</p>
            <div class="user-roles">
              <el-tag 
                v-for="role in userStore.roles" 
                :key="role" 
                type="primary" 
                effect="dark"
                class="role-tag"
              >
                {{ role }}
              </el-tag>
            </div>
          </div>
          
          <div class="profile-stats">
            <div class="stat-item">
              <div class="stat-value">{{ userStats.posts }}</div>
              <div class="stat-label">文章数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ userStats.comments }}</div>
              <div class="stat-label">评论数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ userStats.likes }}</div>
              <div class="stat-label">获赞数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 详细信息和设置 -->
      <el-col :span="16">
        <el-tabs v-model="activeTab" class="profile-tabs">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="basic">
            <el-card>
              <el-form
                :model="basicForm"
                :rules="basicRules"
                ref="basicFormRef"
                label-width="100px"
              >
                <el-form-item label="昵称" prop="nickName">
                  <el-input v-model="basicForm.nickName" placeholder="请输入昵称"></el-input>
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="basicForm.email" placeholder="请输入邮箱"></el-input>
                </el-form-item>
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="basicForm.phone" placeholder="请输入手机号"></el-input>
                </el-form-item>
                <el-form-item label="个人简介">
                  <el-input
                    v-model="basicForm.bio"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入个人简介"
                  ></el-input>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="updateBasicInfo" :loading="basicLoading">
                    保存信息
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-tab-pane>
          
          <!-- 安全设置 -->
          <el-tab-pane label="安全设置" name="security">
            <el-card>
              <el-form
                :model="securityForm"
                :rules="securityRules"
                ref="securityFormRef"
                label-width="120px"
              >
                <el-form-item label="原密码" prop="oldPassword">
                  <el-input
                    v-model="securityForm.oldPassword"
                    type="password"
                    placeholder="请输入原密码"
                    show-password
                  ></el-input>
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input
                    v-model="securityForm.newPassword"
                    type="password"
                    placeholder="请输入新密码"
                    show-password
                  ></el-input>
                </el-form-item>
                <el-form-item label="确认新密码" prop="confirmPassword">
                  <el-input
                    v-model="securityForm.confirmPassword"
                    type="password"
                    placeholder="请确认新密码"
                    show-password
                  ></el-input>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="updatePassword" :loading="securityLoading">
                    修改密码
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-tab-pane>
          
          <!-- 通知设置 -->
          <el-tab-pane label="通知设置" name="notification">
            <el-card>
              <el-form label-width="150px">
                <el-form-item label="邮件通知">
                  <el-switch
                    v-model="notificationSettings.email"
                    active-text="开启"
                    inactive-text="关闭"
                  />
                  <div class="setting-description">接收重要通知的邮件提醒</div>
                </el-form-item>
                <el-form-item label="站内消息">
                  <el-switch
                    v-model="notificationSettings.inSite"
                    active-text="开启"
                    inactive-text="关闭"
                  />
                  <div class="setting-description">接收站内消息通知</div>
                </el-form-item>
                <el-form-item label="评论提醒">
                  <el-switch
                    v-model="notificationSettings.comment"
                    active-text="开启"
                    inactive-text="关闭"
                  />
                  <div class="setting-description">当有人评论你的文章时通知你</div>
                </el-form-item>
                <el-form-item label="点赞提醒">
                  <el-switch
                    v-model="notificationSettings.like"
                    active-text="开启"
                    inactive-text="关闭"
                  />
                  <div class="setting-description">当有人点赞你的文章时通知你</div>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="saveNotificationSettings">
                    保存设置
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-tab-pane>
          
          <!-- 登录历史 -->
          <el-tab-pane label="登录历史" name="loginHistory">
            <el-card>
              <el-table
                :data="loginHistory"
                style="width: 100%"
                v-loading="historyLoading"
              >
                <el-table-column prop="time" label="登录时间" width="180">
                  <template #default="{ row }">
                    {{ formatDate(row.time) }}
                  </template>
                </el-table-column>
                <el-table-column prop="ip" label="登录IP" width="150"></el-table-column>
                <el-table-column prop="location" label="登录地点" width="150"></el-table-column>
                <el-table-column prop="device" label="设备信息" show-overflow-tooltip></el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.status === '成功' ? 'success' : 'danger'">
                      {{ row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
              
              <div class="pagination-container">
                <el-pagination
                  :current-page="historyPagination.currentPage"
                  :page-size="historyPagination.pageSize"
                  :total="historyPagination.total"
                  layout="total, prev, pager, next"
                  @current-change="handleHistoryPageChange"
                />
              </div>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../store/modules/user'
import service from '../../utils/request'

// 使用用户store
const userStore = useUserStore()

// 响应式数据
const activeTab = ref('basic')
const basicLoading = ref(false)
const securityLoading = ref(false)
const historyLoading = ref(false)

// 用户统计数据
const userStats = reactive({
  posts: 24,
  comments: 156,
  likes: 892
})

// 基本信息表单
const basicForm = reactive({
  nickName: userStore.nickName,
  email: userStore.email,
  phone: '',
  bio: ''
})

// 安全设置表单
const securityForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 通知设置
const notificationSettings = reactive({
  email: true,
  inSite: true,
  comment: true,
  like: false
})

// 登录历史数据
const loginHistory = ref([
  {
    time: '2024-01-15 14:30:22',
    ip: '192.168.1.100',
    location: '北京',
    device: 'Chrome 120.0.0.0 on Windows 11',
    status: '成功'
  },
  {
    time: '2024-01-14 09:15:45',
    ip: '192.168.1.101',
    location: '上海',
    device: 'Safari 17.2 on macOS 14.2',
    status: '成功'
  },
  {
    time: '2024-01-13 16:42:18',
    ip: '192.168.1.102',
    location: '广州',
    device: 'Firefox 121.0 on Ubuntu 22.04',
    status: '失败'
  }
])

// 登录历史分页
const historyPagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 23
})

// 表单引用
const basicFormRef = ref()
const securityFormRef = ref()

// 表单验证规则
const basicRules = {
  nickName: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email' as const, message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const securityRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { 
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== securityForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ]
}

// 方法
const updateBasicInfo = async () => {
  if (!basicFormRef.value) return
  
  try {
    await basicFormRef.value.validate()
    basicLoading.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 更新用户store中的信息
    if (userStore.userInfo) {
      userStore.userInfo.nickName = basicForm.nickName
      userStore.userInfo.email = basicForm.email
      localStorage.setItem('user_info', JSON.stringify(userStore.userInfo))
    }
    
    ElMessage.success('基本信息更新成功')
  } catch (error) {
    console.error('更新基本信息失败:', error)
    ElMessage.error('更新失败')
  } finally {
    basicLoading.value = false
  }
}

const updatePassword = async () => {
  if (!securityFormRef.value) return
  
  try {
    await securityFormRef.value.validate()
    securityLoading.value = true
    
    // 调用后端API修改密码
    await service.put(`/users/${userStore.userInfo?.id}/password`, {
      userId: userStore.userInfo?.id,
      currentPassword: securityForm.oldPassword,
      newPassword: securityForm.newPassword
    })
    
    ElMessage.success('密码修改成功')
    
    // 重置表单
    Object.assign(securityForm, {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    
    // 清除表单验证状态
    securityFormRef.value?.clearValidate()
    
  } catch (error: any) {
    console.error('修改密码失败:', error)
    // request service的响应拦截器已经处理了错误消息显示
    // 这里只需要处理特殊情况
    if (!error.response) {
      ElMessage.error('网络连接失败')
    }
  } finally {
    securityLoading.value = false
  }
}

const saveNotificationSettings = () => {
  // 模拟保存通知设置
  ElMessage.success('通知设置保存成功')
}

const handleHistoryPageChange = (page: number) => {
  historyPagination.currentPage = page
  loadLoginHistory()
}

const loadLoginHistory = async () => {
  historyLoading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    // 实际项目中这里应该调用API获取登录历史
  } catch (error) {
    console.error('加载登录历史失败:', error)
  } finally {
    historyLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  // 初始化数据
  loadLoginHistory()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-card {
  text-align: center;
}

.profile-header {
  margin-bottom: 30px;
}

.user-avatar {
  margin-bottom: 15px;
}

.user-name {
  margin: 10px 0;
  font-size: 24px;
  font-weight: 500;
  color: #303133;
}

.user-email {
  margin: 5px 0 15px;
  color: #909399;
  font-size: 14px;
}

.user-roles {
  margin-top: 15px;
}

.role-tag {
  margin: 0 5px;
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
  border-top: 1px solid #eee;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.profile-tabs {
  height: 100%;
}

.setting-description {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>