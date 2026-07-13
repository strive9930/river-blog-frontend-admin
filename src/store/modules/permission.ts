// src/store/modules/permission.ts
import { defineStore } from 'pinia';
import api from '@/utils/request';
// 引入前端框架的布局组件
import Layout from '@/layout/index.vue';


// 🌟 使用 Vite 的原生特性，一次性导入 views 目录下所有的 .vue 文件
// 注意：这里的相对路径一定要根据您项目的实际物理目录层级来调整
const modules = import.meta.glob('../../views/**/*.vue');

// 🌟 新增：将后端的扁平数组转换为带 children 的树形结构
const buildTree = (flatList: any[]) => {
  const tree: any[] = [];
  const map: Record<string, any> = {};

  // 1. 初始化字典，给每个节点安上 children 属性
  flatList.forEach(item => {
    map[item.id] = { ...item, children: [] };
  });

  // 2. 组装树
  flatList.forEach(item => {
    const node = map[item.id];
    if (node.parentId && map[node.parentId]) {
      // 如果有父亲，就把自己塞进父亲的 children 里
      map[node.parentId].children.push(node);
    } else {
      // 没有父亲，或者父亲不存在，那自己就是顶级节点
      tree.push(node);
    }
  });

  return tree;
};

// 递归过滤异步路由的方法
const filterAsyncRoutes = (routes: any[], isRoot = true) => {
  const res: any[] = [];

  routes.forEach(route => {
    const tmp = { ...route };

    // 🌟 核心修复：把后端平铺的字段，统统装进前端 UI 组件唯一认可的 meta 对象里！
    if (!tmp.meta) {
      tmp.meta = {
        title: tmp.title || tmp.name, // 优先使用 title，没有则回退到 name
        icon: tmp.icon,
        hidden: false // 如果您的后端数据库里有隐藏菜单的标识，可以映射到这里
      };
    }

    // 魔法 1：顶级路由强制补齐 '/'
    if (isRoot && tmp.path && !tmp.path.startsWith('/')) {
      tmp.path = '/' + tmp.path;
    }

    // 🌟 增加 typeof 判断，防止二次解析报错
   if (tmp.component && typeof String(tmp.component) === 'string') {
      const compStr = String(tmp.component); // 强制转字符串
      
      if (compStr === 'Layout' || compStr === 'layout') {
        tmp.component = Layout;
      } else {
        const viewPath = `../../views/${compStr}.vue`;
        if (modules[viewPath]) {
          tmp.component = modules[viewPath];
        } else {
          console.error(`[动态路由] 组件 ${viewPath} 不存在，已降级为 404`);
          tmp.component = () => import('@/views/error/404.vue');
        }
      }
    }

    // 魔法 2：孤儿页面自动包裹 Layout 降级保护
    if (isRoot && tmp.component !== Layout) {
      const originalComponent = tmp.component;
      const originalName = tmp.name; 

      tmp.component = Layout;
      tmp.name = originalName ? `${originalName}Wrapper` : undefined;

      tmp.children = [
        {
          path: '', 
          name: originalName, 
          component: originalComponent,
          meta: { 
            title: tmp.title, // 这里子节点也要用完整的 title 和 icon
            icon: tmp.icon 
          }
        }
      ];
    }

    if (tmp.children && tmp.children.length > 0) {
      tmp.children = filterAsyncRoutes(tmp.children, false);
    }

    res.push(tmp);
  });

  return res;
};

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    routes: [] as any[],
    addRoutes: [] as any[],
    isRoutesGenerated: false // 🌟 新增：是否已经生成过路由的绝对标记
  }),
  actions: {
    async generateRoutes() {
      try {
        const res = await api.get('/api/identity/auth/my-menus');
        
        // 获取原始的扁平数据
        const rawMenus = res.data || [];

        // 🌟 核心修复：在这里把扁平数组转成嵌套树！
        const treeMenus = buildTree(rawMenus);

        // 拿着处理好的树形结构，去执行后续的路由映射
        const accessedRoutes = filterAsyncRoutes(treeMenus);

        this.addRoutes = accessedRoutes;
        this.routes = accessedRoutes; 
        this.isRoutesGenerated = true; // 🌟 成功生成后，打上死锁标记

        return accessedRoutes;
      } catch (error) {
        return Promise.reject(error);
      }
    }
  }
});