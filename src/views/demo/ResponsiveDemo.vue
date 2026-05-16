<template>
  <div class="responsive-demo">
    <ResponsiveContainer 
      :fluid="false" 
      max-width="1400px"
      :padding="20"
      gap="20"
    >
      <template #default="{ responsive }">
        <!-- 响应式信息展示 -->
        <ResponsiveCard class="info-card">
          <template #header>
            <h2>响应式设计演示</h2>
          </template>
          
          <div class="info-grid">
            <div class="info-item">
              <strong>当前屏幕尺寸:</strong>
              <el-tag :type="getSizeTagType(responsive.screenSize)">
                {{ responsive.screenSize.toUpperCase() }}
              </el-tag>
            </div>
            <div class="info-item">
              <strong>屏幕宽度:</strong>
              <span>{{ responsive.width }}px</span>
            </div>
            <div class="info-item">
              <strong>设备类型:</strong>
              <el-tag :type="getDeviceTagType(responsive)">
                {{ getDeviceType(responsive) }}
              </el-tag>
            </div>
            <div class="info-item">
              <strong>网格列数:</strong>
              <span>{{ getGridColumns() }} 列</span>
            </div>
          </div>
        </ResponsiveCard>

        <!-- 布局演示 -->
        <div class="layout-demo">
          <h3>弹性布局演示</h3>
          
          <ResponsiveContainer 
            :flex-direction="getFlexDirection()"
            :gap="15"
          >
            <ResponsiveCard 
              v-for="item in layoutItems" 
              :key="item.id"
              class="layout-item"
              :style="{ flex: item.flex }"
            >
              <template #header>
                <strong>{{ item.title }}</strong>
              </template>
              <div class="item-content">
                {{ item.content }}
              </div>
            </ResponsiveCard>
          </ResponsiveContainer>
        </div>

        <!-- 组件响应式测试 -->
        <div class="components-demo">
          <h3>组件响应式测试</h3>
          
          <el-row :gutter="20">
            <el-col :span="getColSpan()">
              <ResponsiveCard>
                <template #header>
                  <div class="card-header-content">
                    <el-icon><User /></el-icon>
                    <span>用户信息</span>
                  </div>
                </template>
                
                <el-form label-position="top" size="small">
                  <el-form-item label="用户名">
                    <el-input placeholder="请输入用户名" />
                  </el-form-item>
                  <el-form-item label="邮箱">
                    <el-input placeholder="请输入邮箱" />
                  </el-form-item>
                  <el-form-item label="角色">
                    <el-select placeholder="请选择角色" style="width: 100%;">
                      <el-option label="管理员" value="admin" />
                      <el-option label="用户" value="user" />
                    </el-select>
                  </el-form-item>
                </el-form>
                
                <template #footer>
                  <el-button type="primary" style="width: 100%;">保存</el-button>
                </template>
              </ResponsiveCard>
            </el-col>
            
            <el-col :span="getColSpan()">
              <ResponsiveCard>
                <template #header>
                  <div class="card-header-content">
                    <el-icon><Lock /></el-icon>
                    <span>权限设置</span>
                  </div>
                </template>
                
                <div class="permissions-list">
                  <el-checkbox-group v-model="selectedPermissions">
                    <div 
                      v-for="perm in permissions" 
                      :key="perm.id"
                      class="permission-item"
                    >
                      <el-checkbox :label="perm.id">
                        {{ perm.name }}
                      </el-checkbox>
                      <el-tag size="small" type="info">{{ perm.code }}</el-tag>
                    </div>
                  </el-checkbox-group>
                </div>
                
                <template #footer>
                  <el-button @click="selectAllPermissions">全选</el-button>
                  <el-button @click="clearAllPermissions">清空</el-button>
                </template>
              </ResponsiveCard>
            </el-col>
          </el-row>
        </div>

        <!-- 表格响应式测试 -->
        <ResponsiveCard>
          <template #header>
            <h3>响应式表格</h3>
          </template>
          
          <el-table 
            :data="tableData" 
            style="width: 100%"
            :size="getTableSize()"
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="email" label="邮箱" :show-overflow-tooltip="true" />
            <el-table-column prop="role" label="角色" width="120">
              <template #default="scope">
                <el-tag :type="getRoleTagType(scope.row.role)">
                  {{ scope.row.role }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-switch 
                  v-model="scope.row.status"
                  size="small"
                  inline-prompt
                  active-text="启用"
                  inactive-text="禁用"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <el-button size="small" type="primary">编辑</el-button>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </ResponsiveCard>
      </template>
    </ResponsiveContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { User, Lock } from '@element-plus/icons-vue'
import { useResponsive } from '@/utils/responsiveUtils'
import ResponsiveContainer from '@/components/ResponsiveContainer.vue'
import ResponsiveCard from '@/components/ResponsiveCard.vue'

const { state: responsive, isMobile, isTablet, isDesktop, getValue, getGridColumns } = useResponsive()

const selectedPermissions = ref<number[]>([])
const permissions = ref([
  { id: 1, name: '用户查看', code: 'user.view' },
  { id: 2, name: '用户创建', code: 'user.create' },
  { id: 3, name: '权限管理', code: 'permission.manage' },
  { id: 4, name: '系统配置', code: 'system.config' }
])

const layoutItems = ref([
  { id: 1, title: '左侧面板', content: '这是左侧的内容区域', flex: '1' },
  { id: 2, title: '中间面板', content: '这是中间的主要内容区域', flex: '2' },
  { id: 3, title: '右侧面板', content: '这是右侧的辅助内容区域', flex: '1' }
])

const tableData = ref([
  { id: 1, name: '张三', email: 'zhangsan@example.com', role: 'admin', status: true },
  { id: 2, name: '李四', email: 'lisi@example.com', role: 'user', status: true },
  { id: 3, name: '王五', email: 'wangwu@example.com', role: 'user', status: false }
])

// 响应式计算方法
const getSizeTagType = (size: string) => {
  const types: Record<string, string> = {
    xs: 'danger',
    sm: 'warning',
    md: 'primary',
    lg: 'success',
    xl: 'info',
    xxl: 'info'
  }
  return types[size] || 'info'
}

const getDeviceTagType = (responsive: any) => {
  if (responsive.isMobile) return 'danger'
  if (responsive.isTablet) return 'warning'
  if (responsive.isDesktop) return 'success'
  return 'info'
}

const getDeviceType = (responsive: any) => {
  if (responsive.isMobile) return '移动设备'
  if (responsive.isTablet) return '平板设备'
  if (responsive.isDesktop) return '桌面设备'
  return '未知设备'
}

const getFlexDirection = () => {
  return getValue({
    xs: 'column',
    sm: 'column',
    md: 'row',
    lg: 'row',
    xl: 'row',
    xxl: 'row'
  }) || 'row'
}

const getColSpan = () => {
  return getValue({
    xs: 24,
    sm: 24,
    md: 12,
    lg: 12,
    xl: 12,
    xxl: 12
  }) || 24
}

const getTableSize = () => {
  return getValue({
    xs: 'small',
    sm: 'small',
    md: 'default',
    lg: 'default',
    xl: 'default',
    xxl: 'default'
  }) || 'default'
}

const getRoleTagType = (role: string) => {
  const types: Record<string, string> = {
    admin: 'danger',
    user: 'primary',
    guest: 'info'
  }
  return types[role] || 'info'
}

// 操作方法
const selectAllPermissions = () => {
  selectedPermissions.value = permissions.value.map(p => p.id)
}

const clearAllPermissions = () => {
  selectedPermissions.value = []
}
</script>

<style scoped>
.responsive-demo {
  padding: 20px;
  background-color: var(--el-bg-color-page);
  min-height: 100vh;
}

.info-card {
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item strong {
  color: var(--el-text-color-primary);
}

.layout-demo {
  margin-bottom: 30px;
}

.layout-demo h3 {
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}

.layout-item {
  min-width: 250px;
}

.item-content {
  padding: 15px 0;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.components-demo {
  margin-bottom: 30px;
}

.components-demo h3 {
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}

.card-header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header-content .el-icon {
  font-size: 18px;
}

.permissions-list {
  max-height: 200px;
  overflow-y: auto;
}

.permission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-light);
}

.permission-item:last-child {
  border-bottom: none;
}

/* 响应式调整 */
@media (max-width: 767px) {
  .responsive-demo {
    padding: 10px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .layout-item {
    min-width: 100%;
  }
  
  .permission-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}

@media (min-width: 768px) and (max-width: 991px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 暗色主题适配 */
html.dark .responsive-demo {
  background-color: var(--el-bg-color);
}

html.dark .permission-item {
  border-bottom-color: var(--el-border-color-dark);
}
</style>