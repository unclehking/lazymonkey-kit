import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/text-processing',
    name: 'TextProcessing',
    component: () => import('../views/TextProcessing.vue')
  },
  {
    path: '/image-convert',
    name: 'ImageConvert',
    component: () => import('../views/ImageConvert.vue')
  },
  {
    path: '/base64-convert',
    name: 'Base64Convert',
    component: () => import('../views/Base64Convert.vue')
  },
  {
    path: '/faq',
    name: 'FAQ',
    component: () => import('../views/FAQ.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 