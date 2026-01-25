<template>
  <div class="flex justify-end gap-2 mb-4">
    <Button icon="pi pi-plus" variant="text" rounded raised @click="onEditorOpenNew" />
  </div>

  <DataTable
    :value="groupShares.results"
    :rows="tablePaginatorRows"
    :first="tablePaginatorFirst"
    :totalRecords="groupShares.count"
    :rowsPerPageOptions="[10, 20, 50, 100]"
    @page="onTablePaginatorChange"
    @rowReorder="onTableRowReorder"
    class="whitespace-nowrap"
    dataKey="id"
    paginator
    lazy
  >
    <Column rowReorder headerStyle="width: 2rem" />
    <Column field="id" header="ID"></Column>
    <Column field="name" header="名称"></Column>
    <Column field="account" header="账号"></Column>
    <Column field="password" header="密码">
      <template #body="slotProps">
        {{ '●'.repeat(slotProps.data.password.length) }}
      </template>
    </Column>
    <Column field="manage_url" header="网站"></Column>
    <Column field="manage_aff" header="邀请码"></Column>
    <Column field="date_created" header="创建日">
      <template #body="slotProps">
        {{ new Date(slotProps.data.date_created).toLocaleString() }}
      </template>
    </Column>

    <Column style="min-width: 7rem">
      <template #body="slotProps">
        <Button
          icon="pi pi-pencil"
          variant="text"
          rounded
          raised
          class="mr-2"
          @click="onEditorOpenEdit(slotProps.data)"
        />
        <Button
          icon="pi pi-trash"
          variant="text"
          rounded
          raised
          severity="danger"
          @click="onOpenDeleteDialog(slotProps.data.id)"
        />
      </template>
    </Column>
  </DataTable>

  <Dialog v-model:visible="editorVisible" modal :style="{ width: '30rem' }">
    <template #header>
      <template v-if="editorGroupSharesID >= 0"><p class="text-xl">编辑共享账号</p></template>
      <template v-else><p class="text-xl">新建共享账号</p></template>
    </template>

    <Form
      v-slot="$form"
      :initialValues="editorInitialValues"
      :resolver="editorResolver"
      @submit="onEditorSave"
    >
      <FloatLabel variant="on" class="mt-2">
        <InputText id="ga-editor-name" name="name" fluid autocomplete="off" />
        <label for="ga-editor-name">账号名称</label>
      </FloatLabel>
      <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
        {{ $form.name.error?.message }}
      </Message>

      <FloatLabel variant="on" class="mt-2">
        <InputText id="ga-editor-account" name="account" fluid />
        <label for="ga-editor-account">账号</label>
      </FloatLabel>
      <Message v-if="$form.account?.invalid" severity="error" size="small" variant="simple">
        {{ $form.account.error?.message }}
      </Message>

      <FloatLabel variant="on" class="mt-2">
        <Password
          id="ga-editor-password-label"
          inputId="ga-editor-password"
          name="password"
          :feedback="false"
          fluid
          toggleMask
        />
        <label for="ga-editor-password">密码</label>
      </FloatLabel>
      <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">
        {{ $form.password.error?.message }}
      </Message>

      <FloatLabel variant="on" class="mt-2">
        <InputText id="ga-editor-manage-url" type="manage_url" name="manage_url" fluid />
        <label for="ga-editor-manage-url">账号所用网站</label>
      </FloatLabel>
      <Message v-if="$form.manage_url?.invalid" severity="error" size="small" variant="simple">
        {{ $form.manage_url.error?.message }}
      </Message>

      <FloatLabel variant="on" class="mt-2">
        <InputText id="ga-editor-manage-aff" type="manage_aff" name="manage_aff" fluid />
        <label for="ga-editor-manage-aff">网站邀请码</label>
      </FloatLabel>
      <Message v-if="$form.manage_aff?.invalid" severity="error" size="small" variant="simple">
        {{ $form.manage_aff.error?.message }}
      </Message>

      <div class="flex justify-end gap-2 mt-4">
        <Button label="取消" icon="pi pi-times" text @click="editorVisible = false" />
        <Button label="恢复" icon="pi pi-refresh" text @click="$form.reset()" />
        <Button label="保存" icon="pi pi-check" type="submit" />
      </div>
    </Form>
  </Dialog>

  <Dialog v-model:visible="deleteVisible" modal :style="{ width: '30rem' }" header="删除确认">
    <p>你确定要删除该共享账号吗？</p>

    <template #footer>
      <Button label="取消" icon="pi pi-times" text @click="deleteVisible = false" />
      <Button label="确定" icon="pi pi-check" @click="onDeleteConfirm" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, type Ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import type { DataTablePageEvent, DataTableRowReorderEvent } from 'primevue/datatable'

import {
  createGroupShare,
  deleteGroupShare,
  fetchGroupShares,
  modifyGroupShare,
  moveByIndex,
  reOrderShares,
} from '@/groups'
import type { APIBasicList, APIGroupShares, APIGroupSharesEdit } from '@/interfaces'
import type { FormResolverOptions, FormSubmitEvent } from '@primevue/forms/form'

interface GroupSharesEditorProps {
  groupID: number
}

const toast = useToast()
const props = defineProps<GroupSharesEditorProps>()

const groupShares: Ref<APIBasicList<APIGroupShares>> = ref({
  count: 0,
  next: null,
  previous: null,
  results: [],
})

// 分页
const tablePaginatorRows = ref(10)
const tablePaginatorFirst = ref(0)

// 编辑器
const editorVisible = ref(false)
const editorInitialValues: Ref<APIGroupSharesEdit> = ref({
  name: '',
  account: '',
  password: '',
  manage_url: '',
  manage_aff: '',
  group: props.groupID,
  order: -1,
  date_created: '',
})
const editorGroupSharesID: Ref<number> = ref(-1)

// 删除
const deleteVisible = ref(false)
const deleteGroupSharesID: Ref<number> = ref(-1)

/** 编辑器表单验证器 */
const editorResolver = ({ values }: FormResolverOptions) => {
  const errors: Partial<Record<keyof APIGroupSharesEdit, { message: string }[]>> = {}

  const name = values.name as string | undefined
  if (name) {
    if (name?.length > 255) {
      errors.name = [{ message: '账号名称长度不得大于 255。' }]
    }
  }

  const account = values.account as string | undefined
  if (account) {
    if (account?.length > 255) {
      errors.account = [{ message: '账号长度不得大于 255。' }]
    }
  }

  const password = values.password as string | undefined
  if (password) {
    if (password?.length > 255) {
      errors.password = [{ message: '密码长度不得大于 255。' }]
    }
  }

  const manage_url = values.manage_url as string | undefined
  if (manage_url) {
    if (manage_url?.length > 255) {
      errors.manage_url = [{ message: '账号所用网站长度不得大于 255。' }]
    }
  }

  const manage_aff = values.manage_aff as string | undefined
  if (manage_aff) {
    if (manage_aff?.length > 255) {
      errors.manage_aff = [{ message: '网站邀请码长度不得大于 255。' }]
    }
  }

  return {
    values,
    errors,
  }
}

/** 打开新建编辑器 */
const onEditorOpenNew = () => {
  editorInitialValues.value = {
    name: '',
    account: '',
    password: '',
    manage_url: '',
    manage_aff: '',
    group: props.groupID,
    order: -1,
    date_created: '',
  }
  editorGroupSharesID.value = -1
  editorVisible.value = true
}

/**
 * 打开修改编辑器
 * @param ga 原分组订阅
 */
const onEditorOpenEdit = (ga: APIGroupShares) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...safeInitial } = ga
  editorInitialValues.value = { ...safeInitial }
  editorGroupSharesID.value = ga.id
  editorVisible.value = true
}

/**
 * 编辑器保存事件
 * @param event 事件
 */
const onEditorSave = async (event: FormSubmitEvent) => {
  if (event.valid) {
    if (editorGroupSharesID.value >= 0) {
      const values: APIGroupSharesEdit = {
        ...editorInitialValues.value,
        ...event.values,
      }
      await modifyGroupShare(props.groupID, editorGroupSharesID.value, values, toast)
    } else {
      const values: APIGroupSharesEdit = {
        ...editorInitialValues.value,
        ...event.values,
        group: props.groupID,
        order: groupShares.value.count + 1,
        date_created: new Date().toISOString(),
      }
      await createGroupShare(props.groupID, values, toast)
    }

    groupShares.value = await fetchGroupShares(
      props.groupID,
      tablePaginatorRows.value,
      tablePaginatorFirst.value,
      toast,
    )
    editorVisible.value = false
  }
}

/**
 * 打开删除确认
 * @param id 欲删除的ID
 */
const onOpenDeleteDialog = (id: number) => {
  deleteGroupSharesID.value = id
  deleteVisible.value = true
}

/** 删除 */
const onDeleteConfirm = async () => {
  await deleteGroupShare(props.groupID, deleteGroupSharesID.value, toast)

  groupShares.value = await fetchGroupShares(
    props.groupID,
    tablePaginatorRows.value,
    tablePaginatorFirst.value,
    toast,
  )
  deleteVisible.value = false
}

/**
 * 页面变化事件
 * @param event 事件
 */
const onTablePaginatorChange = async (event: DataTablePageEvent) => {
  tablePaginatorRows.value = event.rows
  tablePaginatorFirst.value = event.first
  groupShares.value = await fetchGroupShares(props.groupID, event.rows, event.first, toast)
}

/**
 * 重新排序事件
 * @param event 事件
 */
const onTableRowReorder = async (event: DataTableRowReorderEvent) => {
  const newList = moveByIndex(groupShares.value.results, event.dragIndex, event.dropIndex)

  await reOrderShares(props.groupID, newList, tablePaginatorFirst.value, toast)
  groupShares.value = await fetchGroupShares(
    props.groupID,
    tablePaginatorRows.value,
    tablePaginatorFirst.value,
    toast,
  )
}

// 初始化，先获取一遍
groupShares.value = await fetchGroupShares(
  props.groupID,
  tablePaginatorRows.value,
  tablePaginatorFirst.value,
  toast,
)
</script>
