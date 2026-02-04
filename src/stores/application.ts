import { type Ref, ref } from 'vue'

import axios from 'axios'
import { defineStore } from 'pinia'

import { parseAPIError } from '@/exceptions'
import type { APICsrf, APIUser } from '@/interfaces'

/** 主应用储存 */
export const useApplicationStore = defineStore('application', () => {
  const user: Ref<APIUser | null> = ref(null)
  const loginStat: Ref<boolean> = ref(false)
  const errorMsg: Ref<string | null> = ref(null)
  const csrfToken: Ref<string> = ref('')

  /** 重置 */
  function $reset() {
    user.value = null
    loginStat.value = false
  }

  /**
   * 获取当前用户信息
   * @returns 用户信息
   */
  async function fetchUser() {
    try {
      const response = await axios.get<APIUser>('/api/v3/user/')
      user.value = response.data
      loginStat.value = true
      errorMsg.value = null
    } catch (error) {
      $reset()

      // 先检查是否是 403，需要跳转认证
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        window.location.href = '/oidc/authenticate/'
        return
      }

      const { messages } = parseAPIError<APIUser>(error)
      if (messages.length) {
        // 取第一条作为 errorMsg
        errorMsg.value = messages.join('，')
      } else {
        errorMsg.value = '未知错误。'
      }

      console.error(error)
    }
  }

  /** 登出用户 */
  async function logoutUser() {
    try {
      const response = await axios.post(
        '/oidc/logout/',
        {},
        { headers: { 'X-CSRFToken': csrfToken.value } },
      )
      // 如果后端返回跳转 URL
      const redirectUrl = response.data.redirect || '/'
      $reset()
      window.location.href = redirectUrl
    } catch (error) {
      console.error(error)
      $reset()
      window.location.href = '/'
    }
  }

  /** 获取跨域令牌 */
  async function fetchCsrfToken() {
    try {
      const response = await axios.get<APICsrf>('/api/v3/csrf/')
      csrfToken.value = response.data.csrf_token
    } catch (error) {
      const { messages } = parseAPIError<APICsrf>(error)

      if (messages.length) {
        errorMsg.value = messages.join('，')
      } else {
        errorMsg.value = '获取防跨站请求伪造令牌时发生错误。'
      }

      console.error(error)
    }
  }

  return {
    user,
    loginStat,
    csrfToken,
    errorMsg,
    fetchUser,
    logoutUser,
    fetchCsrfToken,
  }
})
