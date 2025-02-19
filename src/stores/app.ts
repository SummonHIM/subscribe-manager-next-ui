// Utilities
import { defineStore } from 'pinia'
import axios, { AxiosError } from 'axios'
import type { ReturnResult, Users } from '@/interfaces'

/**
 * 用户信息（全局 APP）存储
 */
export const useAppStore = defineStore('app', {
  state: () => ({
    loggedIn: false,
    uid: "",
    userName: "",
    root: false,
  }),

  actions: {
    // 拉取用户信息
    async fetchUserInfo() {
      try {
        // 使用 session cookie 向后端请求用户信息
        const response = await axios.get<ReturnResult<Users>>("/api/v2/user")
        const data = response.data

        if (data.result.length > 0) {
          const user = data.result[0]

          // 更新 Store 中的用户信息
          this.uid = user.uid
          this.userName = user.username
          this.root = user.root
          this.loggedIn = true
        } else {
          console.error('获取用户信息失败：', data.message)
          this.loggedIn = false
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          if (error.response?.data.code === "Permission.Session.Incomplete")
            window.location.href = "/api/v2/auth/login"
        } else {
          console.error('获取用户信息失败：', error)
        }

        this.loggedIn = false
      }
    },

    // 登出
    async logout() {
      try {
        // 清空状态
        this.$reset()
        // 重定向到登出页面
        window.location.href = "/api/v2/auth/logout"
      } catch (error) {
        console.error('登出时发生错误：', error)
      }
    },
  },
  persist: true
})
