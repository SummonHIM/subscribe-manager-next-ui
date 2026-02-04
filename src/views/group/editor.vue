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
        <template #title>分组订阅</template>
        <template #content>
          <GroupSubscribeEditor :groupID="queryGroupID" />
        </template>
      </Card>

      <Card class="mb-2">
        <template #title>分组共享账号</template>
        <template #content>
          <GroupShareEditor :groupID="queryGroupID" />
        </template>
      </Card>

      <Card class="mb-2">
        <template #title>分组用户</template>
        <template #content>
          <GroupUsersEditor :groupID="queryGroupID" />
        </template>
      </Card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { type Ref, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Form, type FormResolverOptions, type FormSubmitEvent } from '@primevue/forms'
import { useToast } from 'primevue/usetoast'

import GlobalToolbar, { type GlobalTabbarButtonProps } from '@/components/GlobalToolbar.vue'
import GroupShareEditor from '@/components/GroupShareEditor.vue'
import GroupSubscribeEditor from '@/components/GroupSubscribeEditor.vue'
import GroupUsersEditor from '@/components/GroupUsersEditor.vue'
import { changeGroupName, fetchGroup } from '@/groups'
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

// 检查是否为管理员
if (!group.myself.admin) {
  group.id = -1
}
</script>
