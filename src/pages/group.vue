<template>
  <v-empty-state
    v-if="page.notFound"
    headline="啊噢，这里啥都没有…"
    :image="favicon"
    text="您所寻找的页面不存在"
    title="页面未找到"
  />
  <div v-else>
    <v-sheet :theme="appTheme.current.value.dark ? '' : 'sheet'">
      <v-container class="pt-12 pb-12 mb-4">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1>{{ groupInfo.group.name }}</h1>
            <p>{{ groupInfo.userGroup.expire.toLocaleString() }} 过期</p>
          </div>
          <div v-if="groupInfo.userGroup.admin">
            <v-btn
              class="mr-4"
              :to="`/admin/group?gid=${groupInfo.gid}`"
            >
              编辑
            </v-btn>
          </div>
        </div>
      </v-container>
    </v-sheet>
    <v-container>
      <v-row>
        <v-col
          cols="0"
          md="2"
        >
          <v-card class="mt-4 position-sticky top-0">
            <v-list>
              <v-list-item
                link
                title="订阅"
                :variant="page.currentSheet === 'subscribes' ? 'tonal' : 'flat'"
                @click="page.currentSheet = 'subscribes'"
              />
              <v-list-item
                link
                title="共享账号"
                :variant="page.currentSheet === 'share' ? 'tonal' : 'flat'"
                @click="page.currentSheet = 'share'"
              />
            </v-list>
          </v-card>
        </v-col>

        <v-col>
          <v-sheet
            rounded="lg"
          >
            <transition
              mode="out-in"
              name="fade"
            >
              <v-container v-if="page.currentSheet === 'subscribes'">
                <div v-if="groupSubscribes.content.length > 0">
                  <Subscribe
                    v-for="res in groupSubscribes.content"
                    :key="res.sid"
                    :sid="res.sid"
                    :gid="res.gid"
                    :order="res.order"
                    :name="res.name"
                    :url="res.url"
                    :converter="res.converter"
                    :converter_options="res.converter_options"
                    class="mb-4"
                  />
                </div>
                <div v-else>
                  <v-alert type="warning">
                    暂无订阅内容
                  </v-alert>
                </div>
                <v-pagination
                  v-model="groupSubscribes.pages"
                  :length="Math.ceil(groupSubscribes.count / 5)"
                  :total-visible="paginationTotalVisible"
                />
              </v-container>
              <v-container v-else-if="page.currentSheet === 'share'">
                <div v-if="groupShare.content.length > 0">
                  <Share
                    v-for="res in groupShare.content"
                    :key="res.gsid"
                    :gsid="res.gsid"
                    :gid="res.gid"
                    :name="res.name"
                    :account="res.account"
                    :password="res.password"
                    :manage="res.manage"
                    :aff="res.aff"
                    :create_date="res.create_date"
                    class="mb-4"
                  />
                </div>
                <div v-else>
                  <v-alert type="warning">
                    暂无共享账号
                  </v-alert>
                </div>
                <v-pagination
                  v-model="groupShare.pages"
                  :length="Math.ceil(groupShare.count / 5)"
                  :total-visible="paginationTotalVisible"
                />
              </v-container>
            </transition>
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts" setup>
import axios, { AxiosError } from 'axios'
import { useDisplay, useTheme } from 'vuetify'

import favicon from '@/assets/favicon.png'
import { useNotifyerStore } from '@/stores/notifyer'
import type { Groups, GroupShare, GroupSubscribes, ReturnMessage, ReturnResult, UserGroups } from '@/interfaces'

/** 页面信息 */
interface Page{
  notFound: boolean
  currentSheet: 'subscribes' | 'share'
}

/** 分组信息 */
interface GroupInfo {
  gid: string
  group: Groups
  userGroup: UserGroups
}

/** 分组订阅信息 */
interface GroupContent<T> {
  content: T[]
  count: number
  pages: number
}

const route = useRoute()
const appTheme = useTheme()
const { name } = useDisplay()
const notifyerStore = useNotifyerStore()
/** 页面信息 */
const page: Ref<Page> = ref({
  notFound: true,
  currentSheet: "subscribes"
})
/** 分组信息 */
const groupInfo: Ref<GroupInfo> = ref({
  gid: route.query.gid?.toString() || "",
  group: { gid: "", name: "", create_date: new Date() },
  userGroup: { ugid: "", uid: "", gid: "", expire: new Date(), admin: false }
})
/** 分组订阅信息 */
const groupSubscribes: Ref<GroupContent<GroupSubscribes>> = ref({
  content: [],
  count: 0,
  pages: 1
})
/** 分组共享账号信息 */
const groupShare: Ref<GroupContent<GroupShare>> = ref({
  content: [],
  count: 0,
  pages: 1
})
/** 动态分页数量 */
const paginationTotalVisible = computed(() => {
  switch (name.value) {
    case 'xs': return 1
    default: return 7
  }
})

/**
 * 获取订阅
 */
async function fetchSubscribes() {
  try {
    const response = await axios.get<ReturnResult<GroupSubscribes>>(`/api/v2/group/subscribes?where_gid=${groupInfo.value.gid}&offset=${((groupSubscribes.value.pages - 1) * 5)}`)
    if (response.data.status === 200) {
      groupSubscribes.value.content = [ ...response.data.result ]
      groupSubscribes.value.count = response.data.count
    }
  } catch (error) {
    const axiosError = error as AxiosError<ReturnMessage>
    if (axiosError.response && axiosError.response.data.message) {
      notifyerStore.message = `获取订阅时发生错误。${axiosError.response.data.message}`
    } else {
      notifyerStore.message = "获取订阅时发生错误。详情请查看开发者日志。"
      console.error(error)
    }
    notifyerStore.open = true
  }
}

/**
 * 获取共享账号
 */
async function fetchShare() {
  try {
    const response = await axios.get<ReturnResult<GroupShare>>(`/api/v2/group/share?where_gid=${groupInfo.value.gid}&offset=${((groupShare.value.pages - 1) * 5)}`)
    if (response.data.status === 200) {
      groupShare.value.content = response.data.result.map(share => ({
        ...share,
        create_date: share.create_date ? new Date(share.create_date) : undefined
      }))
      groupShare.value.count = response.data.count
    }
  } catch (error) {
    const axiosError = error as AxiosError<ReturnMessage>
    if (axiosError.response && axiosError.response.data.message) {
      notifyerStore.message = `获取共享账号时发生错误。${axiosError.response.data.message}`
    } else {
      notifyerStore.message = "获取共享账号时发生错误。详情请查看开发者日志。"
      console.error(error)
    }
    notifyerStore.open = true
  }
}

/** 监听订阅页面翻页 */
watch(() => groupSubscribes.value.pages, (newPage, oldPage) => {
  if (newPage !== oldPage) {
    fetchSubscribes()
  }
})

/** 监听共享账号页面翻页 */
watch(() => groupShare.value.pages, (newPage, oldPage) => {
  if (newPage !== oldPage) {
    fetchShare()
  }
})

/** 初始化基础信息 */
try {
  const respGroup = await axios.get<ReturnResult<Groups>>(`/api/v2/group?where_gid=${groupInfo.value.gid}`)
  const respUserGroup = await axios.get<ReturnResult<UserGroups>>(`/api/v2/user/groups?where_gid=${groupInfo.value.gid}`)

  if (respGroup.data.status === 200) {
    groupInfo.value.group = { ...respGroup.data.result[0] }
  }

  if (respUserGroup.data.status === 200) {
    groupInfo.value.userGroup = respUserGroup.data.result.map(userGroup => ({
      ...userGroup,
      expire: new Date(userGroup.expire)
    }))[0]
  }

  page.value.notFound = false
} catch (error) {
  const axiosError = error as AxiosError<ReturnMessage>
  page.value.notFound = true
  if (axiosError.response && axiosError.response.data.message) {
    notifyerStore.message = `获取分组和用户分组时发生错误。${axiosError.response.data.message}`
  } else {
    notifyerStore.message = "获取分组和用户分组时发生错误。详情请查看开发者日志。"
    console.error(error)
  }
  notifyerStore.open = true
}

fetchSubscribes()
fetchShare()

onMounted(() => {
  document.title = `${groupInfo.value.group.name} - Subscribe Manager Next`
})
</script>
