<template>
  <footer v-bind="$attrs">
    <div
      class="mx-auto w-full max-w-5xl px-4 py-6 text-center text-xs text-neutral-400 sm:px-6 dark:text-neutral-500"
    >
      © {{ currentYear }}
      <a
        href="https://www.summonhim.top/"
        target="_blank"
        class="transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
      >
        SummonHIM
      </a>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>
