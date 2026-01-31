<template>
  <Panel v-bind="$attrs" class="mx-1 mt-1 mb-1">
    <p class="text-center mb-4">
      © {{ currentYear }} <a href="https://www.summonhim.top/" target="_blank">SummonHIM</a>
    </p>
  </Panel>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>
