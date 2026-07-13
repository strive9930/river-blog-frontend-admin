// src/store/modules/site.ts
// 站点全局配置 — 修改默认值即可更新全站显示
import { defineStore } from 'pinia';

export interface SiteConfig {
  siteName: string;
  siteSubtitle: string;
  authorName: string;
  authorBio: string;
  authorAvatar: string;
  icpNumber: string;
  siteStartDate: string; // ISO date string, e.g. "2017-01-01"
  socialLinks: { platform: string; url: string }[];
  thrivexBranding: boolean;
  sponsorName: string;
  sponsorUrl: string;
}

// 👇 修改这里即可更新全站配置
const defaults: SiteConfig = {
  siteName: 'RiverLi.Blog',
  siteSubtitle: '',
  authorName: 'GuanWen Li',
  authorBio: '专注 .NET 微服务与 Vue 3 前端生态',
  authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=riverli',
  icpNumber: '',
  siteStartDate: '',
  socialLinks: [
    { platform: 'GitHub', url: 'https://github.com' }
  ],
  thrivexBranding: false,
  sponsorName: '',
  sponsorUrl: ''
};

export const useSiteStore = defineStore('site', {
  state: () => ({
    config: { ...defaults } as SiteConfig,
  }),

  getters: {
    siteName: (state) => state.config.siteName,
    siteSubtitle: (state) => state.config.siteSubtitle,
    authorName: (state) => state.config.authorName,
    authorBio: (state) => state.config.authorBio,
    authorAvatar: (state) => state.config.authorAvatar,
    icpNumber: (state) => state.config.icpNumber,
    siteStartDate: (state) => state.config.siteStartDate,
    socialLinks: (state) => state.config.socialLinks,
    thrivexBranding: (state) => state.config.thrivexBranding,
    sponsorName: (state) => state.config.sponsorName,
    sponsorUrl: (state) => state.config.sponsorUrl,

    runtimeDays: (state) => {
      if (!state.config.siteStartDate) return 0;
      const start = new Date(state.config.siteStartDate);
      const now = new Date();
      return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
  },
});
