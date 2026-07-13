// src/directive/auth/index.ts
import type { Directive, DirectiveBinding } from 'vue';
import { useUserStore } from '@/store/modules/user';

export const auth: Directive = {
  // 在绑定元素的父组件及他自己的所有子节点都挂载完成后调用
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding;
    const userStore = useUserStore();
    
    // 💡 这里取的是用户的角色数组。
    // 如果您的 Identity 服务未来支持了更细粒度的 Claim（比如 "system:user:add"），
    // 可以将其存入 userStore.permissions 中，并在这里替换为 userStore.permissions。
    const userRoles = userStore.roles || [];

    // 假设 'Admin' 是超级管理员，拥有所有最高权限，直接放行
    const isSuperAdmin = userRoles.includes('Admin');
    if (isSuperAdmin) return;

    // 如果传入了指令值，并且是数组格式
    if (value && value instanceof Array && value.length > 0) {
      const requiredAuths = value;

      // 判断用户拥有的角色/权限标识，是否包含该按钮要求的权限
      const hasPermission = userRoles.some(role => {
        return requiredAuths.includes(role);
      });

      // 如果没有权限，直接从 DOM 树上无情抹除该节点
      if (!hasPermission) {
        el.parentNode && el.parentNode.removeChild(el);
      }
    } else {
      throw new Error(`请正确配置权限标识，例如: v-auth="['system:user:delete']"`);
    }
  }
};