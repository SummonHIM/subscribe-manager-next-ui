<template>
  <v-empty-state
    headline="啊噢，这里啥都没有…"
    :image="favicon"
    text="您所寻找的页面不存在"
    title="页面未找到"
  />
</template>

<script lang="ts" setup>
import favicon from '@/assets/favicon.png'

onMounted(() => {
  document.title = '页面未找到 - Subscribe Manager Next'
})
</script>
