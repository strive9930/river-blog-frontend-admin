// src/constants/api-permissions.ts

/**
 * 全局 API 权限常量字典
 * 严格对齐后端 my-permissions 接口返回的路由模板标识
 */
export const ApiPerms = {
  // --- 👤 用户管理模块 ---
  User: {
    GetPage: 'GET:/api/identity/Users/page',
    Add: 'POST:/api/identity/Users',
    Edit: 'PUT:/api/identity/Users/{id}',
    Delete: 'DELETE:/api/identity/Users/{id}',
    GetRoles: 'GET:/api/identity/Users/{id:guid}/roles',
    AssignRole: 'POST:/api/identity/Users/{id}/roles',
  },

  // --- 🎭 角色管理模块 ---
  Role: {
    GetList: 'GET:/api/identity/Roles',
    GetPage: 'GET:/api/identity/Roles/page',
    Add: 'POST:/api/identity/Roles',
    Edit: 'PUT:/api/identity/Roles/{id}',
    Delete: 'DELETE:/api/identity/Roles/{id}',
    GetMenus: 'GET:/api/identity/Roles/{id:guid}/menus',
    AssignMenu: 'POST:/api/identity/Roles/{id:guid}/menus',
    GetApis: 'GET:/api/identity/Roles/{id:guid}/apis',
    AssignApi: 'POST:/api/identity/Roles/{id:guid}/apis',
  },

  // --- 📂 菜单管理模块 ---
  Menu: {
    GetTree: 'GET:/api/identity/Menus/tree',
    Add: 'POST:/api/identity/Menus',
    Edit: 'PUT:/api/identity/Menus/{id}',
    Delete: 'DELETE:/api/identity/Menus/{id}',
  },

  // --- 🔌 接口资源管理模块 ---
  ApiResource: {
    GetList: 'GET:/api/identity/ApiResources',
    GetTree: 'GET:/api/identity/ApiResources/tree',
    GetPage: 'GET:/api/identity/ApiResources/page',
    Add: 'POST:/api/identity/ApiResources',
    Edit: 'PUT:/api/identity/ApiResources/{id}',
    Delete: 'DELETE:/api/identity/ApiResources/{id}',
    Sync: 'POST:/api/identity/ApiResources/sync',
    Report: 'POST:/api/identity/ApiResources/report',
  },

  // --- 🔑 认证与基础鉴权模块 (通常不需要绑在按钮上，预留备用) ---
  Auth: {
    Login: 'POST:/api/identity/Auth/login',
    TestAuth: 'GET:/api/identity/Auth/test-auth',
    MyMenus: 'GET:/api/identity/Auth/my-menus',
    MyPermissions: 'GET:/api/identity/Auth/my-permissions',
  },

  // --- 📝 博客文章管理模块 (Blog 微服务) ---
  Article: {
    GetPage: 'GET:/api/blog/article/page',
    Add: 'POST:/api/blog/article',
    Edit: 'PUT:/api/blog/article/{id}',
    Delete: 'DELETE:/api/blog/article/{id}',
    UpdateStatus: 'PUT:/api/blog/article/{id}/status',
  },
  Category: {
    GetTree: 'GET:/api/blog/category/tree',
    GetOptions: 'GET:/api/blog/category/options',
    Add: 'POST:/api/blog/category',
    Edit: 'PUT:/api/blog/category/{id}',
    Delete: 'DELETE:/api/blog/category/{id}',
  },

  // --- 🏷️ 标签管理模块 ---
  Tag: {
    GetPage: 'GET:/api/blog/tag/page',
    Add: 'POST:/api/blog/tag',
    Edit: 'PUT:/api/blog/tag/{id}',
    Delete: 'DELETE:/api/blog/tag/{id}',
  },

  // --- 💬 评论审核模块 ---
  Comment: {
    GetPage: 'GET:/api/blog/comment/page',
    Audit: 'PUT:/api/blog/comment/{id}/audit',
    Delete: 'DELETE:/api/blog/comment/{id}',
  },

  // --- 🖼️ 媒体文件管理模块 (File 微服务) ---
  Media: {
    Upload: 'POST:/api/file/upload-image',
    GetPage: 'GET:/api/file/list',
    Delete: 'DELETE:/api/file/{id}',
  },

  // --- 🧭 站点导航模块 (Portal 前台用) ---
  SiteNavigation: {
    GetPublic: 'GET:/api/blog/sitenavigations',
  },

  // --- 🔗 友链管理 ---
  FriendLink: {
    GetAdminPage: 'GET:/api/blog/friendlink/admin/page',
    Add: 'POST:/api/blog/friendlink',
    Edit: 'PUT:/api/blog/friendlink/{id}',
    Delete: 'DELETE:/api/blog/friendlink/{id}',
    Audit: 'PUT:/api/blog/friendlink/{id}/audit',
    Top: 'PUT:/api/blog/friendlink/{id}/top',
  },

  // --- 📝 留言管理 ---
  Message: {
    GetAdminPage: 'GET:/api/blog/message/admin',
    Audit: 'PUT:/api/blog/message/{id}/audit',
    Delete: 'DELETE:/api/blog/message/{id}',
  },

  // --- 📊 动态管理 ---
  Record: {
    GetAdminPage: 'GET:/api/blog/record/admin/page',
    Add: 'POST:/api/blog/record',
    Edit: 'PUT:/api/blog/record/{id}',
    Delete: 'DELETE:/api/blog/record/{id}',
  },

  // --- ⚙️ Consul 配置中心 ---
  ConsulConfig: {
    Get: 'GET:/api/consul/config',
    GetByPrefix: 'GET:/api/consul/config/prefix',
    GetForService: 'GET:/api/consul/config/service/{name}',
    GetRaw: 'GET:/api/consul/config/raw',
    Add: 'POST:/api/consul/config',
    Edit: 'PUT:/api/consul/config',
    Delete: 'DELETE:/api/consul/config',
    BatchDelete: 'POST:/api/consul/config/batch-delete',
  },
  ConsulConfigGroup: {
    GetList: 'GET:/api/consul/configgroup',
    GetDetail: 'GET:/api/consul/configgroup/{name}',
    Add: 'POST:/api/consul/configgroup',
    Edit: 'PUT:/api/consul/configgroup/{name}',
    Delete: 'DELETE:/api/consul/configgroup/{name}',
  },
  ConsulEnvironment: {
    GetList: 'GET:/api/consul/environment',
  },
};