<template>
  <div class="about-page">
    <h2 class="page-title">🙋 关于我</h2>
    <div class="about-card">
      <div class="about-avatar">
        <el-avatar :size="96" :src="siteStore.authorAvatar" />
      </div>
      <h3 class="about-name">{{ siteStore.authorName }}</h3>
      <p class="about-role">全栈工程师 / .NET & Vue 技术爱好者</p>
      <div class="about-bio markdown-body" v-html="parsedBio" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'PortalAbout' });

import { computed } from 'vue';
import { Marked } from 'marked';
import { useSiteStore } from '@/store/modules/site';

const siteStore = useSiteStore();

const marked = new Marked();
marked.setOptions({ breaks: true, gfm: true });

// 👇 修改这里即可更新关于页内容
const bio = `## 👋 你好！

我是一名热爱技术的全栈工程师，目前专注于 **.NET 微服务架构** 与 **Vue 3 前端生态**。

### 🛠 技术栈
- **后端**: .NET 9, ASP.NET Core, Entity Framework Core, Redis, RabbitMQ
- **前端**: Vue 3, TypeScript, Element Plus, Vite
- **数据库**: PostgreSQL, SQL Server, MongoDB
- **DevOps**: Docker, Kubernetes, GitHub Actions, YARP

### 📬 联系方式
- **Email**: riverli@example.com
- **GitHub**: [github.com/riverli](https://github.com)

### 📝 关于本站
本站基于 **整洁架构 (Clean Architecture)** 构建，采用微服务拆分：
- Identity 服务 — 认证与权限
- Blog 服务 — 文章与内容管理
- OSS 存储 — 阿里云对象存储

前端使用 Vue 3 + Element Plus，支持 Dark Mode 与 Markdown 实时渲染。
`;

const parsedBio = computed(() => marked.parse(bio) as string);
</script>

<style scoped>
.about-page { max-width: 700px; margin: 0 auto; }
.page-title { font-size: 24px; color: #1d2129; margin: 0 0 24px; }
.about-card { background: #fff; border-radius: 10px; border: 1px solid #f0f0f0; padding: 36px 40px; text-align: center; }
.about-avatar { margin-bottom: 16px; }
.about-name { font-size: 22px; color: #1d2129; margin: 0 0 4px; }
.about-role { font-size: 14px; color: #8a919f; margin: 0 0 24px; }
.about-bio { text-align: left; font-size: 15px; line-height: 1.8; color: #4e5969; }
:deep(.about-bio) h2, :deep(.about-bio) h3 { color: #1d2129; margin-top: 20px; }
:deep(.about-bio) ul { padding-left: 20px; }
:deep(.about-bio) code { background: #f4f5f5; padding: 2px 6px; border-radius: 4px; font-size: 85%; }
</style>
