import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import AuthButton from '@/components/AuthButton/index.vue';
import { auth } from './directive/auth';
import './permission';// 👈 新增这一行，激活路由守卫

const app = createApp(App);

app.directive('auth', auth);

app.use(createPinia());
app.use(router);
app.use(ElementPlus);

// 全局注册所有 Element Plus 图标 — 使 <component :is="iconName" /> 动态渲染生效
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component as any);
}

app.component('AuthButton', AuthButton);

app.mount('#app');