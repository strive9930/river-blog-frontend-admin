<template>
  <div class="menu-list">
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索菜单名称或描述"
            clearable
            @keyup.enter="searchMenus"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="searchForm.group"
            placeholder="分组筛选"
            clearable
            style="width: 100%"
          >
            <el-option label="常用功能" value="common"></el-option>
            <el-option label="系统管理" value="system"></el-option>
            <el-option label="内容管理" value="content"></el-option>
          </el-select>
        </el-col>
        <el-col :span="14">
          <el-button type="primary" @click="searchMenus">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="success" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>新建菜单
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>菜单列表</span>
          <div>
            <el-button type="primary" link @click="refreshData">
              <el-icon><Refresh /></el-icon>刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="menuList"
        v-loading="loading"
        stripe
        style="width: 100%"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="name" label="菜单名称" width="180"></el-table-column>
        <el-table-column prop="title" label="标题" width="150"></el-table-column>
        <el-table-column prop="path" label="路径" width="200"></el-table-column>
        <el-table-column prop="component" label="组件" width="200"></el-table-column>
        <el-table-column prop="group" label="分组" width="120"></el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" align="center"></el-table-column>
        <el-table-column prop="isEnabled" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isEnabled ? 'success' : 'danger'">
              {{ row.isEnabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isVisible" label="可见性" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isVisible ? 'success' : 'danger'">
              {{ row.isVisible ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" align="center"></el-table-column>
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetails(row)">查看</el-button>
            <el-button size="small" type="primary" @click="editMenu(row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="row.isEnabled ? 'warning' : 'success'" 
              @click="toggleStatus(row)"
            >
              {{ row.isEnabled ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteMenu(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          :current-page="pagination.currentPage"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 查看/编辑菜单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :before-close="handleDialogClose"
    >
      <el-form
        :model="menuForm"
        :rules="formRules"
        ref="menuFormRef"
        label-width="100px"
      >
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="menuForm.name" placeholder="请输入菜单名称"></el-input>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="menuForm.title" placeholder="请输入标题"></el-input>
        </el-form-item>
        <el-form-item label="路径" prop="path">
          <el-input v-model="menuForm.path" placeholder="请输入路径"></el-input>
        </el-form-item>
        <el-form-item label="组件" prop="component">
          <el-input v-model="menuForm.component" placeholder="请输入组件路径"></el-input>
        </el-form-item>
        <el-form-item label="分组" prop="group">
          <el-select v-model="menuForm.group" placeholder="请选择分组" style="width: 100%">
            <el-option label="常用功能" value="common"></el-option>
            <el-option label="系统管理" value="system"></el-option>
            <el-option label="内容管理" value="content"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="menuForm.sortOrder" :min="0" :max="999" style="width: 100%"></el-input-number>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch
            v-model="menuForm.isEnabled"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        <el-form-item label="可见性">
          <el-switch
            v-model="menuForm.isVisible"
            active-text="显示"
            inactive-text="隐藏"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelDialog">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Refresh } from '@element-plus/icons-vue'
import MenuApiService, { type Menu } from '@/api/menu'

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const menuList = ref<Menu[]>([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  group: ''
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 菜单表单
const menuForm = reactive({
  id: '',
  name: '',
  title: '',
  path: '',
  component: '',
  group: '',
  sortOrder: 0,
  isEnabled: true,
  isVisible: true
})

// 表单引用
const menuFormRef = ref()

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  path: [
    { required: true, message: '请输入路径', trigger: 'blur' },
    { pattern: /^\/[\w/-]*$/, message: '路径格式不正确', trigger: 'blur' }
  ]
}

// 方法
const searchMenus = async () => {
  try {
    loading.value = true
    
    // 构建查询参数
    const queryParams: any = {}
    
    if (searchForm.keyword) {
      queryParams.keyword = searchForm.keyword.trim()
    }
    if (searchForm.group) {
      queryParams.group = searchForm.group
    }
    
    // 添加分页参数
    queryParams.pageIndex = pagination.currentPage
    queryParams.pageSize = pagination.pageSize
    
    console.log('搜索参数:', queryParams)
    
    // 实际调用API
    const response = await MenuApiService.getMenus(queryParams)
    
    if (response.success) {
      menuList.value = response.data || []
      // 设置总数，这里简化处理
      pagination.total = menuList.value.length
      ElMessage.success(`找到 ${menuList.value.length} 条记录`)
    } else {
      throw new Error(response.message || '获取菜单列表失败')
    }
  } catch (error: any) {
    console.error('搜索菜单失败:', error)
    ElMessage.error('搜索失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.group = ''
  // 重置分页到第一页
  pagination.currentPage = 1
  // 重新加载所有数据
  refreshData()
  ElMessage.success('搜索条件已重置')
}

const refreshData = async () => {
  try {
    loading.value = true
    
    // 实际调用API
    const response = await MenuApiService.getMenus()
    
    if (response.success) {
      menuList.value = response.data || []
      pagination.total = menuList.value.length
      ElMessage.success('数据刷新成功')
    } else {
      throw new Error(response.message || '获取菜单列表失败')
    }
  } catch (error: any) {
    console.error('获取菜单列表失败:', error)
    ElMessage.error('获取菜单列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const showCreateDialog = () => {
  dialogTitle.value = '创建菜单'
  resetMenuForm()
  dialogVisible.value = true
}

const editMenu = (menu: Menu) => {
  dialogTitle.value = '编辑菜单'
  Object.assign(menuForm, menu)
  dialogVisible.value = true
}

const viewDetails = (menu: Menu) => {
  dialogTitle.value = '菜单详情'
  Object.assign(menuForm, menu)
  // 禁用表单编辑
  dialogVisible.value = true
}

const toggleStatus = async (menu: Menu) => {
  try {
    const action = menu.isEnabled ? '禁用' : '启用'
    await ElMessageBox.confirm(
      `确定要${action}菜单 "${menu.name}" 吗？`,
      '状态变更确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 调用API更新菜单状态，确保传递所有必要字段
    const response = await MenuApiService.updateMenu(menu.id, {
      name: menu.name,
      title: menu.title,
      isEnabled: !menu.isEnabled
    })

    if (response.success) {
      // 更新本地状态
      menu.isEnabled = !menu.isEnabled
      ElMessage.success(`${action}成功`)
    } else {
      throw new Error(response.message || `${action}失败`)
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('菜单状态变更失败:', error)
      ElMessage.error(`${menu.isEnabled ? '禁用' : '启用'}失败: ` + error.message)
    }
  }
}

const deleteMenu = async (menu: Menu) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除菜单 "${menu.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 实际调用API删除
    const response = await MenuApiService.deleteMenu(menu.id)
    
    if (response.success) {
      // 从列表中移除
      const index = menuList.value.findIndex(item => item.id === menu.id)
      if (index > -1) {
        menuList.value.splice(index, 1)
        pagination.total -= 1
        ElMessage.success('删除成功')
      }
    } else {
      throw new Error(response.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除菜单失败:', error)
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

const submitForm = async () => {
  if (!menuFormRef.value) return
  
  try {
    await menuFormRef.value.validate()
    submitLoading.value = true
    
    // 准备提交数据
    const submitData = { ...menuForm }
    
    let response
    if (menuForm.id) {
      // 更新菜单 - 确保必需字段始终被传递
      response = await MenuApiService.updateMenu(menuForm.id, {
        name: submitData.name,
        title: submitData.title,
        path: submitData.path,
        component: submitData.component,
        group: submitData.group,
        sortOrder: submitData.sortOrder,
        isEnabled: submitData.isEnabled,
        isVisible: submitData.isVisible
      })
      
      if (response.success) {
        // 更新列表中的菜单数据
        const index = menuList.value.findIndex(item => item.id === menuForm.id)
        if (index > -1) {
          menuList.value[index] = { ...submitData }
        }
        ElMessage.success('菜单更新成功')
      }
    } else {
      // 创建菜单
      response = await MenuApiService.createMenu(submitData)
      if (response.success) {
        // 添加到列表
        menuList.value.push({ 
          ...submitData, 
          id: response.data?.id || Date.now().toString(), 
          createTime: response.data?.createTime || new Date().toISOString()
        })
        pagination.total += 1
        ElMessage.success('菜单创建成功')
      }
    }
    
    if (response && response.success) {
      // 关闭对话框并重置表单
      dialogVisible.value = false
      resetMenuForm()
    } else {
      throw new Error(response?.message || '操作失败')
    }
  } catch (error: any) {
    console.error('表单提交失败:', error)
    ElMessage.error('操作失败: ' + error.message)
  } finally {
    submitLoading.value = false
  }
}

const cancelDialog = () => {
  dialogVisible.value = false
  resetMenuForm()
}

const handleDialogClose = () => {
  cancelDialog()
}

const resetMenuForm = () => {
  Object.assign(menuForm, {
    id: '',
    name: '',
    title: '',
    path: '',
    component: '',
    group: '',
    sortOrder: 0,
    isEnabled: true,
    isVisible: true
  })
  menuFormRef.value?.clearValidate()
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  refreshData()
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  refreshData()
}

// 生命周期
refreshData()
</script>

<style scoped>
.menu-list {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>