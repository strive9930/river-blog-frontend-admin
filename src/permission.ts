import router from '@/router';
import { usePermissionStore } from '@/store/modules/permission';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

const whiteList = ['/login', '/404'];

router.beforeEach(async (to, from, next) => {
  NProgress.start();
  const token = localStorage.getItem('access_token');

  if (token) {
    if (to.path === '/login') {
      next({ path: '/' });
    } else {
      const permissionStore = usePermissionStore();
      if (!permissionStore.isDynamicRouteAdded) {
        try {
          await permissionStore.fetchMenuTree();
          next({ ...to, replace: true });
        } catch (error) {
          localStorage.removeItem('access_token');
          next(`/login?redirect=${to.path}`);
        }
      } else {
        next();
      }
    }
  } else {
    if (whiteList.includes(to.path)) {
      next();
    } else {
      next(`/login?redirect=${to.path}`);
    }
  }
});

router.afterEach(() => {
  NProgress.done();
});