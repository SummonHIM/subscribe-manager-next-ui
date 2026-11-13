<template>
  <div class="page-container">
    <header class="mb-6">
      <h1 class="page-title">欢迎回来</h1>
      <p class="page-subtitle mt-1">选择一个分组，或直接使用下方快捷入口。</p>
    </header>

    <HomeTitle />

    <section class="mt-8">
      <div class="mb-3 flex items-baseline justify-between">
        <h2 class="text-sm font-medium text-neutral-500 dark:text-neutral-400">我的分组</h2>
        <span v-if="apiGroupStore.count" class="text-xs text-neutral-400 tabular-nums">
          {{ apiGroupStore.count }} 个
        </span>
      </div>

      <Message v-if="apiGroupStore.errorMsg" severity="error" icon="pi pi-exclamation-triangle">
        获取分组时发生错误：{{ apiGroupStore.errorMsg }}
      </Message>

      <template v-else-if="apiGroupStore.group.length === 0">
        <div
          class="surface-card flex flex-col items-center py-16 text-neutral-400 dark:text-neutral-600"
        >
          <i class="pi pi-inbox text-3xl"></i>
          <p class="mt-3 text-sm">还没有加入任何分组</p>
        </div>
      </template>

      <template v-else>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <HomeGroupPanel v-for="group in apiGroupStore.group" :key="group.id" :group="group" />
        </div>

        <Paginator
          v-if="apiGroupStore.count > 10"
          v-model:first="paginatorGroup"
          :rows="10"
          :total-records="apiGroupStore.count"
          class="mt-4"
        ></Paginator>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

import { useAPIGroupStore } from '@/stores/groups'

defineOptions({
  name: 'HomePage',
})

const apiGroupStore = useAPIGroupStore()
const paginatorGroup = ref(0)

watch(paginatorGroup, async () => {
  await apiGroupStore.fetchGroups(10, paginatorGroup.value)
})

await apiGroupStore.fetchGroups(10, 0)
</script>
