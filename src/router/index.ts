import { createRouter, createWebHistory } from 'vue-router'

import NProgress from 'nprogress'
import routes from '~pages'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  if (to.meta.progress !== false) {
    NProgress.start()
  }
})

router.beforeResolve(() => {
  NProgress.done()
})

router.onError(() => {
  NProgress.done()
})

export default router
