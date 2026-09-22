import { createRouter, createWebHistory } from 'vue-router'
// import KissingCirclesHomeView from '../views/KissingCirclesHomeView.vue'
import TransformImageIntoCirclesHomeView from '@/views/TransformImageIntoCirclesHomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: TransformImageIntoCirclesHomeView
    },
    // {
    //   path: '/',
    //   name: 'home',
    //   component: KissingCirclesHomeView
    // },
  ]
})

export default router
