<template>
  <div class="page-container">
    <div class="surface-card flex flex-col items-center py-16 text-center">
      <i class="pi pi-compass text-3xl text-neutral-400 dark:text-neutral-500"></i>
      <h1 class="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">页面未找到</h1>
      <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">404 Not Found</p>
      <RouterLink
        to="/"
        class="mt-6 inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-2 text-sm text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
      >
        <i class="pi pi-arrow-left text-xs"></i>
        返回首页
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'NotFoundPage',
})
</script>
