<template>
  <div class="mx-auto pt-8 pb-8 max-w-[90%] md:max-w-[85%] lg:max-w-[70%]">
    <h2 class="text-3xl mb-6 text-slate-600 dark:text-slate-300">欢迎回来</h2>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-10">
      <Card
        v-for="(card, index) in cards"
        :key="index"
        class="cursor-pointer transition hover:scale-[1.02] active:scale-[0.98]"
        :class="card.extra_class"
        @click="card.on_click"
      >
        <template #title>
          <p class="text-center mt-3 font-bold">{{ card.title }}</p>
        </template>

        <template #content>
          <p class="text-center mt-5 mb-3">
            <i :class="card.icon" style="font-size: 2.4rem"></i>
          </p>
          <p class="text-center mt-3 mb-3 text-sm font-extralight">
            {{ card.description }}
          </p>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import router from '@/router'

interface HomeTitleCards {
  title: string
  icon: string
  description: string
  extra_class?: string
  on_click?: () => void
}

const cards: HomeTitleCards[] = [
  {
    title: '下载客户端',
    icon: 'pi pi-download',
    description: '下载适合当前操作系统的代理客户端',
    extra_class: 'bg-yellow-100! dark:bg-stone-700!',
    on_click: () => {
      window.open('https://www.123865.com/s/uCWGTd-qn4l?pwd=rXgE#', '_blank')
    },
  },
  {
    title: '融合订阅链接',
    icon: 'pi pi-link',
    description: '将多个订阅融合为一个订阅',
    extra_class: 'bg-cyan-100! dark:bg-cyan-900!',
    on_click: () => {
      router.push('/converter')
    },
  },
  {
    title: '订阅转换器',
    icon: 'pi pi-refresh',
    description: '将订阅转换为其他代理客户端支持格式',
    extra_class: 'bg-lime-100! dark:bg-lime-900!',
    on_click: () => {
      window.open('http://subconverter.summonhim.top', '_blank')
    },
  },
]
</script>
