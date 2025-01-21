import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Index',
    component: () => import('../views/Index.vue')
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
    path: '/base64-to-img',
    name: 'Base64ToImg',
    component: () => import('../views/Base64ToImg.vue')
  },
  {
    path: '/faq',
    name: 'FAQ',
    component: () => import('../views/FAQ.vue')
  },
  {
    path: '/image-compress',
    name: 'ImageCompress',
    component: () => import('../views/imageCompress.vue')
  },
  {
    path: '/image-cut',
    name: 'ImageCut',
    component: () => import('../views/imageCut.vue')
  },
  {
    path: '/generate-qrcode',
    name: 'GenerateQrcode',
    component: () => import('../views/GenerateQrcode.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 