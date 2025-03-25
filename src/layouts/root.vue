<template>
  <v-app>
    <v-main>
      <AppBar
        flat
        border="b"
      />
      <Suspense>
        <router-view v-if="appStore.root" />
        <v-empty-state
          v-else
          headline="啊噢，这里啥都没有…"
          :image="favicon"
          text="您所寻找的页面不存在"
          title="页面未找到"
        />
      </Suspense>
      <Footer />
    </v-main>
  </v-app>
</template>
  
<script lang="ts" setup>
import { useAppStore } from '@/stores/app'
import favicon from '@/assets/favicon.png'

const appStore = useAppStore()
</script>
  