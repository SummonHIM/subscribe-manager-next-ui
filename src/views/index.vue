<template>
  <div class="bg-neutral-50 dark:bg-neutral-900"><HomeTitle /></div>
  <div class="mx-auto pt-8 pb-8 max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[70%]">
    <h3 class="text-lg font-blod mb-2">我的分组</h3>

    <template v-if="apiGroupStore.errorMsg">
      <Message severity="error" icon="pi pi-exclamation-triangle">
        获取分组时发生错误：{{ apiGroupStore.errorMsg }}
      </Message>
    </template>
    <template v-else>
      <HomeGroupPanel
        v-for="group in apiGroupStore.group"
        :key="group.id"
        :group="group"
        class="mb-2"
      />

      <template v-if="apiGroupStore.count / 10 > 1">
        <Paginator
          v-model:first="paginatorGroup"
          :rows="10"
          :total-records="apiGroupStore.count"
        ></Paginator>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAPIGroupStore } from '@/stores/groups'
import HomeTitle from '@/components/HomeTitle.vue'
import HomeGroupPanel from '@/components/HomeGroupPanel.vue'

defineOptions({
  name: 'HomePage',
})

const apiGroupStore = useAPIGroupStore()
const paginatorGroup = ref(0)

watch(paginatorGroup, async () => {
  await apiGroupStore.fetchGroup(10, paginatorGroup.value)
})

await apiGroupStore.fetchGroup(10, 0)
</script>
