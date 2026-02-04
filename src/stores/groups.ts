import { type Ref, ref } from 'vue'

import axios from 'axios'
import { defineStore } from 'pinia'

import { parseAPIError } from '@/exceptions'
import type { APIBasicList, APIGroup } from '@/interfaces'

export const useAPIGroupStore = defineStore('api_group', () => {
  const group: Ref<APIGroup[]> = ref([])
  const count: Ref<number> = ref(0)
  const errorMsg: Ref<string | null> = ref(null)

  /**
   * 从API中获取分组
   * @param limit 上限
   * @param offset 偏移
   */
  async function fetchGroups(limit: number = 10, offset: number = 0) {
    try {
      const response = await axios.get<APIBasicList<APIGroup>>(
        `/api/v3/groups/?limit=${limit}&offset=${offset}`,
      )
      group.value = response.data.results
      count.value = response.data.count
      errorMsg.value = null
    } catch (error) {
      const { messages } = parseAPIError<APIGroup>(error)
      errorMsg.value = messages.join('，')
      console.error(error)
    }
  }

  /**
   * 根据ID获取分组
   * @param id ID
   * @returns 分组
   */
  function getGroupById(id: number): APIGroup | null {
    return group.value.find((g) => g.id === id) ?? null
  }

  /**
   * 检查用户是否准许进入
   * @param expire 过期日
   * @param admin 是否为管理员
   * @returns 是否可以进入
   */
  function isExpired(expire: Date | string, admin: boolean = false): boolean {
    if (admin) return false
    const now = new Date()
    if (expire instanceof Date) {
      return now.getTime() > expire.getTime()
    } else {
      return now.getTime() > new Date(expire).getTime()
    }
  }

  return {
    group,
    count,
    errorMsg,
    fetchGroups,
    getGroupById,
    isExpired,
  }
})
