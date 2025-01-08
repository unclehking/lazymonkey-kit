import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    serviceCount: 8970838
  }),
  actions: {
    updateServiceCount(count) {
      this.serviceCount = count
    }
  }
}) 