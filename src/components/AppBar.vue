<template>
  <v-app-bar v-bind="componentProps">
    <v-container class="mx-auto d-flex align-center justify-center">
      <v-btn
        v-for="link, name in links"
        :key="name"
        :href="link.blank ? link.link : ''"
        :target="link.blank ? '_blank' : '_self'"
        :text="name"
        :to="link.blank ? '' : link.link"
        variant="text"
      />

      <v-spacer />

      <v-btn
        key="username"
        variant="text"
      >
        <v-icon icon="mdi-account" />
        <div class="d-none d-sm-flex">
          {{ appStore.userName }}
        </div>
        <v-menu activator="parent">
          <v-list>
            <v-list-item
              href="https://auth.summonhim.top:8443/if/user/#/settings"
              target="_blank"
              append-icon="mdi-open-in-new"
            >
              用户选项
            </v-list-item>
            <v-list-group value="主题">
              <template #activator="{ props }">
                <v-list-item
                  v-bind="props"
                  title="主题"
                />
              </template>

              <v-list-item
                :active="themeStore.theme === 'auto'"
                @click="setTheme('auto')"
              >
                自动
              </v-list-item>
              <v-list-item
                :active="themeStore.theme === 'light'"
                @click="setTheme('light')"
              >
                浅色
              </v-list-item>
              <v-list-item
                :active="themeStore.theme === 'dark'"
                @click="setTheme('dark')"
              >
                深色
              </v-list-item>
            </v-list-group>
            <div v-if="appStore.root">
              <v-list-item to="/root">
                超管后台
              </v-list-item>
            </div>
            <v-list-item @click="appStore.logout">
              登出
            </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>
    </v-container>
  </v-app-bar>
</template>

<script lang="ts" setup>
import { useTheme } from 'vuetify'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'
import { VAppBar } from 'vuetify/components';

const componentProps = defineProps(VAppBar['$props'])
const appTheme = useTheme()
const appStore = useAppStore()
const themeStore = useThemeStore()

const links = {
  主页: {
    link: '/',
    blank: false,
  },
  客户端: {
    link: 'https://5ubm4nd0c.summonhim.top',
    blank: true,
  },
}

/**
 * 设置主题
 * @param theme 主题
 */
function setTheme(theme: "auto" | "light" | "dark") {
  themeStore.theme = theme

  if (themeStore.theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    appTheme.global.name.value = prefersDark ? 'dark' : 'light'
  } else {
    appTheme.global.name.value = themeStore.theme
  }
}
</script>
