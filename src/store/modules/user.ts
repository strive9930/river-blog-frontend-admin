// src/store/modules/user.ts
import { defineStore } from 'pinia';
import api from '@/utils/request';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    roles: JSON.parse(localStorage.getItem('roles') || '[]') as string[],
    userInfo: JSON.parse(localStorage.getItem('userInfo') || '{}') as any,
    // 🌟 1. 新增：专门存储该用户拥有的 API 权限标识集合
    permissions: JSON.parse(localStorage.getItem('permissions') || '[]') as string[]
  }),

  actions: {
    // 1. 登录并保存 Token 及用户信息
    async login(loginForm: any) {
      try {
        const res = await api.post('/api/identity/auth/login', loginForm);
        
        const loginData = res.data; 
        const tokenStr = loginData?.token; 
        
        this.token = tokenStr;
        this.roles = loginData?.roles || [];
        this.userInfo = {
          username: loginData?.username,
          realName: loginData?.realName
        };

        localStorage.setItem('token', tokenStr);
        localStorage.setItem('roles', JSON.stringify(this.roles));
        localStorage.setItem('userInfo', JSON.stringify(this.userInfo));
        
        // 🌟 2. 核心新增：登录成功拿到 Token 后，立刻拉取该用户的 API 权限集合！
        await this.getUserPermissions();

        return res;
      } catch (error) {
        return Promise.reject(error);
      }
    },

    // 🌟 3. 新增：独立请求后端 my-permissions 接口的方法
    async getUserPermissions() {
      try {
        const res = await api.get('/api/identity/auth/my-permissions');
        // 根据后端返回的格式提取数组，并存入内存和硬盘
        this.permissions = res.data || [];
        localStorage.setItem('permissions', JSON.stringify(this.permissions));
        return this.permissions;
      } catch (error) {
        console.error('获取权限列表失败', error);
        this.permissions = [];
        return [];
      }
    },

    // 2. 获取用户基础信息
    async getUserInfo() {
      try {
        return this.roles.length > 0 ? this.roles : ['admin'];
      } catch (error) {
        return Promise.reject(error);
      }
    },

    // 3. 退出登录
    async logout() {
      try {
        // await api.post('/api/identity/auth/logout');
      } finally {
        this.resetToken();
      }
    },

    // 4. 重置前端状态
    resetToken() {
      this.token = '';
      this.roles = [];
      this.userInfo = {};
      this.permissions = []; // 🌟 4. 新增清理内存
      
      localStorage.removeItem('token');
      localStorage.removeItem('roles');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('permissions'); // 🌟 5. 新增清理硬盘缓存
    }
  }
});