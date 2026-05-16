<template>
  <div class="demo-container">
    <h2>更新菜单组示例</h2>
    
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <span>更新菜单组信息</span>
        </div>
      </template>
      
      <el-form 
        :model="form" 
        :rules="rules" 
        ref="formRef"
        label-width="120px"
      >
        <el-form-item label="菜单组ID" prop="id">
          <el-input 
            v-model="form.id" 
            placeholder="请输入菜单组ID"
            :disabled="!!form.id"
          />
        </el-form-item>
        
        <el-form-item label="菜单组名称" prop="name">
          <el-input 
            v-model="form.name" 
            placeholder="请输入菜单组名称" 
          />
        </el-form-item>
        
        <el-form-item label="菜单组代码" prop="code">
          <el-input 
            v-model="form.code" 
            placeholder="请输入菜单组代码" 
          />
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input 
            v-model="form.description" 
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息" 
          />
        </el-form-item>
        
        <el-form-item label="排序">
          <el-input-number 
            v-model="form.sort" 
            :min="0"
            :max="9999"
          />
        </el-form-item>
        
        <el-form-item label="是否启用" prop="isEnabled">
          <el-switch
            v-model="form.isEnabled"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleSubmit"
            :loading="loading"
          >
            更新菜单组
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="result-card">
      <template #header>
        <div class="card-header">
          <span>请求信息</span>
        </div>
      </template>
      
      <div class="request-info">
        <h4>请求URL:</h4>
        <p>{{ requestUrl }}</p>
        
        <h4>请求参数:</h4>
        <pre>{{ JSON.stringify(requestData, null, 2) }}</pre>
        
        <h4>响应结果:</h4>
        <pre>{{ JSON.stringify(responseData, null, 2) }}</pre>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MenuApiService, UpdateMenuGroupRequest } from '@/api/menu'

// 表单引用
const formRef = ref()

// 加载状态
const loading = ref(false)

// 表单数据
const form = reactive<UpdateMenuGroupRequest & { id?: string }>({
  id: 'eb59ba5a-b636-402d-9ecf-1f83b435e5c0', // 默认ID
  name: '',
  code: '',
  description: '',
  sort: 0,
  isEnabled: true
})

// 表单验证规则
const rules = {
  id: [
    { required: true, message: '请输入菜单组ID', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入菜单组名称', trigger: 'blur' },
    { min: 2, max: 50, message: '菜单组名称长度应在2-50个字符之间', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入菜单组代码', trigger: 'blur' },
    { min: 2, max: 50, message: '菜单组代码长度应在2-50个字符之间', trigger: 'blur' }
  ]
}

// 请求和响应数据
const requestUrl = ref('')
const requestData = ref<UpdateMenuGroupRequest>({})
const responseData = ref<any>(null)

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    loading.value = true
    
    // 准备请求数据，只包含有值的字段
    const updateTimea: UpdateMenuGroupRequest = {}
    if (form.name !== undefined) updateTimea.name = form.name
    if (form.code !== undefined) updateTimea.code = form.code
    if (form.description !== undefined) updateTimea.description = form.description
    if (form.sort !== undefined) updateTimea.sort = form.sort
    if (form.isEnabled !== undefined) updateTimea.isEnabled = form.isEnabled
    
    // 设置请求信息
    requestUrl.value = `/menus/groups/${form.id}`
    requestData.value = { ...updateTimea }
    
    // 调用API更新菜单组
    const response = await MenuApiService.updateMenuGroup(form.id!, updateTimea)
    
    responseData.value = response
    
    ElMessage.success('菜单组更新成功！')
  } catch (error: any) {
    console.error('更新菜单组失败:', error)
    ElMessage.error(error.message || '菜单组更新失败')
  } finally {
    loading.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  
  Object.assign(form, {
    id: 'eb59ba5a-b636-402d-9ecf-1f83b435e5c0',
    name: '',
    code: '',
    description: '',
    sort: 0,
    isEnabled: true
  })
}
</script>

<style scoped>
.demo-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.form-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: bold;
}

.result-card pre {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.request-info h4 {
  margin-top: 15px;
  margin-bottom: 5px;
}

.request-info p {
  background-color: #f9f9f9;
  padding: 8px 12px;
  border-radius: 4px;
  word-break: break-all;
}
</style>
</template>