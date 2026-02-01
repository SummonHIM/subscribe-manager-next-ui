<template>
  <div class="bg-neutral-50 dark:bg-neutral-900">
    <div
      class="mx-auto pt-8 pb-8 max-w-[90%] md:max-w-[85%] lg:max-w-[70%] flex flex-col items-center sm:flex-row sm:justify-between"
    >
      <h2 class="text-3xl mt-8 mb-8 text-slate-600 dark:text-slate-300">页面未找到！</h2>
      <p class="text-slate-600 dark:text-slate-300">404 Not Found</p>
    </div>
  </div>

  <div class="mx-auto pt-8 pb-8 max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[70%]">
    <GlobalToolbar v-model="topMenuItemsSelected" :buttons="topMenuItems" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import type { GlobalTabbarButtonProps } from '@/components/GlobalToolbar.vue'

defineOptions({
  name: 'NotFoundPage',
})

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
</script>
