<template>
  <div class="portal-wrapper">
    <PortalHeader />

    <main class="portal-main">
      <router-view v-slot="{ Component }">
        <transition name="fade-transform" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="portal-footer">
      <div class="footer-inner">
        <!-- 运行时间 + ICP备案号 -->
        <div class="footer-meta" v-if="siteStore.runtimeDays > 0 || siteStore.icpNumber">
          <span v-if="siteStore.runtimeDays > 0" class="footer-item runtime">
            🕐 站点已运行 <strong>{{ siteStore.runtimeDays }}</strong> 天
          </span>
          <span v-if="siteStore.runtimeDays > 0 && siteStore.icpNumber" class="footer-divider">·</span>
          <a
            v-if="siteStore.icpNumber"
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener"
            class="footer-item icp"
          >
            {{ siteStore.icpNumber }}
          </a>
        </div>

        <!-- 赞助商 -->
        <div class="footer-meta" v-if="siteStore.sponsorName">
          <a :href="siteStore.sponsorUrl || '#'" target="_blank" rel="noopener" class="footer-item sponsor">
            💎 {{ siteStore.sponsorName }} - 本站服务器赞助商
          </a>
        </div>

        <!-- ThriveX 品牌 -->
        <div class="footer-meta" v-if="siteStore.thrivexBranding">
          <span class="footer-item">
            基于开源项目 <a href="https://github.com/Liuyuyang007/ThriveX" target="_blank" rel="noopener">ThriveX</a> 构建
          </span>
        </div>

        <!-- 社交链接 -->
        <div class="footer-social" v-if="siteStore.socialLinks.length > 0">
          <a
            v-for="link in siteStore.socialLinks"
            :key="link.platform"
            :href="link.url"
            target="_blank"
            rel="noopener"
            :title="link.platform"
            class="social-icon"
          >
            <svg v-if="link.platform === 'GitHub'" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            <svg v-else-if="link.platform === 'RSS' || link.platform === 'Feed'" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-3.83A11.73 11.73 0 0 0 4 8.27V4.44m0 7.83a7.73 7.73 0 0 1 7.73 7.73H7.95A3.95 3.95 0 0 0 4 16.05v-3.78z"/></svg>
            <span v-else>{{ link.platform }}</span>
          </a>
        </div>

        <p class="footer-copy">© {{ new Date().getFullYear() }} {{ siteStore.siteName }}. All Rights Reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import PortalHeader from './Header.vue';
import { useSiteStore } from '@/store/modules/site';

const siteStore = useSiteStore();
</script>

<style scoped>
.portal-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f4f5f5;
  transition: background-color .3s;
}
.portal-main {
  flex: 1;
  max-width: 1200px;
  margin: 20px auto;
  width: 100%;
  padding: 0 20px;
}
.portal-footer {
  text-align: center;
  padding: 24px 0;
  color: #8a919f;
  font-size: 14px;
  border-top: 1px solid #f0f0f0;
  margin-top: 40px;
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.footer-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}
.footer-item {
  color: #8a919f;
  font-size: 13px;
}
.footer-item.icp {
  text-decoration: none;
  transition: color .2s;
}
.footer-item.icp:hover { color: #1e80ff; }
.footer-item.sponsor {
  text-decoration: none;
  color: #f59e0b;
  font-weight: 500;
  transition: color .2s;
}
.footer-item.sponsor:hover { color: #d97706; }
.footer-item strong {
  color: #4e5969;
  font-weight: 600;
}
.footer-divider {
  color: #d0d3d9;
}
.footer-social {
  display: flex;
  gap: 12px;
  align-items: center;
}
.social-icon {
  color: #8a919f;
  transition: color .2s;
  display: flex;
  align-items: center;
}
.social-icon:hover {
  color: #1d2129;
}
.footer-copy {
  font-size: 12px;
  color: #b0b5be;
  margin: 0;
  margin-top: 4px;
}
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s;
}
.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>

<style>
/* 非 scoped — 全局 dark mode */
html.dark body { background: #1a1a2e; color: #e5e7eb; }
html.dark .portal-wrapper { background-color: #1a1a2e; }
html.dark .portal-footer { color: #6b7280; border-top-color: #333350; }
html.dark .footer-item { color: #6b7280; }
html.dark .footer-item strong { color: #9ca3af; }
html.dark .footer-copy { color: #4b5563; }
html.dark .social-icon:hover { color: #e5e7eb; }
html.dark .el-card { background: #252540 !important; border-color: #333350 !important; }
html.dark .el-card .el-card__header { border-bottom-color: #333350 !important; }
html.dark .el-input__wrapper { background: #2a2a40 !important; box-shadow: none !important; }
html.dark .el-select .el-input__wrapper { background: #2a2a40 !important; }
html.dark .article-card, html.dark .article-detail-container, html.dark .result-card,
html.dark .timeline-item, html.dark .link-card, html.dark .about-card, html.dark .timeline-item,
html.dark .back-to-top { background: #252540 !important; border-color: #333350 !important; }
html.dark .card-title, html.dark .article-title, html.dark .title, html.dark .page-title,
html.dark .profile-name, html.dark .stat-num, html.dark .about-name, html.dark .result-title,
html.dark .tl-date { color: #e5e7eb !important; }
html.dark .card-summary, html.dark .article-summary, html.dark .profile-bio, html.dark .about-role,
html.dark .result-summary, html.dark .stat-lbl, html.dark .footer-item, html.dark .tl-title,
html.dark .meta-item, html.dark .link-desc, html.dark .link-name, html.dark .adj-title,
html.dark .cat-name { color: #9ca3af !important; }
html.dark .portal-header { background: #1e1e36; border-bottom-color: #333350; box-shadow: 0 1px 3px rgba(0,0,0,.3); }
html.dark .mobile-toggle { color: #9ca3af; }
html.dark .mobile-toggle:hover { background: #2a2a40; }
html.dark .logo { color: #e5e7eb; }
html.dark .logo-subtitle { color: #6b7280; }
html.dark .rss-link { color: #f59e0b; }
html.dark .rss-link:hover { color: #fbbf24; }
html.dark .mobile-nav-dropdown { background: #1e1e36; border-top-color: #333350; }
html.dark .mobile-nav-item { color: #e5e7eb; }
html.dark .mobile-nav-item:hover { background: #2a2a40; color: #60a5fa; }
html.dark .mobile-nav-child { color: #9ca3af; }
html.dark .el-menu { background: #1e1e36 !important; }
html.dark .el-menu-item, html.dark .el-sub-menu__title { color: #e5e7eb !important; }
html.dark .el-menu-item:hover, html.dark .el-sub-menu__title:hover { background: #2a2a40 !important; }
html.dark .user-trigger:hover { background: #2a2a40 !important; }
html.dark .user-name { color: #e5e7eb; }
html.dark .article-body { color: #d1d5db; }
html.dark .back-bar .el-button { color: #9ca3af; }
html.dark .pagination-wrapper { background: transparent; }
html.dark .adjacent-item { background: #252540 !important; border-color: #333350 !important; }
html.dark .year-heading { color: #e5e7eb; }
html.dark .timeline { border-color: #333350; }
html.dark .tl-date { color: #9ca3af; }
html.dark .tl-title { color: #d1d5db; }
html.dark .widget-list-item { border-bottom-color: #2a2a40; }
html.dark .widget-list-item:hover { background: #2a2a40; }
html.dark .comment-widget-name { color: #e5e7eb; }
html.dark .widget-meta { color: #6b7280; }
html.dark .message-editor { background: #1e1e36 !important; }
html.dark .message-item { border-bottom-color: #2a2a40; }
html.dark .msg-nickname { color: #e5e7eb; }
html.dark .msg-time { color: #6b7280; }
html.dark .msg-content { color: #d1d5db; }
html.dark .record-item { background: #252540 !important; border-color: #333350 !important; }
html.dark .record-content { color: #d1d5db; }
html.dark .record-time, html.dark .record-location { color: #6b7280; }
</style>
