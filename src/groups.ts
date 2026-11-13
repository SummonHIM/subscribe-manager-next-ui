import type { Ref } from 'vue'

import axios from 'axios'
import type { ToastServiceMethods } from 'primevue/toastservice'

import { parseAPIError } from '@/exceptions'
import type {
  APIBasicList,
  APIConverterOptions,
  APIGroup,
  APIGroupShares,
  APIGroupSharesEdit,
  APIGroupSubscribes,
  APIGroupSubscribesEdit,
  APIGroupSubscribesUsage,
  APIGroupUsers,
  APIGroupUsersEdit,
} from '@/interfaces'
import { useApplicationStore } from '@/stores/application'

interface ReOrder {
  id: number
  order: number
}

let locked = false
const waitQueue: (() => void)[] = []

/**
 * 获取当前锁状态
 * @returns 锁状态
 */
function acquireLock(): Promise<void> {
  return new Promise((resolve) => {
    if (!locked) {
      locked = true
      resolve()
    } else {
      waitQueue.push(resolve)
    }
  })
}

/**
 * 释放锁
 */
function releaseLock() {
  if (waitQueue.length > 0) {
    const next = waitQueue.shift()
    next?.()
  } else {
    locked = false
  }
}

/**
 * 交换列表中某下标的位置
 * @param arr 列表地址
 * @param from 交换的下标
 * @param to 交换到的下标
 * @returns 交换后的列表
 */
export function moveByIndex<T>(arr: T[], from: number, to: number): T[] {
  if (from === to) return [...arr]

  const newArr = [...arr]

  // 安全取值
  const item = newArr.splice(from, 1)[0]
  if (item === undefined) return newArr

  // 插入到目标索引
  newArr.splice(to, 0, item)

  return newArr
}

/**
 * 获取分组信息
 * @param id 分组ID
 * @param errorMsg 错误信息对象
 * @returns 分组信息
 */
export async function fetchGroup(id: number, errorMsg: Ref<string | null>) {
  try {
    const response = await axios.get<APIGroup>(`/api/v3/groups/${id}/`)
    errorMsg.value = null
    return response.data
  } catch (error) {
    const { messages } = parseAPIError<APIGroup>(error)
    if (messages.length) {
      errorMsg.value = messages.join('，')
    } else {
      errorMsg.value = '获取分组信息时发生未知错误。'
    }
    console.error(error)
    return {
      id: -1,
      name: `未知组`,
      subscribes: [],
      shares: [],
      myself: { admin: false, expire: new Date().toISOString() },
    }
  }
}

/**
 * 修改分组名称
 * @param id 分组ID
 * @param name 新名称
 * @param toast PrimeVue 消息对象
 */
export async function changeGroupName(
  id: number,
  name: string,
  toast: ToastServiceMethods,
): Promise<boolean> {
  try {
    const applicationStore = useApplicationStore()
    await axios.put(
      `/api/v3/groups/${id}/rename/`,
      { name: name },
      { headers: { 'X-CSRFToken': applicationStore.csrfToken } },
    )
    toast.add({
      severity: 'success',
      summary: '保存成功',
      life: 5000,
    })
    return true
  } catch (error) {
    const { messages } = parseAPIError<APIGroup>(error)
    if (messages.length) {
      messages.forEach((msg) =>
        toast.add({
          severity: 'error',
          summary: '保存时发生错误',
          detail: msg,
          life: 5000,
        }),
      )
    } else {
      toast.add({
        severity: 'error',
        summary: '保存时发生错误',
        life: 5000,
      })
    }

    console.error(error)
    return false
  }
}

/**
 * 生成列表查询参数
 * @param limit 上限
 * @param offset 偏移
 * @param search 搜索词
 */
function listQuery(limit: number, offset: number, search: string = ''): string {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })

  if (search.trim()) params.set('search', search.trim())

  return params.toString()
}

/**
 * 获取分组订阅
 * @param groupID 分组ID
 * @param limit 上限
 * @param offset 偏移
 * @param toast PrimeVue 消息对象
 * @param search 搜索词
 * @returns 分组订阅信息
 */
export async function fetchGroupSubscribes(
  groupID: number,
  limit: number = 10,
  offset: number = 0,
  toast: ToastServiceMethods,
  search: string = '',
) {
  try {
    const response = await axios.get<APIBasicList<APIGroupSubscribes>>(
      `/api/v3/groups/${groupID}/subscribes/?${listQuery(limit, offset, search)}`,
    )
    return response.data
  } catch (error) {
    const { messages } = parseAPIError<APIGroupSubscribes>(error)
    if (messages.length) {
      messages.forEach((msg) =>
        toast.add({
          severity: 'error',
          summary: '获取分组订阅时发生错误',
          detail: msg,
          life: 5000,
        }),
      )
    } else {
      toast.add({
        severity: 'error',
        summary: '获取分组订阅时发生错误',
        life: 5000,
      })
    }
    console.error(error)
    return {
      count: 0,
      next: null,
      previous: null,
      results: [],
    }
  }
}

/**
 * 获取订阅用量信息
 * @returns 订阅用量信息
 */
export async function fetchGroupSubscribesUsage(
  groupID: number,
  subscribeID: number,
): Promise<APIGroupSubscribesUsage> {
  await acquireLock() // 等待锁

  try {
    const response = await axios.get<APIGroupSubscribesUsage>(
      `/api/v3/groups/${groupID}/subscribes/${subscribeID}/usage/`,
    )

    return response.data
  } catch (error) {
    console.warn("Failed to fetch subscribe's information", error)
    return {
      id: subscribeID,
      upload: null,
      download: null,
      total: null,
      expire: null,
    }
  } finally {
    // 解锁
    setTimeout(() => {
      releaseLock()
    }, 1000)
  }
}

/**
 * 创建新分组订阅
 * @param groupID 分组ID
 * @param newSubscribe 新订阅信息
 * @param toast PrimeVue 消息对象
 */
export async function createGroupSubscribe(
  groupID: number,
  newSubscribe: APIGroupSubscribesEdit,
  toast: ToastServiceMethods,
) {
  try {
    const applicationStore = useApplicationStore()
    await axios.post(`/api/v3/groups/${groupID}/subscribes/`, newSubscribe, {
      headers: { 'X-CSRFToken': applicationStore.csrfToken },
    })
    toast.add({
      severity: 'success',
      summary: '保存成功',
      life: 3000,
    })
  } catch (error) {
    const { messages } = parseAPIError<APIGroupSubscribesEdit>(error)

    if (messages.length) {
      messages.forEach((msg) =>
        toast.add({
          severity: 'error',
          summary: '新建分组订阅时发生错误',
          detail: msg,
          life: 5000,
        }),
      )
    } else {
      toast.add({
        severity: 'error',
        summary: '新建分组订阅时发生错误',
        life: 5000,
      })
    }

    console.error(error)
  }
}

/**
 * 修改分组订阅
 * @param groupID 分组ID
 * @param oldSubscribeID 订阅ID
 * @param newSubscribe 新订阅信息
 * @param toast PrimeVue 消息对象
 */
export async function modifyGroupSubscribe(
  groupID: number,
  oldSubscribeID: number,
  newSubscribe: APIGroupSubscribesEdit,
  toast: ToastServiceMethods,
) {
  try {
    const applicationStore = useApplicationStore()
    await axios.put(`/api/v3/groups/${groupID}/subscribes/${oldSubscribeID}/`, newSubscribe, {
      headers: { 'X-CSRFToken': applicationStore.csrfToken },
    })
    toast.add({
      severity: 'success',
      summary: '保存成功',
      life: 3000,
    })
  } catch (error) {
    const { messages } = parseAPIError<APIGroupSubscribesEdit>(error)

    if (messages.length) {
      messages.forEach((msg) =>
        toast.add({
          severity: 'error',
          summary: '修改分组订阅时发生错误',
          detail: msg,
          life: 5000,
        }),
      )
    } else {
      toast.add({
        severity: 'error',
        summary: '修改分组订阅时发生错误',
        life: 5000,
      })
    }

    console.error(error)
  }
}

/**
 * 修改分组订阅的转换选项
 * @param groupID 分组ID
 * @param subscribeID 订阅ID
 * @param newConverterOptions 新转换选项
 * @param toast PrimeVue 消息对象
 */
export async function modifyGroupSubscribeConverterOptions(
  groupID: number,
  subscribeID: number,
  newConverterOptions: APIConverterOptions,
  toast: ToastServiceMethods,
) {
  try {
    const applicationStore = useApplicationStore()
    await axios.put(
      `/api/v3/groups/${groupID}/subscribes/${subscribeID}/converter_options/`,
      newConverterOptions,
      {
        headers: { 'X-CSRFToken': applicationStore.csrfToken },
      },
    )
    toast.add({
      severity: 'success',
      summary: '保存成功',
      life: 3000,
    })
  } catch (error) {
    const { messages } = parseAPIError<APIConverterOptions>(error)

    if (messages.length) {
      messages.forEach((msg) =>
        toast.add({
          severity: 'error',
          summary: '修改分组订阅的转换选项时发生错误',
          detail: msg,
          life: 5000,
        }),
      )
    } else {
      toast.add({
        severity: 'error',
        summary: '修改分组订阅的转换选项时发生错误',
        life: 5000,
      })
    }

    console.error(error)
  }
}

/**
 * 删除分组订阅
 * @param groupID 分组ID
 * @param subscribeID 订阅ID
 * @param toast PrimeVue 消息对象
 */
export async function deleteGroupSubscribe(
  groupID: number,
  subscribeID: number,
  toast: ToastServiceMethods,
) {
  try {
    const applicationStore = useApplicationStore()
    await axios.delete(`/api/v3/groups/${groupID}/subscribes/${subscribeID}/`, {
      headers: { 'X-CSRFToken': applicationStore.csrfToken },
    })
    toast.add({
      severity: 'success',
      summary: '保存成功',
      life: 3000,
    })
  } catch (error) {
    const { messages } = parseAPIError<APIGroupSubscribes>(error)

    if (messages.length) {
      messages.forEach((msg) =>
        toast.add({
          severity: 'error',
          summary: '删除分组订阅时发生错误',
          detail: msg,
          life: 5000,
        }),
      )
    } else {
      // 兜底
      toast.add({
        severity: 'error',
        summary: '删除分组订阅时发生错误',
        life: 5000,
      })
    }

    console.error(error)
  }
}

/**
 * 重新排序分组订阅
 * @param groupID 分组ID
 * @param results 最终排序结果
 * @param first 分页位置（偏移）
 * @param toast PrimeVue 消息对象
 */
export async function reOrderSubscribes(
  groupID: number,
  results: APIGroupSubscribes[],
  first: number,
  toast: ToastServiceMethods,
) {
  try {
    const applicationStore = useApplicationStore()
    const newOrder: ReOrder[] = results.map((item, index) => ({
      id: item.id,
      order: index + 1 + first,
    }))
    const { data: successList } = await axios.patch<ReOrder[]>(
      `/api/v3/groups/${groupID}/subscribes/reorder/`,
      newOrder,
      {
        headers: { 'X-CSRFToken': applicationStore.csrfToken },
      },
    )

    const failedItems = newOrder.filter(
      (item) => !successList.some((success) => success.id === item.id),
    )

    if (failedItems.length > 0) {
      failedItems.forEach((item) => {
        toast.add({
          severity: 'error',
          summary: '分组订阅排序失败',
          detail: `ID ${item.id} 排序更新失败`,
          life: 5000,
        })
      })
    }
  } catch (error) {
    const { messages } = parseAPIError<ReOrder[]>(error)

    if (messages.length) {
      messages.forEach((msg) =>
        toast.add({
          severity: 'error',
          summary: '重新排序分组订阅时发生错误',
          detail: msg,
          life: 5000,
        }),
      )
    } else {
      toast.add({
        severity: 'error',
        summary: '重新排序分组订阅时发生错误',
        life: 5000,
      })
    }

    console.error(error)
  }
}

/**
 * 获取分组共享账号
 * @param groupID 分组ID
 * @param limit 上限
 * @param offset 偏移
 * @param toast PrimeVue 消息对象
 * @param search 搜索词
 * @returns 分组共享账号信息
 */
export async function fetchGroupShares(
  groupID: number,
  limit: number = 10,
  offset: number = 0,
  toast: ToastServiceMethods,
  search: string = '',
) {
  try {
    const response = await axios.get<APIBasicList<APIGroupShares>>(
      `/api/v3/groups/${groupID}/shares/?${listQuery(limit, offset, search)}`,
    )
    return response.data
  } catch (error) {
    const { messages } = parseAPIError<APIGroupShares>(error)

    if (messages.length) {
      messages.forEach((msg) =>
        toast.add({
          severity: 'error',
          summary: '获取分组共享账号时发生错误',
          detail: msg,
          life: 5000,
        }),
      )
    } else {
      toast.add({
        severity: 'error',
        summary: '获取分组共享账号时发生错误',
        life: 5000,
      })
    }

    console.error(error)

    return {
      count: 0,
      next: null,
      previous: null,
      results: [],
    }
  }
}

/**
 * 创建新分组共享账号
 * @param groupID 分组ID
 * @param newShare 新分组共享账号信息
 * @param toast PrimeVue 消息对象
 */
export async function createGroupShare(
  groupID: number,
  newShare: APIGroupSharesEdit,
  toast: ToastServiceMethods,
) {
  try {
    const applicationStore = useApplicationStore()
    await axios.post(`/api/v3/groups/${groupID}/shares/`, newShare, {
      headers: { 'X-CSRFToken': applicationStore.csrfToken },
    })
    toast.add({
      severity: 'success',
      summary: '保存成功',
      life: 3000,
    })
  } catch (error) {
    const { messages } = parseAPIError<APIGroupSharesEdit>(error)

    if (messages.length) {
      messages.forEach((msg) =>
        toast.add({
          severity: 'error',
          summary: '新建分组共享账号时发生错误',
          detail: msg,
          life: 5000,
        }),
      )
    } else {
      toast.add({
        severity: 'error',
        summary: '新建分组共享账号时发生错误',
        life: 5000,
      })
    }

    console.error(error)
  }
}

/**
 * 修改分组共享账号
 * @param groupID 分组ID
 * @param oldShareID 旧分组共享账号ID
 * @param newShare 新分组共享账号信息
 * @param toast PrimeVue 消息对象
 */
export async function modifyGroupShare(
  groupID: number,
  oldShareID: number,
  newShare: APIGroupSharesEdit,
  toast: ToastServiceMethods,
) {
  try {
    const applicationStore = useApplicationStore()
    await axios.put(`/api/v3/groups/${groupID}/shares/${oldShareID}/`, newShare, {
      headers: { 'X-CSRFToken': applicationStore.csrfToken },
    })
    toast.add({
      severity: 'success',
      summary: '保存成功',
      life: 3000,
    })
  } catch (error) {
    const { messages } = parseAPIError<APIGroupSharesEdit>(error)

    if (messages.length) {
      messages.forEach((msg) =>
        toast.add({
          severity: 'error',
          summary: '修改分组共享账号时发生错误',
          detail: msg,
          life: 5000,
        }),
      )
    } else {
      toast.add({
        severity: 'error',
        summary: '修改分组共享账号时发生错误',
        life: 5000,
      })
    }

    console.error(error)
  }
}

/**
 * 删除分组共享账号
 * @param groupID 分组ID
 * @param shareID 分组共享账号ID
 * @param toast PrimeVue 消息对象
 */
export async function deleteGroupShare(
  groupID: number,
  shareID: number,
  toast: ToastServiceMethods,
) {
  try {
    const applicationStore = useApplicationStore()
    await axios.delete(`/api/v3/groups/${groupID}/shares/${shareID}/`, {
      headers: { 'X-CSRFToken': applicationStore.csrfToken },
    })
    toast.add({
      severity: 'success',
      summary: '保存成功',
      life: 3000,
    })
  } catch (error) {
    const { messages } = parseAPIError<APIGroupShares>(error)

    if (messages.length) {
      messages.forEach((msg) =>
        toast.add({
          severity: 'error',
          summary: '删除分组共享账号时发生错误',
          detail: msg,
          life: 5000,
        }),
      )
    } else {
      // 兜底
      toast.add({
        severity: 'error',
        summary: '删除分组共享账号时发生错误',
        life: 5000,
      })
    }

    console.error(error)
  }
}

/**
 * 重新排序分组共享账号
 * @param groupID 分组ID
 * @param results 最终排序结果
 * @param first 分页位置（偏移）
 * @param toast PrimeVue 消息对象
 */
export async function reOrderShares(
  groupID: number,
  results: APIGroupShares[],
  first: number,
  toast: ToastServiceMethods,
) {
  try {
    const applicationStore = useApplicationStore()
    const newOrder: ReOrder[] = results.map((item, index) => ({
      id: item.id,
      order: index + 1 + first,
    }))
    const { data: successList } = await axios.patch<ReOrder[]>(
      `/api/v3/groups/${groupID}/shares/reorder/`,
      newOrder,
      {
        headers: { 'X-CSRFToken': applicationStore.csrfToken },
      },
    )

    const failedItems = newOrder.filter(
      (item) => !successList.some((success) => success.id === item.id),
    )

    if (failedItems.length > 0) {
      failedItems.forEach((item) => {
        toast.add({
          severity: 'error',
          summary: '分组共享账号排序失败',
          detail: `ID ${item.id} 排序更新失败`,
          life: 5000,
        })
      })
    }
  } catch (error) {
    const { messages } = parseAPIError<ReOrder[]>(error)

    if (messages.length) {
      messages.forEach((msg) =>
        toast.add({
          severity: 'error',
          summary: '重新排序分组共享账号时发生错误',
          detail: msg,
          life: 5000,
        }),
      )
    } else {
      toast.add({
        severity: 'error',
        summary: '重新排序分组共享账号时发生错误',
        life: 5000,
      })
    }

    console.error(error)
  }
}

/**
 * 获取分组用户信息
 * @param groupID 分组ID
 * @param limit 上限
 * @param offset 偏移
 * @param toast PrimeVue 消息对象
 * @param search 搜索词
 * @returns 分组用户信息
 */
export async function fetchGroupUsers(
  groupID: number,
  limit: number = 10,
  offset: number = 0,
  toast: ToastServiceMethods,
  search: string = '',
) {
  try {
    const response = await axios.get<APIBasicList<APIGroupUsers>>(
      `/api/v3/groups/${groupID}/users/?${listQuery(limit, offset, search)}`,
    )
    return response.data
  } catch (error) {
    const { messages } = parseAPIError<APIGroupUsers>(error)

    if (messages.length) {
      messages.forEach((msg) =>
        toast.add({
          severity: 'error',
          summary: '获取分组用户时发生错误',
          detail: msg,
          life: 5000,
        }),
      )
    } else {
      toast.add({
        severity: 'error',
        summary: '获取分组用户时发生错误',
        life: 5000,
      })
    }

    console.error(error)

    return {
      count: 0,
      next: null,
      previous: null,
      results: [],
    }
  }
}

/**
 * 修改分组用户
 * @param groupID 分组用户
 * @param groupUserID 分组用户ID
 * @param newGroupUser 新分组用户信息
 * @param toast PrimeVue 消息对象
 */
export async function modifyGroupUser(
  groupID: number,
  groupUserID: number,
  newGroupUser: APIGroupUsersEdit,
  toast: ToastServiceMethods,
) {
  try {
    const applicationStore = useApplicationStore()
    await axios.put(`/api/v3/groups/${groupID}/users/${groupUserID}/`, newGroupUser, {
      headers: { 'X-CSRFToken': applicationStore.csrfToken },
    })
    toast.add({
      severity: 'success',
      summary: '保存成功',
      life: 3000,
    })
  } catch (error) {
    const { messages } = parseAPIError<APIGroupUsersEdit>(error)

    if (messages.length) {
      messages.forEach((msg) =>
        toast.add({
          severity: 'error',
          summary: '修改分组用户时发生错误',
          detail: msg,
          life: 5000,
        }),
      )
    } else {
      // 兜底
      toast.add({
        severity: 'error',
        summary: '修改分组用户时发生错误',
        life: 5000,
      })
    }

    console.error(error)
  }
}

/**
 * 删除分组用户
 * @param groupID 分组用户
 * @param groupUserID 分组用户ID
 * @param toast PrimeVue 消息对象
 */
export async function deleteGroupUser(
  groupID: number,
  groupUserID: number,
  toast: ToastServiceMethods,
) {
  try {
    const applicationStore = useApplicationStore()
    await axios.delete(`/api/v3/groups/${groupID}/users/${groupUserID}/`, {
      headers: { 'X-CSRFToken': applicationStore.csrfToken },
    })
    toast.add({
      severity: 'success',
      summary: '保存成功',
      life: 3000,
    })
  } catch (error) {
    const { messages } = parseAPIError<APIGroupUsers>(error)

    if (messages.length) {
      messages.forEach((msg) =>
        toast.add({
          severity: 'error',
          summary: '删除分组用户时发生错误',
          detail: msg,
          life: 5000,
        }),
      )
    } else {
      toast.add({
        severity: 'error',
        summary: '删除分组用户时发生错误',
        life: 5000,
      })
    }

    console.error(error)
  }
}
