<template>
  <v-navigation-drawer
    v-model="naviOpen"
    :location="mobile ? 'top' : undefined"
    :theme="appTheme.current.value.dark ? '' : 'sheet'"
    floating
  >
    <v-list
      density="compact"
      nav
    >
      <v-list-item
        title="超管菜单"
        subtitle="超级管理员菜单"
      />
      <v-divider />
      <v-list-item
        link
        title="用户"
        :active="naviSelected === 'users'"
        @click.stop="naviSelected = 'users'"
      />
      <v-list-item
        link
        title="分组"
        :active="naviSelected === 'groups'"
        @click.stop="naviSelected = 'groups'"
      />
    </v-list>
  </v-navigation-drawer>
  <v-sheet :theme="appTheme.current.value.dark ? '' : 'sheet'">
    <v-container class="pt-12 pb-12 mb-4">
      <div class="d-flex align-center justify-space-between">
        <div>
          <h1>超管菜单</h1>
        </div>
        <v-btn
          class="mr-4"
          icon="mdi-menu"
          @click.stop="naviOpen = !naviOpen"
        />
      </div>
    </v-container>
  </v-sheet>
  <v-container>
    <v-card v-if="naviSelected === 'users'">
      <UserList />
    </v-card>
    <v-card v-else-if="naviSelected === 'groups'">
      <GroupList />
    </v-card>
    <div v-else>
      <v-empty-state
        headline="啊噢，这里啥都没有…"
        :image="favicon"
        text="您所寻找的页面不存在"
        title="页面未找到"
      />
    </div>
  </v-container>
</template>

<script lang="ts" setup>
import { useDisplay, useTheme } from 'vuetify';

import favicon from '@/assets/favicon.png'

const appTheme = useTheme()
const { mobile } = useDisplay()
/** 打开侧边栏 */
const naviOpen: Ref<boolean> = ref(!mobile.value)
/** 侧边栏已选择 */
const naviSelected: Ref<'users' | 'groups'> = ref('users')

onMounted(() => {
  document.title = '超管菜单 - Subscribe Manager Next'
})
</script>

<route lang="yaml">
meta:
  layout: root
</route>