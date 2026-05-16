<template>
  <div class="simple-test">
    <h1>组合式API功能测试</h1>
    
    <div class="test-section">
      <h2>1. 表单验证测试</h2>
      <el-form :model="testForm" :rules="testRules" ref="testFormRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="testForm.username" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="testForm.email" />
        </el-form-item>
        <el-button @click="validateForm">验证表单</el-button>
      </el-form>
    </div>

    <div class="test-section">
      <h2>2. 批量操作测试</h2>
      <el-button @click="testBatchOperation">执行批量操作</el-button>
      <div v-if="batchResult">
        <p>成功: {{ batchResult.successCount }}</p>
        <p>失败: {{ batchResult.errorCount }}</p>
      </div>
    </div>

    <div class="test-section">
      <h2>3. 数据管理测试</h2>
      <el-table :data="managedData.paginatedData" height="200">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" />
      </el-table>
      <el-pagination
        v-model:current-page="managedData.pagination.page"
        :page-size="managedData.pagination.size"
        :total="managedData.pagination.total"
        layout="prev, pager, next"
      />
    </div>

    <div class="test-section">
      <h2>4. 动画效果测试</h2>
      <el-button @click="testAnimations">触发动画</el-button>
      <div ref="testBox" class="test-box">
        动画测试区域
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { 
  useFormValidation,
  useBatchOperations,
  useDataManager,
  useAnimations
} from '@/composables'

// 表单验证测试
const testFormRef = ref<FormInstance>()
const testForm = reactive({
  username: '',
  email: ''
})

const testRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }]
}

const formValidation = useFormValidation(testForm, testRules)

const validateForm = async () => {
  const isValid = await formValidation.validateForm()
  ElMessage.success(`表单验证${isValid ? '通过' : '失败'}`)
}

// 批量操作测试
const batchOps = useBatchOperations()
const batchResult = ref<any>(null)

const testBatchOperation = async () => {
  const testData = Array.from({ length: 10 }, (_, i) => ({ id: i, name: `项目${i}` }))
  
  batchResult.value = await batchOps.batchOperation(
    testData,
    async (item) => {
      await new Promise(resolve => setTimeout(resolve, 100))
      if (Math.random() < 0.2) throw new Error('随机失败')
    },
    {
      batchSize: 3,
      onSuccess: (item) => console.log('成功:', item),
      onError: (item, error) => console.log('失败:', item, error)
    }
  )
}

// 数据管理测试
const mockData = Array.from({ length: 50 }, (_, i) => ({ id: i, name: `数据${i}` }))
const managedData = useDataManager(mockData)

// 动画测试
const animations = useAnimations()
const testBox = ref<HTMLElement | null>(null)

const testAnimations = async () => {
  if (testBox.value) {
    await animations.fadeInOut(testBox.value, { duration: 1000 })
    await animations.shake(testBox.value, 5, { duration: 500 })
  }
}
</script>

<style scoped>
.simple-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.test-box {
  width: 200px;
  height: 100px;
  background: linear-gradient(45deg, #409eff, #64b5f6);
  margin: 20px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border-radius: 8px;
  font-weight: bold;
}
</style>