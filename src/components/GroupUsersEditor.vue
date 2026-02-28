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
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl">分组用户</span>
      </div>
    </template>

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
          class="mr-2"
          @click="onEditorOpenEdit(slotProps.data)"
        />
        <Button
          icon="pi pi-trash"
          variant="text"
          rounded
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

    <Form
      v-slot="$form"
      :initialValues="editorInitialValues"
      :resolver="editorResolver"
      @submit="onEditorSave"
    >
      <InputGroup class="mt-2">
        <FloatLabel variant="on">
          <DatePicker
            v-model="editorExpireModel"
            id="gu-editor-expire"
            name="expire"
            dateFormat="yy/mm/dd"
            showTime
            hourFormat="24"
            fluid
          />
          <label for="gu-editor-expire">过期日</label>
        </FloatLabel>
        <InputGroupAddon>
          <Button
            v-if="props.expireTemp"
            icon="pi pi-calendar-clock"
            severity="secondary"
            variant="text"
            @click="onCopyExpireTemp"
          />
        </InputGroupAddon>
      </InputGroup>

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
import { type Ref, onMounted, ref } from 'vue'

import type { FormResolverOptions, FormSubmitEvent } from '@primevue/forms/form'
import type { DataTablePageEvent } from 'primevue/datatable'
import { useToast } from 'primevue/usetoast'

import { deleteGroupUser, fetchGroupUsers, modifyGroupUser } from '@/groups'
import type { APIBasicList, APIGroupUsers, APIGroupUsersEdit } from '@/interfaces'

interface GroupUserEditorProps {
  groupId: number
  expireTemp: Date | null
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
  expire: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
})
const editorGroupUserID: Ref<number> = ref(-1)
const editorExpireModel: Ref<Date> = ref(editorInitialValues.value.expire)

// 删除对话框
const deleteVisible = ref(false)
const deleteGroupUserID: Ref<number> = ref(-1)

/** 刷新表格 */
const onRefreshTable = async () => {
  groupUsers.value = await fetchGroupUsers(
    props.groupId,
    tablePaginatorRows.value,
    tablePaginatorFirst.value,
    toast,
  )
}

/**
 * 打开修改编辑器
 * @param ga 原分组订阅
 */
const onEditorOpenEdit = (groupUser: APIGroupUsers) => {
  editorGroupUserID.value = groupUser.id
  editorExpireModel.value = editorInitialValues.value.expire
  editorVisible.value = true
}

/**
 * 检查修改表单是否符合规则
 * @param param0 错误列表
 */
const editorResolver = ({ values }: FormResolverOptions) => {
  const errors: Partial<Record<keyof APIGroupUsersEdit, { message: string }[]>> = {}

  if (!values.expire) {
    errors.expire = [{ message: '过期日格式不正确。' }]
  } else {
    // 再转一次 Date
    const date = new Date(values.expire)
    if (isNaN(date.getTime())) {
      errors.expire = [{ message: '过期日格式不正确。' }]
    }
  }

  return {
    values,
    errors,
  }
}

/**
 * 编辑器保存事件
 * @param event 事件
 */
const onEditorSave = async (event: FormSubmitEvent) => {
  if (event.valid) {
    const values = {
      expire: new Date(event.values.expire),
    }
    await modifyGroupUser(props.groupId, editorGroupUserID.value, values, toast)

    await onRefreshTable()
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
  await deleteGroupUser(props.groupId, deleteGroupUserID.value, toast)

  await onRefreshTable()
  deleteVisible.value = false
}

/**
 * 页面变化事件
 * @param event 事件
 */
const onTablePaginatorChange = async (event: DataTablePageEvent) => {
  tablePaginatorRows.value = event.rows
  tablePaginatorFirst.value = event.first
  groupUsers.value = await fetchGroupUsers(props.groupId, event.rows, event.first, toast)
}

/**
 * 将第一个分组订阅的过期日复制到剪切板中
 */
const onCopyExpireTemp = async () => {
  if (props.expireTemp) {
    try {
      await navigator.clipboard.writeText(props.expireTemp.toLocaleString())
      toast.add({
        severity: 'success',
        summary: '已成功将分组第一订阅过期日复制到剪切板！',
        life: 5000,
      })
    } catch (error) {
      console.error(error)
      toast.add({
        severity: 'error',
        summary: '错误',
        detail: '复制文本时发生错误！',
        life: 3000,
      })
    }
  }
}

// function isISODateTimeString(value: string): boolean {
//   if (!value || typeof value !== 'string') return false
//   const time = new Date(value).getTime()
//   return !isNaN(time)
// }

// 获取一遍
onMounted(async () => {
  await onRefreshTable()
})
</script>
