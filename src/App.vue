<template>
  <v-app>
    <router-view v-slot="{ Component, route }">
      <transition
        mode="out-in"
        name="fade"
      >
        <component
          :is="Component"
          :key="route"
        />
      </transition>
    </router-view>
    <Notifyer />
  </v-app>
</template>

<script lang="ts" setup>
import { useTheme } from 'vuetify'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'

import '@/styles/fade.scss'
import 'nprogress/nprogress.css'

const appTheme = useTheme()
const appStore = useAppStore()
const themeStore = useThemeStore()

// 在应用挂载时初始化主题
onMounted(async () => {
  await appStore.fetchUserInfo()

  if (themeStore.theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    appTheme.global.name.value = prefersDark ? 'dark' : 'light'
  } else {
    appTheme.global.name.value = themeStore.theme
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', (e) => {
    if (themeStore.theme === 'auto') {
      appTheme.global.name.value = e.matches ? 'dark' : 'light'
    }
  })
})
</script>
