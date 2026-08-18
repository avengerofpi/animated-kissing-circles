import { createRouter, createWebHistory } from 'vue-router'
// import KissingCirclesHomeView from '../views/KissingCirclesHomeView.vue'
import EncircleAPictureHomeView from '@/views/EncircleAPictureHomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: EncircleAPictureHomeView
    },
    // {
    //   path: '/',
    //   name: 'home',
    //   component: KissingCirclesHomeView
    // },
  ]
})

export default router
