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
    path: '/generate-qrcode',
    name: 'GenerateQrcode',
    component: () => import('../views/GenerateQrcode.vue')
  },
  {
    path: '/de-qrcode',
    name: 'DeQrcode',
    component: () => import('../views/DeQrcode.vue')
  },
  {
    path: '/color-img',
    name: 'ColorImg',
    component: () => import('../views/colorImg.vue')
  },
  {
    path: '/json-format',
    name: 'JsonFormat',
    component: () => import('../views/JsonFormat.vue')
  },
  {
    path: '/url-encode',
    name: 'UrlEncode',
    component: () => import('../views/UrlEncode.vue')
  },
  {
    path: '/password-generator',
    name: 'PasswordGenerator',
    component: () => import('../views/PasswordGenerator.vue')
  },
  {
    path: '/timestamp-convert',
    name: 'TimestampConvert',
    component: () => import('../views/TimestampConvert.vue')
  },
  {
    path: '/color-picker',
    name: 'ColorPicker',
    component: () => import('../views/ColorPicker.vue')
  },
  {
    path: '/doodle-board',
    name: 'DoodleBoard',
    component: () => import('../views/DoodleBoard.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router