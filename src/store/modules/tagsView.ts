import { defineStore } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'

export interface TagView {
  name?: string
  path: string
  title?: string
  meta?: any
  query?: any
  params?: any
}

interface TagsViewState {
  visitedViews: TagView[]
  cachedViews: string[]
}

export const useTagsViewStore = defineStore('tagsView', {
  state: (): TagsViewState => ({
    visitedViews: [],
    cachedViews: []
  }),

  getters: {
    visitedViewsList: (state) => state.visitedViews,
    cachedViewsList: (state) => state.cachedViews
  },

  actions: {
    /**
     * 添加已访问的视图
     */
    addVisitedView(view: RouteLocationNormalized) {
      // 检查是否已存在
      const existingIndex = this.visitedViews.findIndex(v => v.path === view.path)
      
      if (existingIndex === -1) {
        // 新增标签页
        this.visitedViews.push({
          name: view.name as string,
          path: view.path,
          title: view.meta?.title || '未知页面',
          meta: { ...view.meta },
          query: { ...view.query },
          params: { ...view.params }
        })
      } else {
        // 更新现有标签页的信息
        this.visitedViews[existingIndex] = {
          name: view.name as string,
          path: view.path,
          title: view.meta?.title || '未知页面',
          meta: { ...view.meta },
          query: { ...view.query },
          params: { ...view.params }
        }
      }

      // 处理缓存
      this.addCachedView(view)
    },

    /**
     * 添加缓存视图
     */
    addCachedView(view: RouteLocationNormalized) {
      if (!view.name) return
      
      // 检查是否需要缓存
      if (view.meta?.noCache) return
      
      // 检查是否已缓存
      if (!this.cachedViews.includes(view.name as string)) {
        this.cachedViews.push(view.name as string)
      }
    },

    /**
     * 删除已访问的视图
     */
    delVisitedView(view: TagView) {
      return new Promise(resolve => {
        const index = this.visitedViews.findIndex(v => v.path === view.path)
        if (index > -1) {
          this.visitedViews.splice(index, 1)
        }
        this.delCachedView(view)
        resolve([...this.visitedViews])
      })
    },

    /**
     * 删除缓存视图
     */
    delCachedView(view: TagView) {
      return new Promise(resolve => {
        if (view.name) {
          const index = this.cachedViews.indexOf(view.name)
          if (index > -1) {
            this.cachedViews.splice(index, 1)
          }
        }
        resolve([...this.cachedViews])
      })
    },

    /**
     * 删除其他视图
     */
    delOthersVisitedViews(view: TagView) {
      return new Promise(resolve => {
        this.visitedViews = this.visitedViews.filter(v => {
          return v.meta?.affix || v.path === view.path
        })
        this.delOthersCachedViews(view)
        resolve([...this.visitedViews])
      })
    },

    /**
     * 删除其他缓存视图
     */
    delOthersCachedViews(view: TagView) {
      return new Promise(resolve => {
        const index = this.cachedViews.indexOf(view.name as string)
        if (index > -1) {
          this.cachedViews = this.cachedViews.slice(index, index + 1)
        } else {
          this.cachedViews = []
        }
        resolve([...this.cachedViews])
      })
    },

    /**
     * 删除所有视图
     */
    delAllVisitedViews() {
      return new Promise(resolve => {
        // 保留固定标签页
        const affixTags = this.visitedViews.filter(tag => tag.meta?.affix)
        this.visitedViews = affixTags
        this.delAllCachedViews()
        resolve([...this.visitedViews])
      })
    },

    /**
     * 删除所有缓存视图
     */
    delAllCachedViews() {
      return new Promise(resolve => {
        this.cachedViews = []
        resolve([...this.cachedViews])
      })
    },

    /**
     * 更新已访问视图
     */
    updateVisitedView(view: RouteLocationNormalized) {
      for (let v of this.visitedViews) {
        if (v.path === view.path) {
          v = Object.assign(v, {
            name: view.name,
            meta: { ...view.meta },
            query: { ...view.query },
            params: { ...view.params }
          })
          break
        }
      }
    },

    /**
     * 删除右侧视图
     */
    delRightViews(view: TagView) {
      return new Promise(resolve => {
        const index = this.visitedViews.findIndex(v => v.path === view.path)
        if (index === -1) {
          return resolve([...this.visitedViews])
        }
        
        this.visitedViews = this.visitedViews.filter((item, i) => {
          if (i <= index || item.meta?.affix) {
            return true
          }
          this.delCachedView(item)
          return false
        })
        resolve([...this.visitedViews])
      })
    },

    /**
     * 删除左侧视图
     */
    delLeftViews(view: TagView) {
      return new Promise(resolve => {
        const index = this.visitedViews.findIndex(v => v.path === view.path)
        if (index === -1) {
          return resolve([...this.visitedViews])
        }
        
        this.visitedViews = this.visitedViews.filter((item, i) => {
          if (i >= index || item.meta?.affix) {
            return true
          }
          this.delCachedView(item)
          return false
        })
        resolve([...this.visitedViews])
      })
    }
  }
})