<template>
  <v-empty-state
    v-if="notFound"
    headline="啊噢，这里啥都没有…"
    :image="favicon"
    text="您所寻找的页面不存在"
    title="页面未找到"
  />
  <div v-else>
    <v-sheet :class="appTheme.current.value.dark ? 'bg-grey-darken-4' : 'bg-grey-lighten-3'">
      <v-container class="pt-12 pb-12 mb-4">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1>{{ groupInfo.group.name }}</h1>
            <p>{{ groupInfo.userGroup.expire.toLocaleString() }} 过期</p>
          </div>
          <div v-if="groupInfo.userGroup.admin">
            <v-btn
              class="mr-4"
              @click="switchEditorMode"
            >
              {{ editorMode ? '退出编辑' : '编辑' }}
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
                :variant="currentSheet === 'subscribes' ? 'tonal' : 'flat'"
                @click="showSheet('subscribes')"
              />
              <v-list-item
                link
                title="共享账号"
                :variant="currentSheet === 'share' ? 'tonal' : 'flat'"
                @click="showSheet('share')"
              />
              <v-list-item
                v-if="groupInfo.userGroup.admin && editorMode"
                link
                title="用户"
                :variant="currentSheet === 'user' ? 'tonal' : 'flat'"
                @click="showSheet('user')"
              />
            </v-list>
          </v-card>
        </v-col>

        <v-col>
          <v-sheet
            min-height="70vh"
            rounded="lg"
          >
            <transition
              mode="out-in"
              name="fade"
            >
              <v-container v-if="currentSheet === 'subscribes'">
                <v-btn
                  v-if="editorMode"
                  class="mb-4"
                  block
                  @click="createSubscribe"
                >
                  添加
                </v-btn>

                <div v-if="groupSubscribesInfo.subscribes.length > 0">
                  <div v-if="editorMode">
                    <SubscribeEditor
                      v-for="res in groupSubscribesInfo.subscribes"
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
                    <Subscribe
                      v-for="res in groupSubscribesInfo.subscribes"
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
                </div>
                <div v-else>
                  <v-alert type="warning">
                    暂无订阅内容
                  </v-alert>
                </div>
                <v-pagination
                  v-model="groupSubscribesInfo.pages"
                  :length="Math.ceil(groupSubscribesInfo.count / 5)"
                  :total-visible="paginationTotalVisible"
                />
              </v-container>
              <v-container v-else-if="currentSheet === 'share'">
                <v-btn
                  v-if="editorMode"
                  class="mb-4"
                  block
                  @click="createShare"
                >
                  添加
                </v-btn>
                <div v-if="groupShareInfo.share.length > 0">
                  <div v-if="editorMode">
                    <ShareEditor
                      v-for="res in groupShareInfo.share"
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
                    <Share
                      v-for="res in groupShareInfo.share"
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
                </div>
                <div v-else>
                  <v-alert type="warning">
                    暂无共享账号
                  </v-alert>
                </div>
                <v-pagination
                  v-model="groupShareInfo.pages"
                  :length="Math.ceil(groupShareInfo.count / 5)"
                  :total-visible="paginationTotalVisible"
                />
              </v-container>
              <v-container v-else-if="currentSheet === 'user'">
                <v-card>
                  <UserEditor />
                </v-card>
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

/** 分组信息 */
interface GroupInfo {
  gid: string
  group: Groups
  userGroup: UserGroups
}

/** 分组订阅信息 */
interface GroupSubscribesInfo {
  subscribes: GroupSubscribes[]
  count: number
  pages: number
}

/** 分组共享账号信息 */
interface GroupShareInfo {
  share: GroupShare[]
  count: number
  pages: number
}

const route = useRoute()
const appTheme = useTheme()
const { name } = useDisplay()
const notifyerStore = useNotifyerStore()
const groupInfo: Ref<GroupInfo> = ref({
  gid: route.query.gid?.toString() || "",
  group: { gid: "", name: "", create_date: new Date() },
  userGroup: { ugid: "", uid: "", gid: "", expire: new Date(), admin: false }
})
const groupSubscribesInfo: Ref<GroupSubscribesInfo> = ref({
  subscribes: [],
  count: 0,
  pages: 1
})
const groupShareInfo: Ref<GroupShareInfo> = ref({
  share: [],
  count: 0,
  pages: 1
})
/** 分组未找到？ */
const notFound: Ref<boolean> = ref(false)
/** 编辑模式 */
const editorMode: Ref<boolean> = ref(false)
/** 当前页面 */
const currentSheet: Ref<"subscribes" | "share" | "user"> = ref("subscribes")
/** 动态分页数量 */
const paginationTotalVisible = computed(() => {
  switch (name.value) {
    case 'xs': return 1
    default: return 7
  }
})

/**
 * 切换页面
 * @param sheet 页面
 */
function showSheet(sheet: "subscribes" | "share" | "user") {
  currentSheet.value = sheet
}

/**
 * 获取订阅
 */
async function fetchSubscribes() {
  try {
    const response = await axios.get<ReturnResult<GroupSubscribes>>(`/api/v2/group/subscribes?where_gid=${groupInfo.value.gid}&offset=${((groupSubscribesInfo.value.pages - 1) * 5)}`)
    if (response.data.status === 200) {
      groupSubscribesInfo.value.subscribes = response.data.result
      groupSubscribesInfo.value.count = response.data.count
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
    const response = await axios.get<ReturnResult<GroupShare>>(`/api/v2/group/share?where_gid=${groupInfo.value.gid}&offset=${((groupShareInfo.value.pages - 1) * 5)}`)
    if (response.data.status === 200) {
      groupShareInfo.value.share = response.data.result.map(share => ({
        ...share,
        create_date: new Date(share.create_date)
      }))
      groupShareInfo.value.count = response.data.count
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

/**
 * 创建新订阅
 */
async function createSubscribe() {
  const data = [{
    order: 255,
    name: "新订阅",
    url: "https://",
    converter: true
  }]

  await axios.post<ReturnMessage>(`/api/v2/admin/group/subscribes?where_gid=${groupInfo.value.gid}`, data)
    .then(response => {
      notifyerStore.message = response.data.message
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `创建订阅时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "创建订阅时发生错误。详情请查看开发者日志。"
        console.error(error)
      }
    })
  notifyerStore.open = true

  await fetchSubscribes()
}

/**
 * 创建新共享账号
 */
async function createShare() {
  const data = [{
    name: "新共享账号",
    account: "",
    password: "",
    manage: "",
    aff: ""
  }]

  await axios.post<ReturnMessage>(`/api/v2/admin/group/share?where_gid=${groupInfo.value.gid}`, data)
    .then(response => {
      notifyerStore.message = response.data.message
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `创建共享账号时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "创建共享账号时发生错误。详情请查看开发者日志。"
        console.error(error)
      }
    })
  notifyerStore.open = true

  await fetchShare()
}

/**
 * 切换编辑模式
 */
async function switchEditorMode() {
  await fetchSubscribes()
  await fetchShare()
  if (editorMode.value && currentSheet.value === 'user') {
    showSheet('subscribes')
  }
  editorMode.value = !editorMode.value
}

/** 监听订阅页面翻页 */
watch(() => groupSubscribesInfo.value.pages, (newPage, oldPage) => {
  if (newPage !== oldPage) {
    fetchSubscribes()
  }
})

/** 监听共享账号页面翻页 */
watch(() => groupShareInfo.value.pages, (newPage, oldPage) => {
  if (newPage !== oldPage) {
    fetchShare()
  }
})

/** 初始化基础信息 */
try {
  const respGroup = await axios.get<ReturnResult<Groups>>(`/api/v2/group?where_gid=${groupInfo.value.gid}`)
  const respUserGroup = await axios.get<ReturnResult<UserGroups>>(`/api/v2/user/groups?where_gid=${groupInfo.value.gid}`)

  if (respGroup.data.status === 200) {
    groupInfo.value.group = respGroup.data.result[0]
  }

  if (respUserGroup.data.status === 200) {
    groupInfo.value.userGroup = respUserGroup.data.result.map(userGroup => ({
      ...userGroup,
      expire: new Date(userGroup.expire)
    }))[0]
  }
} catch (error) {
  const axiosError = error as AxiosError<ReturnMessage>
  notFound.value = true
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
</script>