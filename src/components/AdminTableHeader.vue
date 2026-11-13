<template>
  <div class="flex flex-wrap items-center justify-between gap-2">
    <span class="section-title">{{ title }}</span>

    <div class="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
      <InputText
        v-model="search"
        :placeholder="placeholder"
        :aria-label="searchLabel"
        size="small"
        class="w-full min-w-0 sm:w-52"
      />

      <div class="ml-auto flex items-center gap-1">
        <Button
          icon="pi pi-refresh"
          variant="text"
          severity="secondary"
          rounded
          class="shrink-0"
          aria-label="刷新"
          @click="emit('refresh')"
        />
        <Button
          v-if="showCreate"
          icon="pi pi-plus"
          variant="text"
          rounded
          class="shrink-0"
          aria-label="新建"
          @click="emit('create')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface AdminTableHeaderProps {
  title: string
  placeholder: string
  searchLabel: string
  showCreate?: boolean
}

defineProps<AdminTableHeaderProps>()

const search = defineModel<string>({ required: true })

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'create'): void
}>()
</script>
