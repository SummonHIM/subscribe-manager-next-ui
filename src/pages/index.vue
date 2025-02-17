<template>
  <v-sheet :class="appTheme.current.value.dark ? 'bg-grey-darken-4' : 'bg-grey-lighten-3'">
    <v-container class="pt-12 pb-12 mb-4">
      <h1>欢迎回来，{{ appStore.userName }}！</h1>
      <p>您当前已加入如下分组：</p>
    </v-container>
  </v-sheet>
  <v-container>
    <v-row>
      <v-col
        v-for="res in result"
        :key="res.ugid"
        cols="0"
        sm="6"
      >
        <v-card
          :key="res.ugid"
          rel="noopener"
          class="mx-auto mb-4"
          :disabled="isExpired(res.expire, res.admin)"
          :title="groupNames.get(res.gid) || '载入中…'"
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
      v-model="pages"
      :length="Math.ceil(count / 10)"
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

const appTheme = useTheme()
const { name } = useDisplay()
const appStore = useAppStore()
const notifyerStore = useNotifyerStore()
const result: Ref<UserGroups[]> = ref([])
const count: Ref<number> = ref(0)
const pages: Ref<number> = ref(1)
const groupNames = ref<Map<string, string>>(new Map())
const paginationTotalVisible = computed(() => {
  switch (name.value) {
    case 'xs': return 1
    default: return 7
  }
})

function isExpired(expire: Date, admin: boolean = false): boolean {
  if (admin) return false
  const now = new Date()
  return now.getTime() > expire.getTime()
}

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

async function fetchUserGroups() {
  try {
    const response = await axios.get<ReturnResult<UserGroups>>(`/api/v2/user/groups?offset=${((pages.value - 1) * 10)}`)
    const data = response.data

    if (data.status === 200) {
      result.value = data.result.map(group => ({
        ...group,
        expire: new Date(group.expire)
      }))

      count.value = data.count
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

  result.value.forEach(async res => {
    const name = await getGroupName(res.gid)
    groupNames.value.set(res.gid, name)
  })
}

await fetchUserGroups()


watch(pages, (newPage, oldPage) => {
  if (newPage !== oldPage) {
    fetchUserGroups()
  }
})
</script>
