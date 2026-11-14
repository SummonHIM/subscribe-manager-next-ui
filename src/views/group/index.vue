<template>
  <div class="min-h-full">
    <div class="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <!-- 头部 -->
      <header class="flex items-start gap-2 sm:gap-3">
        <Button
          icon="pi pi-arrow-left"
          severity="secondary"
          variant="text"
          rounded
          aria-label="返回"
          class="-ml-2 shrink-0"
          @click="router.push('/')"
        />

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span v-if="group.emoji" class="text-2xl leading-none">{{ group.emoji }}</span>
            <h1
              class="truncate text-xl font-semibold text-neutral-900 sm:text-2xl dark:text-neutral-100"
            >
              {{ group.name }}
            </h1>
            <Tag
              v-if="expired && !group.myself.admin"
              severity="danger"
              value="已过期"
              class="shrink-0"
            />
          </div>

          <p
            v-if="group.id > 0"
            class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400"
          >
            <span class="whitespace-nowrap">
              <span class="tabular-nums">{{ formatToLocalSystem(group.myself.expire) }}</span> 到期
            </span>
            <span class="hidden text-neutral-300 sm:inline dark:text-neutral-700">·</span>
            <span class="hidden whitespace-nowrap sm:inline">
              <span class="tabular-nums">{{ groupSubscribes.count }}</span> 个订阅
            </span>
            <span class="hidden text-neutral-300 sm:inline dark:text-neutral-700">·</span>
            <span class="hidden whitespace-nowrap sm:inline">
              <span class="tabular-nums">{{ groupShares.count }}</span> 个共享账号
            </span>
          </p>
          <p v-else class="mt-1 text-sm text-red-500 dark:text-red-400">
            该分组已过期，请联系管理员。
          </p>
        </div>

        <RouterLink
          v-if="group.myself.admin && group.id > 0"
          :to="`/group/editor/?id=${queryGroupID}`"
          class="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          <i class="pi pi-pencil text-xs"></i>
          编辑
        </RouterLink>
      </header>

      <template v-if="group.id > 0">
        <!-- 标签页 -->
        <nav class="mt-6 flex gap-6 border-b border-neutral-200 dark:border-neutral-800">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="-mb-px flex items-center gap-1.5 border-b-2 px-0.5 pb-3 text-sm transition-colors"
            :class="
              activeTab === tab.id
                ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
            "
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
            <span
              class="tabular-nums text-xs"
              :class="
                activeTab === tab.id
                  ? 'text-neutral-500 dark:text-neutral-400'
                  : 'text-neutral-400 dark:text-neutral-500'
              "
            >
              {{ tab.count }}
            </span>
          </button>
        </nav>

        <!-- 订阅 -->
        <section v-if="activeTab === 'subscribes'">
          <div
            v-if="groupSubscribes.count === 0"
            class="flex flex-col items-center py-16 text-neutral-400 dark:text-neutral-600"
          >
            <i class="pi pi-inbox text-3xl"></i>
            <p class="mt-3 text-sm">暂无订阅内容</p>
          </div>

          <template v-else>
            <div class="mt-4 space-y-3">
              <GroupSubscribe
                v-for="sub in groupSubscribes.results"
                :key="sub.id"
                :group-id="group.id"
                :subscribe="sub"
              />
            </div>

            <Paginator
              v-if="groupSubscribes.count > 10"
              v-model:first="paginatorGroupSubscribes"
              :rows="10"
              :total-records="groupSubscribes.count"
              class="mt-4"
            />
          </template>
        </section>

        <!-- 共享账号 -->
        <section v-else>
          <div
            v-if="groupShares.count === 0"
            class="flex flex-col items-center py-16 text-neutral-400 dark:text-neutral-600"
          >
            <i class="pi pi-inbox text-3xl"></i>
            <p class="mt-3 text-sm">暂无共享账号</p>
          </div>

          <template v-else>
            <div class="mt-4 grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
              <GroupShares v-for="share in groupShares.results" :key="share.id" :share="share" />
            </div>

            <Paginator
              v-if="groupShares.count > 10"
              v-model:first="paginatorGroupShares"
              :rows="10"
              :total-records="groupShares.count"
              class="mt-4"
            />
          </template>
        </section>
      </template>

      <Message
        v-else-if="errorMsg !== null"
        severity="error"
        icon="pi pi-exclamation-triangle"
        class="mt-6"
      >
        获取分组信息时发生错误：{{ errorMsg }}
      </Message>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Ref, computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { useToast } from 'primevue/usetoast'

import { fetchGroup, fetchGroupShares, fetchGroupSubscribes } from '@/groups'
import type { APIBasicList, APIGroup, APIGroupShares, APIGroupSubscribes } from '@/interfaces'
import { useAPIGroupStore } from '@/stores/groups'

defineOptions({
  name: 'GroupResourcesPage',
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const apiGroupStore = useAPIGroupStore()

const queryGroupID = Number(route.query.id)

// 当前标签页
const activeTab: Ref<'subscribes' | 'shares'> = ref('subscribes')

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

// 标签页内容
const tabs = computed(() => [
  { id: 'subscribes' as const, label: '订阅', count: groupSubscribes.value.count },
  { id: 'shares' as const, label: '共享账号', count: groupShares.value.count },
])

// 是否已过期（管理员不受限）
const expired = computed(() => apiGroupStore.isExpired(group.myself.expire, group.myself.admin))

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
