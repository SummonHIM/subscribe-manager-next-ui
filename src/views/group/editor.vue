<template>
  <div class="mx-auto pt-8 pb-8 max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[70%]">
    <GlobalToolbar v-model="menuSelected" :buttons="menuItems" class="mb-2" />

    <template v-if="group.id > 0">
      <Card class="mb-2">
        <template #title>
          {{ group.name }}
        </template>

        <template #content>
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

            <div class="flex justify-end mt-2 gap-2">
              <Button label="恢复" severity="secondary" text @click="$form.reset()" />
              <Button type="submit" label="保存" />
            </div>
          </Form>
        </template>
      </Card>

      <Card class="mb-2">
        <template #content>
          <GroupSubscribeEditor :group-id="queryGroupID" />
        </template>
      </Card>

      <Card class="mb-2">
        <template #content>
          <GroupShareEditor :group-id="queryGroupID" />
        </template>
      </Card>

      <Card class="mb-2">
        <template #content>
          <GroupUsersEditor :group-id="queryGroupID" :expire-temp="groupFirstSubExpire" />
        </template>
      </Card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { type Ref, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Form, type FormResolverOptions, type FormSubmitEvent } from '@primevue/forms'
import { useToast } from 'primevue/usetoast'

import { type GlobalTabbarButtonProps } from '@/components/GlobalToolbar.vue'
import { changeGroupName, fetchGroup, fetchGroupSubscribesUsage } from '@/groups'
import type { APIGroup } from '@/interfaces'
import { useAPIGroupStore } from '@/stores/groups'

defineOptions({
  name: 'GroupEditorPage',
})

const route = useRoute()
const toast = useToast()
const router = useRouter()
const apiGroupStore = useAPIGroupStore()

const queryGroupID = Number(route.query.id)

// 菜单
const menuItems: GlobalTabbarButtonProps[] = [
  {
    id: 'back',
    label: '返回',
    icon: 'pi pi-arrow-left',
    hidden: false,
    href: `/group/?id=${Number(route.query.id)}`,
  },
  {
    id: 'back-hidden',
    label: '返回',
    icon: 'pi pi-arrow-left',
    hidden: true,
  },
]
const menuSelected = ref<GlobalTabbarButtonProps>(
  menuItems.find((item) => item.id === 'back-hidden')!,
)

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
const groupFirstSubExpire: Ref<Date | null> = ref(null)

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
  if (e.valid) {
    changeGroupName(queryGroupID, e.values.name, toast)
    router.go(0)
  }
}

onMounted(async () => {
  // 检查是否为管理员
  if (!group.myself.admin) {
    group.id = -1
  }

  if (group.subscribes.length >= 1) {
    const firstSub = group.subscribes[0]
    if (firstSub) {
      const usage = await fetchGroupSubscribesUsage(group.id, firstSub)
      if (usage.expire !== null) {
        groupFirstSubExpire.value = new Date(usage.expire * 1000)
      }
    }
  }
})
</script>
