<template>
  <component :is="routerLink ? RouterLink : 'div'" :to="routerLink">
    <div :class="['surface-card flex items-center gap-3 p-4 transition-shadow', cardClass]">
      <span
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        :class="
          disabled
            ? 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
        "
      >
        <span v-if="props.group.emoji" class="text-lg leading-none">
          {{ props.group.emoji }}
        </span>
        <i v-else class="pi pi-users text-sm"></i>
      </span>

      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {{ props.group.name }}
        </p>
        <p
          class="mt-0.5 text-xs"
          :class="
            expired ? 'text-red-500 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400'
          "
        >
          {{ formatToLocalSystem(props.group.myself.expire) }} 到期
        </p>
      </div>

      <i v-if="!disabled" class="pi pi-angle-right text-neutral-300 dark:text-neutral-600"></i>
    </div>
  </component>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

import type { APIGroup } from '@/interfaces'
import { useAPIGroupStore } from '@/stores/groups'

interface Props {
  group: APIGroup
}

const props = defineProps<Props>()
const apiGroupStore = useAPIGroupStore()

const expired = apiGroupStore.isExpired(props.group.myself.expire, props.group.myself.admin)
const disabled = !props.group.myself.admin && expired
const routerLink = disabled ? undefined : `/group/?id=${props.group.id}`
const cardClass = disabled ? 'opacity-60' : 'hover:shadow-sm'

const formatToLocalSystem = (isoString: string): string => {
  const date = new Date(isoString)
  return date.toLocaleString()
}
</script>
