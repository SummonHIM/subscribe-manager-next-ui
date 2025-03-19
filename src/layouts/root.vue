<template>
  <v-app>
    <v-main>
      <Suspense>
        <AppBar />
      </Suspense>
      <Suspense>
        <router-view />
      </Suspense>
    </v-main>
  </v-app>
</template>
  
<script lang="ts" setup>
  
</script>
  