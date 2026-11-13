<template>
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
    <button
      v-for="(card, index) in cards"
      :key="index"
      type="button"
      class="surface-card flex items-start gap-3 p-4 text-left transition-shadow hover:shadow-sm"
      @click="card.on_click"
    >
      <span
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
      >
        <i :class="card.icon" class="text-sm"></i>
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {{ card.title }}
        </span>
        <span class="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
          {{ card.description }}
        </span>
      </span>
      <i class="pi pi-arrow-up-right mt-1 text-[10px] text-neutral-300 dark:text-neutral-600"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

interface HomeTitleCards {
  title: string
  icon: string
  description: string
  on_click?: () => void
}

const cards: HomeTitleCards[] = [
  {
    title: '下载客户端',
    icon: 'pi pi-download',
    description: '下载适合当前操作系统的代理客户端',
    on_click: () => {
      window.open('https://www.123865.com/s/uCWGTd-qn4l?pwd=rXgE#', '_blank')
    },
  },
  {
    title: '融合订阅链接',
    icon: 'pi pi-link',
    description: '将多个订阅融合为一个订阅',
    on_click: () => {
      router.push('/converter')
    },
  },
  {
    title: '订阅转换器',
    icon: 'pi pi-refresh',
    description: '将订阅转换为其他代理客户端支持格式',
    on_click: () => {
      window.open('http://subconverter.summonhim.top', '_blank')
    },
  },
]
</script>
