<template>
  <div class="mx-auto pt-8 pb-8 max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[70%]">
    <GlobalToolbar v-model="menuSelected" :buttons="menuItems" class="mb-2" />

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
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { Form, type FormResolverOptions, type FormSubmitEvent } from '@primevue/forms'

import { useAPIGroupStore } from '@/stores/groups'
import type { APIGroup } from '@/interfaces'
import { changeGroupName, fetchGroup } from '@/groups'
import GroupSubscribeEditor from '@/components/GroupSubscribeEditor.vue'
import GroupShareEditor from '@/components/GroupShareEditor.vue'
import GlobalToolbar, { type GlobalTabbarButtonProps } from '@/components/GlobalToolbar.vue'
import GroupUsersEditor from '@/components/GroupUsersEditor.vue'

defineOptions({
  name: 'GroupEditorPage',
})

const route = useRoute()
const toast = useToast()
const router = useRouter()
const apiGroupStore = useAPIGroupStore()

const queryGroupID = Number(route.query.id)

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

const errorMsg: Ref<string | null> = ref(null)
let tempGroup: APIGroup | null = apiGroupStore.getGroupById(Number(route.query.id))
if (!tempGroup) {
  tempGroup = await fetchGroup(Number(route.query.id), errorMsg)
}
const group: APIGroup = tempGroup
const groupInitialValues = reactive({
  name: group.name,
})

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

const groupFormSubmit = async (e: FormSubmitEvent) => {
  if (e.valid) {
    changeGroupName(queryGroupID, e.values.name, toast)
    router.go(0)
  }
}
</script>
