import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import App from './App.vue'
import router from './router'
import GlobalLoading from './components/GlobalLoading.vue'
import { setupGlobalErrorHandler } from './services/errorHandlingService'
import { setupStorageCleanup } from './utils/storageCleanup'

const app = createApp(App)

// 注册 Element Plus Icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 清理localStorage中的无效数据
setupStorageCleanup()

// 设置全局错误处理器
setupGlobalErrorHandler()

app.use(createPinia())
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
})

// 注册全局组件
app.component('GlobalLoading', GlobalLoading)

app.mount('#app')