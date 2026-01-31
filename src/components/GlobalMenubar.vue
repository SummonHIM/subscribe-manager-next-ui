<template>
  <Menubar v-bind="$attrs" class="mx-1 mt-1 mb-1">
    <template #start>
      <Button asChild v-slot="slotProps" severity="contrast" variant="text">
        <RouterLink to="/" :class="slotProps.class">
          <Avatar :image="FavIcon" shape="circle" />
        </RouterLink>
      </Button>
    </template>
    <template #end>
      <div class="flex items-center gap-2">
        <Button
          severity="secondary"
          variant="text"
          @click="toggleUserMenu"
          aria-haspopup="true"
          aria-controls="user_menu"
        >
          <div class="hidden sm:block">{{ applicationStore.user?.username.toUpperCase() }}</div>
          <Avatar :image="userGravatarUrl" shape="circle" />
        </Button>
        <TieredMenu ref="userMenuMethods" id="user_menu" :model="userMenuItems" popup />
      </div>
    </template>
  </Menubar>

  <Dialog v-model:visible="logoutVisible" modal :style="{ width: '30rem' }" header="登出确认">
    <p>你确定要登出吗？</p>
    <form class="flex justify-end gap-2 mt-4" action="/oidc/logout/" method="POST">
      <input type="hidden" name="csrfmiddlewaretoken" :value="applicationStore.csrfToken" />
      <Button label="取消" icon="pi pi-times" text @click="logoutVisible = false" />
      <Button label="确定" icon="pi pi-check" type="submit" />
    </form>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, type Ref } from 'vue'
import type { TieredMenuMethods } from 'primevue'
import type { MenuItem } from 'primevue/menuitem'
import { useToast } from 'primevue/usetoast'

import FavIcon from '@/assets/favicon.png'
import { useApplicationStore } from '@/stores/application'
import { useAppearanceStore } from '@/stores/appearance'

const toast = useToast()
const applicationStore = useApplicationStore()
const appearanceStore = useAppearanceStore()
const userGravatarUrl = await genGravatar(
  applicationStore.user?.email ? applicationStore.user.email : '',
)
const logoutVisible = ref(false)
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
  return `https://www.gravatar.com/avatar/${hashHex}?d=${encodeURIComponent(defaultImage)}`
}
</script>
