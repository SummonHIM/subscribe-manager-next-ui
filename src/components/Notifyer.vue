<template>
  <v-snackbar
    v-model="notifyerStore.open"
    :timeout="5000"
  >
    {{ notifyerStore.message }}

    <template #actions>
      <v-btn
        variant="tonal"
        @click="closeSnackbar"
      >
        关闭
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts" setup>
import { useNotifyerStore } from '@/stores/notifyer'
const notifyerStore = useNotifyerStore()

function closeSnackbar() {
  notifyerStore.open = false
}

// watch(
//   () => notifyerStore.message,
//   (newMessage, oldMessage) => {
//     if (newMessage !== oldMessage) {
//       notifyerStore.open = false
//       setTimeout(() => {
//         notifyerStore.open = true
//       }, 0)
//     }
//   }
// )
</script>