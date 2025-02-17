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
            <h1>{{ group.name }}</h1>
            <p>{{ userGroup.expire.toLocaleString() }} 过期</p>
          </div>
          <div v-if="userGroup.admin">
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
                v-if="userGroup.admin && editorMode"
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

                <div v-if="subscribes.length > 0">
                  <div v-if="editorMode">
                    <SubscribeEditor
                      v-for="res in subscribes"
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
                      v-for="res in subscribes"
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
                  v-model="subscribePages"
                  :length="Math.ceil(subscribeCount / 5)"
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
                <div v-if="share.length > 0">
                  <div v-if="editorMode">
                    <ShareEditor
                      v-for="res in share"
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
                      v-for="res in share"
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
                  v-model="sharePages"
                  :length="Math.ceil(shareCount / 5)"
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

const route = useRoute()
const { name } = useDisplay()
const appTheme = useTheme()
const notifyerStore = useNotifyerStore()
const gid = route.query.gid
const notFound: Ref<boolean> = ref(false)
const currentSheet: Ref<"subscribes" | "share" | "user"> = ref("subscribes")
const group: Ref<Groups> = ref({ gid: "", name: "", create_date: new Date() })
const userGroup: Ref<UserGroups> = ref({ ugid: "", uid: "", gid: "", expire: new Date(), admin: false })
const subscribes: Ref<GroupSubscribes[]> = ref([])
const subscribeCount: Ref<number> = ref(0)
const subscribePages: Ref<number> = ref(1)
const share: Ref<GroupShare[]> = ref([])
const shareCount: Ref<number> = ref(0)
const sharePages: Ref<number> = ref(1)
const editorMode: Ref<boolean> = ref(false)
const paginationTotalVisible = computed(() => {
  switch (name.value) {
    case 'xs': return 1
    default: return 7
  }
})


function showSheet(sheet: "subscribes" | "share" | "user") {
  currentSheet.value = sheet
}

async function fetchSubscribes() {
  try {
    const response = await axios.get<ReturnResult<GroupSubscribes>>(`/api/v2/group/subscribes?where_gid=${gid}&offset=${((subscribePages.value - 1) * 5)}`)
    if (response.data.status === 200) {
      subscribes.value = response.data.result
      subscribeCount.value = response.data.count
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

async function fetchShare() {
  try {
    const response = await axios.get<ReturnResult<GroupShare>>(`/api/v2/group/share?where_gid=${gid}&offset=${((sharePages.value - 1) * 5)}`)
    if (response.data.status === 200) {
      share.value = response.data.result.map(share => ({
        ...share,
        create_date: new Date(share.create_date)
      }))
      shareCount.value = response.data.count
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

async function createSubscribe() {
  const data = [{
    order: 255,
    name: "新订阅",
    url: "https://",
    converter: true
  }]

  await axios.post<ReturnMessage>(`/api/v2/admin/group/subscribes?where_gid=${gid}`, data)
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

async function createShare() {
  const data = [{
    name: "新共享账号",
    account: "",
    password: "",
    manage: "",
    aff: ""
  }]

  await axios.post<ReturnMessage>(`/api/v2/admin/group/share?where_gid=${gid}`, data)
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

async function switchEditorMode() {
  await fetchSubscribes()
  await fetchShare()
  if (editorMode.value && currentSheet.value === 'user') {
    showSheet('subscribes')
  }
  editorMode.value = !editorMode.value
}

watch(subscribePages, (newPage, oldPage) => {
  if (newPage !== oldPage) {
    fetchSubscribes()
  }
})

watch(sharePages, (newPage, oldPage) => {
  if (newPage !== oldPage) {
    fetchShare()
  }
})

try {
  const respGroup = await axios.get<ReturnResult<Groups>>(`/api/v2/group?where_gid=${gid}`)
  const respUserGroup = await axios.get<ReturnResult<UserGroups>>(`/api/v2/user/groups?where_gid=${gid}`)

  if (respGroup.data.status === 200) {
    group.value = respGroup.data.result[0]
  }

  if (respUserGroup.data.status === 200) {
    userGroup.value = respUserGroup.data.result.map(userGroup => ({
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