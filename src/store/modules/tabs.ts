/**
 * 标签页 Store — 管理多标签导航与 keep-alive 缓存。
 *
 * ⚠️ 名称约定：cachedViews 存储的是 route.name（如 "Dashboard", "SystemUser"），
 * 而 keep-alive 的 :include 匹配的是组件的 defineOptions({ name: '...' })。
 * 这两者必须完全一致，否则页面缓存会静默失效。
 * 新增视图时，务必在 .vue 文件中通过 defineOptions 声明与路由 name 一致的组件名。
 */
import { defineStore } from 'pinia';
import type { RouteLocationNormalized } from 'vue-router';
import router from '@/router';

export interface TabView {
  path: string;
  name: string;
  title: string;
  affix?: boolean;
  fullPath: string;
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    visitedViews: [] as TabView[],
    cachedViews: [] as string[],
  }),

  getters: {
    affixViews(): TabView[] {
      return [
        {
          path: '/admin/dashboard',
          name: 'Dashboard',
          title: '仪表盘',
          affix: true,
          fullPath: '/admin/dashboard',
        },
      ];
    },
  },

  actions: {
    /** 初始化 tabs（在 generateRoutes 之后调用） */
    initTabs() {
      this.visitedViews = [...this.affixViews];
      this.cachedViews = this.affixViews.map(v => v.name);
    },

    /** 路由跳转时添加标签 */
    addView(route: RouteLocationNormalized) {
      if (route.meta?.hidden) return;

      const { path, name, meta, fullPath } = route;
      if (!name) return;

      const title = (meta?.title as string) || '';

      const existing = this.visitedViews.find(v => v.path === path);
      if (existing) {
        existing.fullPath = fullPath;
        return;
      }

      // 检查是否为 affix 视图，保证首次登录时也能正确标记
      const isAffix = this.affixViews.some(a => a.path === path);

      this.visitedViews.push({
        path,
        name: name as string,
        title,
        fullPath,
        affix: isAffix || undefined,
      });

      if (!this.cachedViews.includes(name as string)) {
        this.cachedViews.push(name as string);
      }
    },

    /** 关闭指定标签 */
    async removeView(view: TabView) {
      if (view.affix) return;

      const index = this.visitedViews.findIndex(v => v.path === view.path);
      if (index === -1) return;

      this.visitedViews.splice(index, 1);
      this.cachedViews = this.cachedViews.filter(n => n !== view.name);

      // 如果关闭的是当前页，跳到相邻标签
      if (router.currentRoute.value.path === view.path) {
        const next = this.visitedViews[index] || this.visitedViews[index - 1];
        if (next) await router.push(next.fullPath);
      }
    },

    /** 关闭其他标签 */
    closeOthers(view: TabView) {
      this.visitedViews = this.visitedViews.filter(
        v => v.affix || v.path === view.path,
      );
      this.syncCachedViews();

      if (!this.visitedViews.find(v => v.path === router.currentRoute.value.path)) {
        router.push(view.fullPath);
      }
    },

    /** 关闭左侧标签 */
    closeLeft(view: TabView) {
      const idx = this.visitedViews.findIndex(v => v.path === view.path);
      this.visitedViews = this.visitedViews.filter(
        (v, i) => v.affix || i >= idx,
      );
      this.syncCachedViews();

      // 如果当前路由被移除了，跳回选中的标签
      const current = router.currentRoute.value;
      if (!this.visitedViews.some(v => v.path === current.path)) {
        router.push(view.fullPath);
      }
    },

    /** 关闭右侧标签 */
    closeRight(view: TabView) {
      const idx = this.visitedViews.findIndex(v => v.path === view.path);
      this.visitedViews = this.visitedViews.filter(
        (v, i) => v.affix || i <= idx,
      );
      this.syncCachedViews();

      const current = router.currentRoute.value;
      if (!this.visitedViews.some(v => v.path === current.path)) {
        router.push(view.fullPath);
      }
    },

    /** 关闭全部（仅保留 affix） */
    closeAll() {
      this.visitedViews = [...this.affixViews];
      this.cachedViews = this.affixViews.map(v => v.name);
      router.push('/admin/dashboard');
    },

    /** 刷新当前标签页 */
    async refreshView(view: TabView) {
      const idx = this.cachedViews.indexOf(view.name);
      if (idx !== -1) this.cachedViews.splice(idx, 1);

      await router.replace({ path: `/redirect${view.fullPath}` });
    },

    /** 退出登录时清空所有标签 */
    resetTabs() {
      this.visitedViews = [];
      this.cachedViews = [];
    },

    /** 同步 cachedViews 与 visitedViews */
    syncCachedViews() {
      const names = this.visitedViews.map(v => v.name);
      this.cachedViews = this.cachedViews.filter(n => names.includes(n));
    },
  },
});
