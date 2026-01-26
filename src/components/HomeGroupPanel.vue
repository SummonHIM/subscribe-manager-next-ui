<template>
  <component :is="routerLink ? RouterLink : 'div'" :to="routerLink">
    <Card :class="[card_class, attrs.class]">
      <template #content>
        <div class="flex items-end justify-between gap-3">
          <div class="flex items-end gap-3 min-w-0 flex-1">
            <i class="pi pi-users" style="font-size: 25px"></i>
            <p class="font-bold truncate min-w-0">{{ props.group.name }}</p>
          </div>
          <p
            class="shrink-0"
            :class="{ 'text-red-500': apiGroupStore.isExpired(props.group.myself.expire) }"
          >
            <span class="hidden sm:inline">
              {{ formatToLocalSystem(props.group.myself.expire) }} 过期
            </span>
            <span class="inline sm:hidden">
              {{ apiGroupStore.isExpired(props.group.myself.expire) ? '已过期' : '' }}
            </span>
          </p>
        </div>
      </template>
    </Card>
  </component>
</template>

<script setup lang="ts">
import { useAttrs } from 'vue'
import { RouterLink } from 'vue-router'

import type { APIGroup } from '@/interfaces'
import { useAPIGroupStore } from '@/stores/groups'

interface Props {
  group: APIGroup
}

const attrs = useAttrs()
const props = defineProps<Props>()
const apiGroupStore = useAPIGroupStore()
const disabled: boolean = props.group.myself.admin
  ? false
  : apiGroupStore.isExpired(props.group.myself.expire)
const card_class: string = disabled
  ? 'cursor-default bg-stone-100! dark:bg-stone-900!'
  : 'transition hover:scale-[1.01] active:scale-[1.00] dark:border dark:border-neutral-500!'
const routerLink = disabled ? '' : `/group/?id=${props.group.id}`

const formatToLocalSystem = (isoString: string): string => {
  const date = new Date(isoString)
  return date.toLocaleString()
}
</script>
