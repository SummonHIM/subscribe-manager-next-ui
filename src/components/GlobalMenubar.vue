<template>
  <header
    v-bind="$attrs"
    class="sticky top-0 z-40 bg-white/90 backdrop-blur dark:bg-neutral-950/90"
  >
    <div class="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
      <RouterLink
        to="/"
        class="flex items-center gap-2 rounded-md p-1 transition-opacity hover:opacity-80"
      >
        <Avatar :image="FavIcon" shape="circle" class="!h-7 !w-7" />
        <span class="text-sm font-medium text-neutral-700 dark:text-neutral-200">订阅管理器</span>
      </RouterLink>

      <Button
        severity="secondary"
        variant="text"
        rounded
        aria-haspopup="true"
        aria-controls="user_menu"
        @click="toggleUserMenu"
      >
        <span class="hidden pr-1 text-xs text-neutral-500 sm:block dark:text-neutral-400">
          {{ applicationStore.user?.username.toUpperCase() }}
        </span>
        <Avatar :image="userGravatarUrl" shape="circle" class="!h-8 !w-8" />
      </Button>
      <TieredMenu ref="userMenuMethods" id="user_menu" :model="userMenuItems" popup />
    </div>
  </header>

  <Dialog v-model:visible="logoutVisible" modal :style="{ width: '30rem' }" header="登出确认">
    <p>确定要登出吗？</p>
    <form class="flex justify-end gap-2 mt-4" action="/oidc/logout/" method="POST">
      <input type="hidden" name="csrfmiddlewaretoken" :value="applicationStore.csrfToken" />
      <Button label="取消" icon="pi pi-times" text @click="logoutVisible = false" />
      <Button label="确定" icon="pi pi-check" type="submit" />
    </form>
  </Dialog>
</template>

<script setup lang="ts">
import { type Ref, ref } from 'vue'

import type { TieredMenuMethods } from 'primevue'
import type { MenuItem } from 'primevue/menuitem'
import { useToast } from 'primevue/usetoast'

import FavIcon from '@/assets/favicon.png'
import { useAppearanceStore } from '@/stores/appearance'
import { useApplicationStore } from '@/stores/application'

const toast = useToast()
const applicationStore = useApplicationStore()
const appearanceStore = useAppearanceStore()

// 头像
const userGravatarUrl = await genGravatar(
  applicationStore.user?.email ? applicationStore.user.email : '',
)

// 登出对话框
const logoutVisible = ref(false)

// 菜单实际内容
const userMenuMethods: Ref<TieredMenuMethods | null> = ref(null)
const userMenuItems: Ref<MenuItem[]> = ref([
  {
    label: '外观',
    items: [
      {
        label: '自动',
        icon: 'pi pi-stopwatch',
        command: () => {
          appearanceStore.dark_mode = 'auto'
          toast.add({
            severity: 'success',
            summary: '外观已变更',
            detail: '已更换到自动深色模式！',
            life: 2000,
          })
        },
      },
      {
        label: '浅色',
        icon: 'pi pi-sun',
        command: () => {
          appearanceStore.dark_mode = false
          toast.add({
            severity: 'success',
            summary: '外观已变更',
            detail: '已更换到浅色外观！',
            life: 2000,
          })
        },
      },
      {
        label: '深色',
        icon: 'pi pi-moon',
        command: () => {
          appearanceStore.dark_mode = true
          toast.add({
            severity: 'success',
            summary: '外观已变更',
            detail: '已更换到深色外观！',
            life: 2000,
          })
        },
      },
    ],
  },
  {
    label: '超管后台',
    url: '/admin/',
    visible: applicationStore.user?.is_staff,
  },
  {
    separator: true,
  },
  {
    label: '登出',
    command: () => {
      logoutVisible.value = true
    },
  },
])

/**
 * 切换用户菜单
 * @param event 事件
 */
const toggleUserMenu = (event: Event) => {
  if (userMenuMethods.value) userMenuMethods.value.toggle(event)
}

/**
 * 生成Gravatar头像链接
 * @param email 邮箱地址
 * @param defaultImage 默认图像
 */
async function genGravatar(email: string, defaultImage: string = 'identicon'): Promise<string> {
  // 去掉首尾空格并转换小写
  const normalized = email.trim().toLowerCase()
  // 转 Uint8Array
  const msgBuffer = new TextEncoder().encode(normalized)
  // 生成 SHA-256 哈希
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  // 转十六进制
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  // 返回完整 URL
  return `https://seccdn.libravatar.org/gravatarproxy/${hashHex}?d=${encodeURIComponent(defaultImage)}`
}
</script>
