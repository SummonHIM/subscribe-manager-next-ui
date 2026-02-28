<template>
  <div class="bg-neutral-50 dark:bg-neutral-900">
    <div
      class="mx-auto pt-8 pb-8 max-w-[90%] md:max-w-[85%] lg:max-w-[70%] flex flex-col items-center sm:flex-row sm:justify-between"
    >
      <h2 class="text-3xl mt-8 mb-8 text-slate-600 dark:text-slate-300">{{ group.name }}</h2>
      <p
        class="text-slate-600 dark:text-slate-300"
        :class="{ 'text-red-500': apiGroupStore.isExpired(group.myself.expire) }"
      >
        {{ formatToLocalSystem(group.myself.expire) }} 过期
      </p>
    </div>
  </div>

  <template v-if="group.id > 0">
    <div class="mx-auto pt-8 pb-8 max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[70%]">
      <GlobalToolbar v-model="topMenuItemsSelected" :buttons="topMenuItems" />

      <GlobalToolbar v-model="menuSelected" :buttons="menuItems" class="mt-4" />

      <div v-if="menuSelected.label === '订阅'" class="mt-8">
        <template v-if="groupSubscribes.count > 0">
          <template v-if="groupSubscribes.count / 10 > 1">
            <Paginator
              class="mb-4"
              v-model:first="paginatorGroupSubscribes"
              :rows="10"
              :total-records="groupSubscribes.count"
            ></Paginator>
          </template>

          <GroupSubscribe
            class="mb-4"
            v-for="sub in groupSubscribes.results"
            :key="sub.id"
            :group-id="group.id"
            :subscribe="sub"
          />

          <template v-if="groupSubscribes.count / 10 > 1">
            <Paginator
              v-model:first="paginatorGroupSubscribes"
              :rows="10"
              :total-records="groupSubscribes.count"
            ></Paginator>
          </template>
        </template>
        <template v-else>
          <Message severity="warn" icon="pi pi-exclamation-circle">暂无订阅内容</Message>
        </template>
      </div>

      <div v-else-if="menuSelected.label === '共享账号'" class="mt-8">
        <template v-if="groupShares.count > 0">
          <template v-if="groupShares.count / 10 > 1">
            <Paginator
              class="mb-4"
              v-model:first="paginatorGroupShares"
              :rows="10"
              :total-records="groupShares.count"
            ></Paginator>
          </template>

          <GroupShares
            class="mb-4"
            v-for="share in groupShares.results"
            :key="share.id"
            :share="share"
          />

          <template v-if="groupShares.count / 10 > 1">
            <Paginator
              v-model:first="paginatorGroupShares"
              :rows="10"
              :total-records="groupShares.count"
            ></Paginator>
          </template>
        </template>
        <template v-else>
          <Message severity="warn" icon="pi pi-exclamation-circle">暂无共享账号</Message>
        </template>
      </div>

      <div v-else class="mt-8">
        <p class="text-center text-xl font-bold">敬请期待！</p>
      </div>
    </div>
  </template>
  <template v-else-if="errorMsg !== null">
    <div class="mx-auto pt-8 pb-8 max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[70%]">
      <Message severity="error" icon="pi pi-exclamation-triangle">
        获取分组信息时发生错误：{{ errorMsg }}
      </Message>
    </div>
  </template>
</template>

<script setup lang="ts">
import { type Ref, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { useToast } from 'primevue/usetoast'

import { type GlobalTabbarButtonProps } from '@/components/GlobalToolbar.vue'
import { fetchGroup, fetchGroupShares, fetchGroupSubscribes } from '@/groups'
import type { APIBasicList, APIGroup, APIGroupShares, APIGroupSubscribes } from '@/interfaces'
import { useAPIGroupStore } from '@/stores/groups'

defineOptions({
  name: 'GroupResourcesPage',
})

const route = useRoute()
const toast = useToast()
const apiGroupStore = useAPIGroupStore()

const queryGroupID = Number(route.query.id)

// 俩菜单
const topMenuItems: GlobalTabbarButtonProps[] = [
  {
    id: 'back',
    label: '返回',
    icon: 'pi pi-arrow-left',
    hidden: false,
    href: '/',
  },
  {
    id: 'back-hidden',
    label: '返回',
    icon: 'pi pi-arrow-left',
    hidden: true,
  },
]
const topMenuItemsSelected = ref<GlobalTabbarButtonProps>(
  topMenuItems.find((item) => item.id === 'back-hidden')!,
)
const menuItems: GlobalTabbarButtonProps[] = [
  {
    id: 'subscribes',
    label: '订阅',
    icon: 'pi pi-link',
    hidden: false,
  },
  {
    id: 'shares',
    label: '共享账号',
    icon: 'pi pi-share-alt',
    hidden: false,
  },
  {
    id: 'admin',
    label: '编辑',
    icon: 'pi pi-pencil',
    hidden: true,
    href: `/group/editor/?id=${queryGroupID}`,
  },
]
const menuSelected = ref<GlobalTabbarButtonProps>(
  menuItems.find((item) => item.id === 'subscribes')!,
)

// 获取分组信息
const errorMsg: Ref<string | null> = ref(null)
let tempGroup: APIGroup | null = apiGroupStore.getGroupById(queryGroupID)
if (!tempGroup) {
  tempGroup = await fetchGroup(queryGroupID, errorMsg)
}
const group: APIGroup = tempGroup

const groupSubscribes: Ref<APIBasicList<APIGroupSubscribes>> = ref({
  count: 0,
  next: null,
  previous: null,
  results: [],
})
const groupShares: Ref<APIBasicList<APIGroupShares>> = ref({
  count: 0,
  next: null,
  previous: null,
  results: [],
})

// 分页
const paginatorGroupSubscribes = ref(0)
const paginatorGroupShares = ref(0)

/**
 * 将日期字符串格式化为Date对象
 * @param isoString ISO 日期字符串
 */
const formatToLocalSystem = (isoString: string): string => {
  const date = new Date(isoString)
  return date.toLocaleString()
}

// 检查是否过期
if (apiGroupStore.isExpired(group.myself.expire, group.myself.admin)) {
  group.id = -1
  group.name = '该分组已过期'
}
// 检查是否为管理员
if (group.myself.admin) {
  const menuAdmin = menuItems.find((item) => item.id === 'admin')
  if (menuAdmin) menuAdmin.hidden = false
}

// 获取订阅和共享账号
groupSubscribes.value = await fetchGroupSubscribes(queryGroupID, 10, 0, toast)
groupShares.value = await fetchGroupShares(queryGroupID, 10, 0, toast)

// 监听分页
watch(paginatorGroupSubscribes, async () => {
  groupSubscribes.value = await fetchGroupSubscribes(
    queryGroupID,
    10,
    paginatorGroupSubscribes.value,
    toast,
  )
})
watch(paginatorGroupShares, async () => {
  groupShares.value = await fetchGroupShares(queryGroupID, 10, paginatorGroupShares.value, toast)
})
</script>
