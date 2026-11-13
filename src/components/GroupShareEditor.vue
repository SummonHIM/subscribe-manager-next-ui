<template>
  <DataTable
    :value="groupShares.results"
    :rows="tablePaginatorRows"
    :first="tablePaginatorFirst"
    :totalRecords="groupShares.count"
    :rowsPerPageOptions="[10, 20, 50, 100]"
    v-model:editingRows="editingRows"
    editMode="row"
    @page="onTablePaginatorChange"
    @rowReorder="onTableRowReorder"
    @row-dblclick="onRowDblClick"
    dataKey="id"
    size="small"
    paginator
    lazy
    class="share-table"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="section-title">分组共享账号</span>
        <div class="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
          <InputText
            v-model="search"
            placeholder="搜索名称或账号"
            size="small"
            class="w-full min-w-0 sm:w-52"
            aria-label="搜索共享账号"
          />
          <div class="ml-auto flex items-center gap-1">
            <Button
              icon="pi pi-refresh"
              variant="text"
              severity="secondary"
              rounded
              class="shrink-0"
              aria-label="刷新"
              @click="onRefreshTable"
            />
            <Button
              icon="pi pi-plus"
              variant="text"
              rounded
              class="shrink-0"
              aria-label="新建共享账号"
              @click="onEditorOpenNew"
            />
          </div>
        </div>
      </div>
    </template>

    <template #empty>
      <div class="py-10 text-center text-sm text-neutral-400 dark:text-neutral-500">
        {{ search.trim() ? '没有匹配的结果' : '暂无数据' }}
      </div>
    </template>

    <Column :rowReorder="!search.trim()" />
    <Column field="name" header="共享账号" style="width: 100%">
      <template #body="slotProps">
        <div class="min-w-0">
          <div class="line-clamp-1 break-all font-medium text-neutral-900 dark:text-neutral-100">
            {{ slotProps.data.name }}
          </div>
          <div
            class="mt-0.5 flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400"
          >
            <span class="line-clamp-1 break-all font-mono" :title="slotProps.data.account">
              {{ slotProps.data.account }}
            </span>
            <span
              class="shrink-0 text-neutral-400 tabular-nums dark:text-neutral-500"
              :title="slotProps.data.password"
            >
              {{ '●'.repeat(slotProps.data.password.length) }}
            </span>
          </div>
          <div
            v-if="slotProps.data.manage_url"
            class="mt-0.5 line-clamp-1 break-all text-xs text-neutral-400 dark:text-neutral-500"
            :title="slotProps.data.manage_url"
          >
            网站：{{ slotProps.data.manage_url }}
          </div>
          <div
            v-if="slotProps.data.manage_aff"
            class="mt-0.5 line-clamp-1 break-all text-xs text-neutral-400 dark:text-neutral-500"
            :title="slotProps.data.manage_aff"
          >
            邀请码：{{ slotProps.data.manage_aff }}
          </div>
        </div>
      </template>
      <template #editor="{ data }">
        <div class="flex flex-col gap-1">
          <InputText
            v-model="data.name"
            size="small"
            fluid
            placeholder="名称"
            @keydown.enter.prevent="saveRow(data)"
            @keydown.esc.prevent="cancelRow(data)"
          />
          <InputText
            v-model="data.account"
            size="small"
            fluid
            placeholder="账号"
            @keydown.enter.prevent="saveRow(data)"
            @keydown.esc.prevent="cancelRow(data)"
          />
          <InputText
            v-model="data.password"
            size="small"
            fluid
            placeholder="密码"
            @keydown.enter.prevent="saveRow(data)"
            @keydown.esc.prevent="cancelRow(data)"
          />
          <div class="grid grid-cols-1 gap-1 sm:grid-cols-2">
            <InputText
              v-model="data.manage_url"
              size="small"
              fluid
              placeholder="网站"
              @keydown.enter.prevent="saveRow(data)"
              @keydown.esc.prevent="cancelRow(data)"
            />
            <InputText
              v-model="data.manage_aff"
              size="small"
              fluid
              placeholder="邀请码"
              @keydown.enter.prevent="saveRow(data)"
              @keydown.esc.prevent="cancelRow(data)"
            />
          </div>
        </div>
      </template>
    </Column>
    <Column style="width: 7rem">
      <template #body="slotProps">
        <div class="flex items-center justify-center gap-1">
          <template v-if="isEditing(slotProps.data)">
            <Button
              icon="pi pi-check"
              severity="success"
              variant="text"
              rounded
              size="small"
              aria-label="保存"
              @click="saveRow(slotProps.data)"
            />
            <Button
              icon="pi pi-times"
              severity="secondary"
              variant="text"
              rounded
              size="small"
              aria-label="取消"
              @click="cancelRow(slotProps.data)"
            />
          </template>
          <template v-else>
            <Button
              icon="pi pi-pencil"
              severity="secondary"
              variant="text"
              rounded
              size="small"
              aria-label="编辑共享账号"
              @click="startEdit(slotProps.data)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              variant="text"
              rounded
              size="small"
              aria-label="删除共享账号"
              @click="onOpenDeleteDialog(slotProps.data.id)"
            />
          </template>
        </div>
      </template>
    </Column>
  </DataTable>

  <Dialog v-model:visible="editorVisible" modal :style="{ width: '30rem' }" header="新建共享账号">
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

      <div class="mt-4 flex justify-end gap-2">
        <Button label="取消" icon="pi pi-times" text @click="editorVisible = false" />
        <Button label="恢复" icon="pi pi-refresh" text @click="$form.reset()" />
        <Button label="保存" icon="pi pi-check" type="submit" />
      </div>
    </Form>
  </Dialog>

  <Dialog v-model:visible="deleteVisible" modal :style="{ width: '30rem' }" header="删除确认">
    <p>确定要删除该共享账号吗？</p>

    <template #footer>
      <Button label="取消" icon="pi pi-times" text @click="deleteVisible = false" />
      <Button label="确定" icon="pi pi-check" @click="onDeleteConfirm" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { type Ref, onMounted, onUnmounted, ref, watch } from 'vue'

import type { FormResolverOptions, FormSubmitEvent } from '@primevue/forms/form'
import type {
  DataTablePageEvent,
  DataTableRowDoubleClickEvent,
  DataTableRowReorderEvent,
} from 'primevue/datatable'
import { useToast } from 'primevue/usetoast'

import {
  createGroupShare,
  deleteGroupShare,
  fetchGroupShares,
  modifyGroupShare,
  moveByIndex,
  reOrderShares,
} from '@/groups'
import type { APIBasicList, APIGroupShares, APIGroupSharesEdit } from '@/interfaces'

interface GroupSharesEditorProps {
  groupId: number
}

const toast = useToast()
const props = defineProps<GroupSharesEditorProps>()
const emit = defineEmits<{
  (e: 'editing-state', value: boolean): void
}>()

const groupShares: Ref<APIBasicList<APIGroupShares>> = ref({
  count: 0,
  next: null,
  previous: null,
  results: [],
})

// 分页
const tablePaginatorRows = ref(10)
const tablePaginatorFirst = ref(0)

// 搜索
const search = ref('')
let searchTimer: ReturnType<typeof setTimeout> | undefined

// 行内编辑
const editingRows: Ref<APIGroupShares[]> = ref([])

// 通知父组件是否有未保存的编辑
watch(editingRows, (rows) => emit('editing-state', rows.length > 0))

// 新建对话框
const editorVisible = ref(false)
const editorInitialValues: Ref<APIGroupSharesEdit> = ref({
  name: '',
  account: '',
  password: '',
  manage_url: '',
  manage_aff: '',
  group: props.groupId,
  order: -1,
  date_created: '',
})

// 删除对话框
const deleteVisible = ref(false)
const deleteGroupSharesID: Ref<number> = ref(-1)

/** 刷新表格 */
const onRefreshTable = async () => {
  editingRows.value = []
  groupShares.value = await fetchGroupShares(
    props.groupId,
    tablePaginatorRows.value,
    tablePaginatorFirst.value,
    toast,
    search.value,
  )
}

/** 搜索变化（防抖） */
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)

  searchTimer = setTimeout(async () => {
    tablePaginatorFirst.value = 0
    await onRefreshTable()
  }, 300)
})

// 编辑快照，取消时用于还原
let editSnapshot: APIGroupShares | null = null

/**
 * 该行是否正在编辑
 * @param row 行数据
 */
const isEditing = (row: APIGroupShares) => {
  return editingRows.value.some((item) => item.id === row.id)
}

/**
 * 开始编辑某一行
 * @param row 行数据
 */
const startEdit = (row: APIGroupShares) => {
  // 切换编辑行时，先还原上一行未保存的修改
  const current = editingRows.value[0]
  if (current && current.id !== row.id && editSnapshot) {
    Object.assign(current, editSnapshot)
  }

  editSnapshot = { ...row }
  editingRows.value = [row]
}

/** 双击行进入编辑 */
const onRowDblClick = (event: DataTableRowDoubleClickEvent) => {
  const target = event.originalEvent.target as HTMLElement | null
  if (target?.closest('input, button, textarea, select, a')) return

  if (!isEditing(event.data)) startEdit(event.data)
}

/**
 * 保存行内编辑
 * @param row 正在编辑的行
 */
const saveRow = async (row: APIGroupShares) => {
  const { id, ...values } = row

  await modifyGroupShare(props.groupId, id, values, toast)
  editSnapshot = null
  editingRows.value = editingRows.value.filter((item) => item.id !== id)
  await onRefreshTable()
}

/**
 * 取消行内编辑并还原
 * @param row 正在编辑的行
 */
const cancelRow = (row: APIGroupShares) => {
  if (editSnapshot) Object.assign(row, editSnapshot)
  editSnapshot = null
  editingRows.value = editingRows.value.filter((item) => item.id !== row.id)
}

/** 编辑器表单验证器 */
const editorResolver = ({ values }: FormResolverOptions) => {
  const errors: Partial<Record<keyof APIGroupSharesEdit, { message: string }[]>> = {}

  const name = values.name as string | undefined
  if (!name || name.trim().length === 0) {
    errors.name = [{ message: '请填写账号名称' }]
  } else {
    if (name?.length > 150) {
      errors.name = [{ message: '账号名称长度不得大于 150。' }]
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
    group: props.groupId,
    order: -1,
    date_created: '',
  }
  editorVisible.value = true
}

/**
 * 新建共享账号保存事件
 * @param event 事件
 */
const onEditorSave = async (event: FormSubmitEvent) => {
  if (!event.valid) return

  const values: APIGroupSharesEdit = {
    ...editorInitialValues.value,
    ...event.values,
    group: props.groupId,
    order: groupShares.value.count + 1,
    date_created: new Date().toISOString(),
  }

  await createGroupShare(props.groupId, values, toast)
  await onRefreshTable()
  editorVisible.value = false
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
  await deleteGroupShare(props.groupId, deleteGroupSharesID.value, toast)

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
  editingRows.value = []
  groupShares.value = await fetchGroupShares(
    props.groupId,
    event.rows,
    event.first,
    toast,
    search.value,
  )
}

/**
 * 重新排序事件
 * @param event 事件
 */
const onTableRowReorder = async (event: DataTableRowReorderEvent) => {
  // 搜索状态下不允许排序，避免只对过滤结果重排
  if (search.value.trim()) return

  const newList = moveByIndex(groupShares.value.results, event.dragIndex, event.dropIndex)

  await reOrderShares(props.groupId, newList, tablePaginatorFirst.value, toast)
  await onRefreshTable()
}

// 初始化，先获取一遍
onMounted(async () => {
  await onRefreshTable()
})

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
})
</script>
