// stores/user.ts
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as null | { username: string } // sửa theo model người dùng thực tế
  }),
  actions: {
    login(userData: { username: string }) {
      this.user = userData
    },
    logout() {
      this.user = null
    }
  }
})
