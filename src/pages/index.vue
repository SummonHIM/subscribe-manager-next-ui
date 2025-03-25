<template>
  <v-sheet :theme="appTheme.current.value.dark ? '' : 'sheet'">
    <v-container class="pt-12 pb-12 mb-4">
      <h1>欢迎回来，{{ appStore.userName }}！</h1>
      <p>您当前已加入如下分组：</p>
    </v-container>
  </v-sheet>
  <v-container>
    <v-row>
      <v-col
        v-for="res in groups.result"
        :key="res.ugid"
        cols="0"
        sm="6"
      >
        <v-card
          :key="res.ugid"
          rel="noopener"
          class="mx-auto mb-4"
          :disabled="isExpired(res.expire, res.admin)"
          :title="groups.resultNames.get(res.gid) || '载入中…'"
          :to="'group?gid=' + res.gid"
        >
          <v-container>
            过期日：
            <span :class="{ 'text-red': isExpired(res.expire) }">
              {{ res.expire.toLocaleString() }}
            </span>
          </v-container>
        </v-card>
      </v-col>
    </v-row>

    <v-pagination
      v-model="groups.pages"
      :length="Math.ceil(groups.count / 10)"
      :total-visible="paginationTotalVisible"
    />
  </v-container>
</template>

<script lang="ts" setup>
import axios, { AxiosError } from 'axios'
import { useDisplay, useTheme } from 'vuetify'
import { useAppStore } from '@/stores/app'
import { useNotifyerStore } from '@/stores/notifyer'
import type { Groups, ReturnMessage, ReturnResult, UserGroups } from '@/interfaces'

interface IndexData {
  result: UserGroups[]
  resultNames: Map<string, string>
  count: number
  pages: number
}

const appTheme = useTheme()
const { name } = useDisplay()
const appStore = useAppStore()
const notifyerStore = useNotifyerStore()
/** 分组信息 */
const groups: Ref<IndexData> = ref({
  result: [],
  resultNames: new Map(),
  count: 0,
  pages: 1,
})
/** 分页信息 */
const paginationTotalVisible = computed(() => {
  switch (name.value) {
    case 'xs': return 1
    default: return 7
  }
})

/**
 * 检查是否已经过期
 * @param expire 过期日
 * @param admin 是否是管理员
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

/**
 * 获取分组名称
 * @param gid 分组 ID
 */
async function getGroupName(gid: UserGroups["gid"]): Promise<string> {
  try {
    const response = await axios.get<ReturnResult<Groups>>(`/api/v2/group?where_gid=${gid}`)
    const data = response.data

    if (data.status === 200) {
      return data.result[0].name
    }
  } catch (error) {
    const axiosError = error as AxiosError<ReturnMessage>
    if (axiosError.response && axiosError.response.data.message) {
      notifyerStore.message = `获取分组名称时发生错误。${axiosError.response.data.message}`
    } else {
      notifyerStore.message = "获取分组名称时发生错误。详情请查看开发者日志。"
      console.error(error)
    }
    notifyerStore.open = true
  }

  return "获取失败…"
}

/**
 * 获取用户分组
 */
async function fetchUserGroups() {
  try {
    const response = await axios.get<ReturnResult<UserGroups>>(`/api/v2/user/groups?offset=${((groups.value.pages - 1) * 10)}`)
    const data = response.data

    if (data.status === 200) {
      groups.value.result = data.result.map(group => ({
        ...group,
        expire: new Date(group.expire)
      }))

      groups.value.count = data.count
    }
  } catch (error) {
    const axiosError = error as AxiosError<ReturnMessage>
    if (axiosError.response && axiosError.response.data.message) {
      notifyerStore.message = `获取用户分组时发生错误。${axiosError.response.data.message}`
    } else {
      notifyerStore.message = "获取用户分组时发生错误。详情请查看开发者日志。"
      console.error(error)
    }
    notifyerStore.open = true
  }

  groups.value.result.forEach(async res => {
    const name = await getGroupName(res.gid)
    groups.value.resultNames.set(res.gid, name)
  })
}

await fetchUserGroups()

/** 监听翻页 */
watch(() => groups.value.pages, (newPage, oldPage) => {
  if (newPage !== oldPage) {
    fetchUserGroups()
  }
})

onMounted(() => {
  document.title = 'Subscribe Manager Next'
})
</script>
