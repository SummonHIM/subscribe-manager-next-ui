<template>
  <DataTable
    :value="groupUsers.results"
    :rows="tablePaginatorRows"
    :first="tablePaginatorFirst"
    :totalRecords="groupUsers.count"
    :rowsPerPageOptions="[10, 20, 50, 100]"
    @page="onTablePaginatorChange"
    class="whitespace-nowrap"
    dataKey="id"
    paginator
    lazy
  >
    <!-- <Column field="id" header="ID"></Column> -->
    <Column field="user" header="用户 ID"></Column>
    <Column field="username" header="用户名"></Column>
    <Column field="expire" header="过期日">
      <template #body="slotProps">
        {{ new Date(slotProps.data.expire).toLocaleString() }}
      </template>
    </Column>
    <Column field="admin" header="管理员">
      <template #body="slotProps">
        {{ slotProps.data.admin ? '是' : '否' }}
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
      <template v-if="editorGroupUserID >= 0"><p class="text-xl">编辑分组用户</p></template>
      <template v-else><p class="text-xl">新建分组用户</p></template>
    </template>

    <Form v-slot="$form" :initialValues="editorInitialValues" @submit="onEditorSave">
      <FloatLabel variant="on" class="mt-2">
        <DatePicker
          id="gu-editor-expire"
          name="expire"
          dateFormat="yy/mm/dd"
          showTime
          hourFormat="24"
          fluid
        />
        <label for="gu-editor-expire">过期日</label>
      </FloatLabel>

      <div class="flex justify-end gap-2 mt-4">
        <Button label="取消" icon="pi pi-times" text @click="editorVisible = false" />
        <Button label="恢复" icon="pi pi-refresh" text @click="$form.reset()" />
        <Button label="保存" icon="pi pi-check" type="submit" />
      </div>
    </Form>
  </Dialog>

  <Dialog v-model:visible="deleteVisible" modal :style="{ width: '30rem' }" header="删除确认">
    <p>确定要删除该分组用户吗？</p>

    <template #footer>
      <Button label="取消" icon="pi pi-times" text @click="deleteVisible = false" />
      <Button label="确定" icon="pi pi-check" @click="onDeleteConfirm" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { type Ref, ref } from 'vue'

import type { FormSubmitEvent } from '@primevue/forms/form'
import type { DataTablePageEvent } from 'primevue/datatable'
import { useToast } from 'primevue/usetoast'

import { deleteGroupUser, fetchGroupUsers, modifyGroupUser } from '@/groups'
import type { APIBasicList, APIGroupUsers, APIGroupUsersEdit } from '@/interfaces'

interface GroupUserEditorProps {
  groupID: number
}

const toast = useToast()
const props = defineProps<GroupUserEditorProps>()

const groupUsers: Ref<APIBasicList<APIGroupUsers>> = ref({
  count: 0,
  next: null,
  previous: null,
  results: [],
})

// 分页
const tablePaginatorRows = ref(10)
const tablePaginatorFirst = ref(0)

// 编辑对话框
const editorVisible = ref(false)
const editorInitialValues: Ref<APIGroupUsersEdit> = ref({
  expire: '',
})
const editorGroupUserID: Ref<number> = ref(-1)

// 删除对话框
const deleteVisible = ref(false)
const deleteGroupUserID: Ref<number> = ref(-1)

/**
 * 打开修改编辑器
 * @param ga 原分组订阅
 */
const onEditorOpenEdit = (groupUser: APIGroupUsers) => {
  editorInitialValues.value = { expire: '' }
  editorGroupUserID.value = groupUser.id
  editorVisible.value = true
}

// const editorResolver = ({ values }: FormResolverOptions) => {
//   const errors: Partial<Record<keyof APIGroupUsersEdit, { message: string }[]>> = {}

//   const expire = values.expire as string | undefined
//   if (expire) {
//     if (!isISODateTimeString(expire)) {
//       errors.expire = [{ message: '过期日格式不正确。' }]
//     }
//   }

//   return {
//     values,
//     errors,
//   }
// }

/**
 * 编辑器保存事件
 * @param event 事件
 */
const onEditorSave = async (event: FormSubmitEvent) => {
  if (event.valid) {
    const newExpireDate = new Date(event.values.expire)
    const newExpireAsia = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .format(newExpireDate)
      .replace(' ', 'T')

    const values = {
      expire: newExpireAsia,
    }
    await modifyGroupUser(props.groupID, editorGroupUserID.value, values, toast)

    groupUsers.value = await fetchGroupUsers(
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
  deleteGroupUserID.value = id
  deleteVisible.value = true
}

/** 删除 */
const onDeleteConfirm = async () => {
  await deleteGroupUser(props.groupID, deleteGroupUserID.value, toast)

  groupUsers.value = await fetchGroupUsers(
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
  groupUsers.value = await fetchGroupUsers(props.groupID, event.rows, event.first, toast)
}

// function isISODateTimeString(value: string): boolean {
//   if (!value || typeof value !== 'string') return false
//   const time = new Date(value).getTime()
//   return !isNaN(time)
// }

// 获取一遍
groupUsers.value = await fetchGroupUsers(
  props.groupID,
  tablePaginatorRows.value,
  tablePaginatorFirst.value,
  toast,
)
</script>
