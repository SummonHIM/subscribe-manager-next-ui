<template>
  <template v-if="applicationStore.loginStat">
    <Toast />

    <div class="min-h-screen flex flex-col">
      <header>
        <Suspense>
          <GlobalMenubar />
        </Suspense>
      </header>

      <main class="flex-1">
        <Suspense>
          <RouterView />
        </Suspense>
      </main>

      <footer>
        <GlobalFooter />
      </footer>
    </div>
  </template>
  <template v-else-if="apiGroupStore.errorMsg !== null">
    <Message severity="error" icon="pi pi-exclamation-triangle">
      获取基本信息时发生错误：{{ apiGroupStore.errorMsg }}
    </Message>
  </template>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'

import { useAppearanceStore } from '@/stores/appearance'
import { useApplicationStore } from '@/stores/application'
import { useAPIGroupStore } from '@/stores/groups'

const applicationStore = useApplicationStore()
const appearanceStore = useAppearanceStore()
const apiGroupStore = useAPIGroupStore()

const doc_html = document.documentElement
const prefersColorScheme = window.matchMedia('(prefers-color-scheme: dark)')
let unsubscribeDarkMode: (() => void) | null = null

/**
 * 切换深色模式
 * @param enabled 启用
 */
const applyDarkMode = (enabled: boolean) => {
  doc_html.classList[enabled ? 'add' : 'remove']('dark')
}

/**
 * 浏览器深色模式监听器
 * @param e 事件
 */
const darkModeListener = (e?: MediaQueryListEvent) => {
  if (appearanceStore.dark_mode === 'auto') {
    applyDarkMode(e?.matches ?? prefersColorScheme.matches)
  } else {
    applyDarkMode(appearanceStore.dark_mode)
  }
}

onMounted(async () => {
  // 获取用户信息与csrf令牌
  await applicationStore.fetchCsrfToken()
  await applicationStore.fetchUser()

  // 检测一遍主题
  darkModeListener()

  // 监听主题变化
  prefersColorScheme.addEventListener('change', darkModeListener)
  unsubscribeDarkMode = appearanceStore.$subscribe(() => {
    darkModeListener()
  })
})

onUnmounted(() => {
  prefersColorScheme.removeEventListener('change', darkModeListener)
  unsubscribeDarkMode?.()
})
</script>
