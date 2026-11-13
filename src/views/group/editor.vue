<template>
  <div class="page-container">
    <header class="flex items-start gap-2 sm:gap-3">
      <RouterLink
        :to="`/group/?id=${queryGroupID}`"
        aria-label="返回"
        class="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
      >
        <i class="pi pi-arrow-left text-sm"></i>
      </RouterLink>

      <div class="min-w-0">
        <h1 class="page-title truncate">{{ group.name }}</h1>
        <p class="page-subtitle mt-1">双击表格行直接编辑；文本输入框内 Enter 保存、Esc 取消。</p>
      </div>
    </header>

    <template v-if="group.id > 0">
      <nav class="mt-6 flex gap-6 border-b border-neutral-200 dark:border-neutral-800">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="-mb-px border-b-2 px-0.5 pb-3 text-sm transition-colors"
          :class="
            activeTab === tab.id
              ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
          "
          @click="switchTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </nav>

      <div class="mt-4">
        <section v-if="activeTab === 'settings'" class="surface-card p-4 sm:p-5">
          <h2 class="section-title mb-3">分组信息</h2>

          <Form
            v-slot="$form"
            :initialValues="groupInitialValues"
            :resolver="groupResolver"
            @submit="groupFormSubmit"
          >
            <FloatLabel variant="on">
              <InputText id="group-editor-name" name="name" fluid autocomplete="off" />
              <label for="group-editor-name">分组名称</label>
            </FloatLabel>
            <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
              {{ $form.name.error?.message }}
            </Message>

            <div class="mt-3 flex justify-end gap-2">
              <Button label="恢复" severity="secondary" text @click="$form.reset()" />
              <Button type="submit" label="保存" />
            </div>
          </Form>
        </section>

        <section v-else-if="activeTab === 'subscribes'" class="surface-card p-4 sm:p-5">
          <GroupSubscribeEditor :group-id="queryGroupID" @editing-state="editingDirty = $event" />
        </section>

        <section v-else-if="activeTab === 'shares'" class="surface-card p-4 sm:p-5">
          <GroupShareEditor :group-id="queryGroupID" @editing-state="editingDirty = $event" />
        </section>

        <section v-else class="surface-card p-4 sm:p-5">
          <GroupUsersEditor :group-id="queryGroupID" @editing-state="editingDirty = $event" />
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { type Ref, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { Form, type FormResolverOptions, type FormSubmitEvent } from '@primevue/forms'
import { useToast } from 'primevue/usetoast'

import { changeGroupName, fetchGroup } from '@/groups'
import type { APIGroup } from '@/interfaces'
import { useAPIGroupStore } from '@/stores/groups'

defineOptions({
  name: 'GroupEditorPage',
})

type TabID = 'subscribes' | 'shares' | 'users' | 'settings'

const route = useRoute()
const toast = useToast()
const apiGroupStore = useAPIGroupStore()

const queryGroupID = Number(route.query.id)

// 标签页
const activeTab: Ref<TabID> = ref('settings')
const editingDirty = ref(false)

/**
 * 切换标签页
 * @param id 目标标签
 */
const switchTab = (id: TabID) => {
  if (id === activeTab.value) return

  if (editingDirty.value && !window.confirm('当前有未保存的修改，切换标签会丢弃，是否继续？')) {
    return
  }

  activeTab.value = id
  editingDirty.value = false
}
const tabs: { id: TabID; label: string }[] = [
  { id: 'settings', label: '分组设置' },
  { id: 'subscribes', label: '订阅' },
  { id: 'shares', label: '共享账号' },
  { id: 'users', label: '用户' },
]

// 获取分组信息
const errorMsg: Ref<string | null> = ref(null)
let tempGroup: APIGroup | null = apiGroupStore.getGroupById(Number(route.query.id))
if (!tempGroup) {
  tempGroup = await fetchGroup(Number(route.query.id), errorMsg)
}
const group: APIGroup = tempGroup
const groupInitialValues = reactive({
  name: group.name,
})

/**
 * 检查是否符合规定
 * @param param0 表单数据
 */
const groupResolver = ({ values }: FormResolverOptions) => {
  const errors: Partial<Record<keyof APIGroup, { message: string }[]>> = {}

  const name = values.name as string | undefined
  if (!name || name.trim().length === 0) {
    errors.name = [{ message: '请填写分组名称' }]
  } else {
    if (name?.length > 150) {
      errors.name = [{ message: '分组名称长度不得大于 150。' }]
    }
  }

  return {
    values,
    errors,
  }
}

/**
 * 修改分组名称
 * @param e 事件
 */
const groupFormSubmit = async (e: FormSubmitEvent) => {
  if (!e.valid) return

  const name = e.values.name as string
  if (await changeGroupName(queryGroupID, name, toast)) {
    group.name = name
    groupInitialValues.name = name
  }
}

// 检查是否为管理员
if (!group.myself.admin) {
  group.id = -1
}
</script>
