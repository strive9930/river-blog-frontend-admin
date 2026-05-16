<template>
  <div class="import-export">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>菜单配置导入导出</span>
        </div>
      </template>
      
      <div class="import-section">
        <el-descriptions title="导入菜单配置" :column="1" border>
          <el-descriptions-item label="功能说明">
            批量导入菜单配置，支持 Excel 或 JSON 格式
          </el-descriptions-item>
          <el-descriptions-item>
            <el-upload
              class="upload-demo"
              drag
              action="/api/menu/import"
              :headers="{ 'Authorization': `Bearer ${localStorage.getItem('token')}` }"
              :on-success="handleImportSuccess"
              :on-error="handleImportError"
              :before-upload="beforeImportUpload"
              :limit="1"
            >
              <el-icon class="el-icon--upload"><Upload /></el-icon>
              <div class="el-upload__text">
                拖拽文件到此处或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  只能上传 xls/xlsx/json 文件，且不超过 500KB
                </div>
              </template>
            </el-upload>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      
      <div class="export-section" style="margin-top: 30px;">
        <el-descriptions title="导出菜单配置" :column="1" border>
          <el-descriptions-item label="功能说明">
            批量导出菜单配置，支持 Excel 或 JSON 格式
          </el-descriptions-item>
          <el-descriptions-item>
            <el-button-group>
              <el-button type="success" @click="exportAsExcel">导出为 Excel</el-button>
              <el-button type="info" @click="exportAsJson">导出为 JSON</el-button>
            </el-button-group>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      
      <div class="template-section" style="margin-top: 30px;">
        <el-descriptions title="下载导入模板" :column="1" border>
          <el-descriptions-item>
            <el-link type="primary" @click="downloadExcelTemplate">下载 Excel 模板</el-link>
            <el-divider direction="vertical" />
            <el-link type="primary" @click="downloadJsonTemplate">下载 JSON 模板</el-link>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Upload } from '@element-plus/icons-vue'

const handleImportSuccess = (response: any) => {
  console.log('导入成功:', response)
}

const handleImportError = (error: any) => {
  console.log('导入失败:', error)
}

const beforeImportUpload = (file: File) => {
  const isXls = file.type === 'application/vnd.ms-excel'
  const isXlsx = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  const isJson = file.type === 'application/json'
  const isLt500K = file.size / 1024 < 500

  if (!isXls && !isXlsx && !isJson) {
    alert('只能上传 xls/xlsx/json 格式!')
    return false
  }
  if (!isLt500K) {
    alert('文件大小不能超过 500KB!')
    return false
  }
  return true
}

const exportAsExcel = () => {
  console.log('导出为 Excel')
  // 模拟导出 Excel 操作
}

const exportAsJson = () => {
  console.log('导出为 JSON')
  // 模拟导出 JSON 操作
}

const downloadExcelTemplate = () => {
  console.log('下载 Excel 模板')
  // 模拟下载 Excel 模板操作
}

const downloadJsonTemplate = () => {
  console.log('下载 JSON 模板')
  // 模拟下载 JSON 模板操作
}
</script>

<style scoped>
.import-export {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-demo {
  text-align: center;
  width: 50%;
  margin: 0 auto;
}
</style>