<template>
  <DataTable
    :value="groupSubscribes.results"
    :rows="tablePaginatorRows"
    :first="tablePaginatorFirst"
    :totalRecords="groupSubscribes.count"
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
    class="subscribe-table"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="section-title">分组订阅</span>
        <div class="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
          <InputText
            v-model="search"
            placeholder="搜索名称或链接"
            size="small"
            class="w-full min-w-0 sm:w-52"
            aria-label="搜索订阅"
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
              rounded
              variant="text"
              class="shrink-0"
              aria-label="新建订阅"
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
    <Column field="name" header="订阅" style="width: 100%">
      <template #body="slotProps">
        <div class="min-w-0">
          <div class="line-clamp-1 break-all font-medium text-neutral-900 dark:text-neutral-100">
            {{ slotProps.data.name }}
          </div>
          <div
            class="mt-0.5 line-clamp-1 break-all font-mono text-xs text-neutral-500 dark:text-neutral-400"
            :title="slotProps.data.url"
          >
            {{ slotProps.data.url }}
          </div>
          <div class="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
            创建于 {{ new Date(slotProps.data.date_created).toLocaleString() }}
          </div>
        </div>
      </template>
      <template #editor="{ data }">
        <div class="flex flex-col gap-1">
          <InputText
            v-model="data.name"
            size="small"
            fluid
            placeholder="订阅名称"
            @keydown.enter.prevent="saveRow(data)"
            @keydown.esc.prevent="cancelRow(data)"
          />
          <InputText
            v-model="data.url"
            size="small"
            fluid
            placeholder="订阅链接"
            @keydown.enter.prevent="saveRow(data)"
            @keydown.esc.prevent="cancelRow(data)"
          />
        </div>
      </template>
    </Column>
    <Column
      field="converter"
      header="订阅转换"
      style="width: 6rem"
      headerStyle="width: 6rem; white-space: nowrap"
    >
      <template #body="slotProps">
        <span
          class="whitespace-nowrap text-xs"
          :class="
            slotProps.data.converter
              ? 'text-sky-600 dark:text-sky-400'
              : 'text-neutral-400 dark:text-neutral-500'
          "
        >
          {{ slotProps.data.converter ? '开启转换' : '关闭转换' }}
        </span>
      </template>
      <template #editor="{ data }">
        <div class="flex items-center gap-2">
          <ToggleSwitch v-model="data.converter" />
          <span class="whitespace-nowrap text-xs">
            {{ data.converter ? '开启转换' : '关闭转换' }}
          </span>
        </div>
      </template>
    </Column>
    <Column style="width: 8rem">
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
              aria-label="编辑订阅"
              @click="startEdit(slotProps.data)"
            />
            <Button
              icon="pi pi-sliders-h"
              severity="secondary"
              variant="text"
              rounded
              size="small"
              aria-label="编辑订阅转换选项"
              :title="alertServerConverterOption(slotProps.data.converter_options) ?? ''"
              @click="onOpenConverterDialog(slotProps.data.id, slotProps.data.converter_options)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              variant="text"
              rounded
              size="small"
              aria-label="删除订阅"
              @click="onOpenDeleteDialog(slotProps.data.id)"
            />
          </template>
        </div>
      </template>
    </Column>
  </DataTable>

  <Dialog v-model:visible="editorVisible" modal :style="{ width: '30rem' }" header="新建订阅">
    <Form
      v-slot="$form"
      :initialValues="editorInitialValues"
      :resolver="editorResolver"
      @submit="onEditorSave"
    >
      <FloatLabel variant="on" class="mt-2">
        <InputText id="gs-editor-name" name="name" fluid autocomplete="off" />
        <label for="gs-editor-name">订阅名称</label>
      </FloatLabel>
      <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
        {{ $form.name.error?.message }}
      </Message>

      <FloatLabel variant="on" class="mt-2">
        <InputText id="gs-editor-url" name="url" fluid />
        <label for="gs-editor-url">订阅链接</label>
      </FloatLabel>
      <Message v-if="$form.url?.invalid" severity="error" size="small" variant="simple">
        {{ $form.url.error?.message }}
      </Message>

      <div class="mt-2 flex gap-2">
        <ToggleSwitch name="converter" />
        <p>订阅转换</p>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <Button label="取消" icon="pi pi-times" text @click="editorVisible = false" />
        <Button label="恢复" icon="pi pi-refresh" text @click="$form.reset()" />
        <Button label="保存" icon="pi pi-check" type="submit" />
      </div>
    </Form>
  </Dialog>

  <Dialog v-model:visible="deleteVisible" modal :style="{ width: '30rem' }" header="删除确认">
    <p>确定要删除该订阅吗？</p>

    <template #footer>
      <Button label="取消" icon="pi pi-times" text @click="deleteVisible = false" />
      <Button label="确定" icon="pi pi-check" @click="onDeleteConfirm" />
    </template>
  </Dialog>

  <Dialog
    v-model:visible="converterVisible"
    modal
    :style="{ width: '50rem' }"
    header="订阅转换选项"
  >
    <ConverterForm
      :visible="converterVisible"
      :initialValues="converterInitialValues"
      :onCancel="onCancelConverterDialog"
      :onSubmit="onSaveConverterDialog"
    />
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

import { convertFromApiOptions, convertToApiOptions, converterDefaultOptions } from '@/converter'
import {
  createGroupSubscribe,
  deleteGroupSubscribe,
  fetchGroupSubscribes,
  modifyGroupSubscribe,
  modifyGroupSubscribeConverterOptions,
  moveByIndex,
  reOrderSubscribes,
} from '@/groups'
import type {
  APIBasicList,
  APIConverterOptions,
  APIGroupSubscribes,
  APIGroupSubscribesEdit,
  ConverterOptions,
} from '@/interfaces'

interface GroupSubscribesEditorProps {
  groupId: number
}

const toast = useToast()
const props = defineProps<GroupSubscribesEditorProps>()
const emit = defineEmits<{
  (e: 'editing-state', value: boolean): void
}>()

const groupSubscribes: Ref<APIBasicList<APIGroupSubscribes>> = ref({
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
const editingRows: Ref<APIGroupSubscribes[]> = ref([])

// 通知父组件是否有未保存的编辑
watch(editingRows, (rows) => emit('editing-state', rows.length > 0))

// 新建对话框
const editorVisible = ref(false)
const editorInitialValues: Ref<APIGroupSubscribesEdit> = ref({
  name: '',
  url: '',
  converter: false,
  group: props.groupId,
  order: -1,
  date_created: '',
  converter_options: null,
})

// 删除对话框
const deleteVisible = ref(false)
const deleteGroupSubscribesID: Ref<number> = ref(-1)

// 转换选项对话框
const converterVisible = ref(false)
const converterInitialValues: Ref<ConverterOptions> = ref({ ...converterDefaultOptions })
const converterGroupSubscribesID: Ref<number> = ref(-1)

/** 刷新表格 */
const onRefreshTable = async () => {
  editingRows.value = []
  groupSubscribes.value = await fetchGroupSubscribes(
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
let editSnapshot: APIGroupSubscribes | null = null

/**
 * 该行是否正在编辑
 * @param row 行数据
 */
const isEditing = (row: APIGroupSubscribes) => {
  return editingRows.value.some((item) => item.id === row.id)
}

/**
 * 开始编辑某一行
 * @param row 行数据
 */
const startEdit = (row: APIGroupSubscribes) => {
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
const saveRow = async (row: APIGroupSubscribes) => {
  const { id, ...values } = row

  await modifyGroupSubscribe(props.groupId, id, values, toast)
  editSnapshot = null
  editingRows.value = editingRows.value.filter((item) => item.id !== id)
  await onRefreshTable()
}

/**
 * 取消行内编辑并还原
 * @param row 正在编辑的行
 */
const cancelRow = (row: APIGroupSubscribes) => {
  if (editSnapshot) Object.assign(row, editSnapshot)
  editSnapshot = null
  editingRows.value = editingRows.value.filter((item) => item.id !== row.id)
}

/** 编辑器表单验证器 */
const editorResolver = ({ values }: FormResolverOptions) => {
  const errors: Partial<Record<keyof APIGroupSubscribesEdit, { message: string }[]>> = {}

  const name = values.name as string | undefined
  if (!name || name.trim().length === 0) {
    errors.name = [{ message: '请填写订阅名称' }]
  } else {
    if (name?.length > 150) {
      errors.name = [{ message: '订阅名称长度不得大于 150。' }]
    }
  }

  const url = values.url as string | undefined
  const urlPattern = /^https?:\/\/.+$/i
  if (!url || url.trim().length === 0) {
    errors.url = [{ message: '请填写上游订阅链接' }]
  } else if (url.length > 255) {
    errors.url = [{ message: '上游订阅链接长度不得大于 255。' }]
  } else if (!urlPattern.test(url)) {
    errors.url = [{ message: '请输入合法的订阅链接。' }]
  } else {
    try {
      new URL(url) // 保证 URL 可解析
    } catch {
      errors.url = [{ message: '请输入合法的订阅链接。' }]
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
    url: '',
    converter: false,
    group: props.groupId,
    order: -1,
    date_created: '',
    converter_options: null,
  }
  editorVisible.value = true
}

/**
 * 新建订阅保存事件
 * @param event 事件
 */
const onEditorSave = async (event: FormSubmitEvent) => {
  if (!event.valid) return

  const values: APIGroupSubscribesEdit = {
    ...editorInitialValues.value,
    ...event.values,
    group: props.groupId,
    order: groupSubscribes.value.count + 1,
    date_created: new Date().toISOString(),
    converter_options: null,
  }

  await createGroupSubscribe(props.groupId, values, toast)
  await onRefreshTable()
  editorVisible.value = false
}

/**
 * 打开删除确认
 * @param id 欲删除的ID
 */
const onOpenDeleteDialog = (id: number) => {
  deleteGroupSubscribesID.value = id
  deleteVisible.value = true
}

/** 删除 */
const onDeleteConfirm = async () => {
  await deleteGroupSubscribe(props.groupId, deleteGroupSubscribesID.value, toast)

  await onRefreshTable()
  deleteVisible.value = false
}

/**
 * 打开订阅转换选项编辑器
 * @param id 欲修改的ID
 */
const onOpenConverterDialog = (id: number, converter_options: ConverterOptions | null) => {
  converterGroupSubscribesID.value = id
  if (converter_options) converterInitialValues.value = convertFromApiOptions(converter_options)
  else converterInitialValues.value = { ...converterDefaultOptions }
  converterVisible.value = true
}

/** 关闭订阅转换选项对话框 */
const onCancelConverterDialog = () => {
  converterVisible.value = false
}

/**
 * 保存订阅转换选项
 * @param event 事件
 */
const onSaveConverterDialog = async (event: FormSubmitEvent) => {
  if (event.valid) {
    await modifyGroupSubscribeConverterOptions(
      props.groupId,
      converterGroupSubscribesID.value,
      convertToApiOptions(event.values as ConverterOptions),
      toast,
    )

    await onRefreshTable()
    converterVisible.value = false
  }
}

/**
 * 页面变化事件
 * @param event 事件
 */
const onTablePaginatorChange = async (event: DataTablePageEvent) => {
  tablePaginatorRows.value = event.rows
  tablePaginatorFirst.value = event.first
  editingRows.value = []
  groupSubscribes.value = await fetchGroupSubscribes(
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

  const newList = moveByIndex(groupSubscribes.value.results, event.dragIndex, event.dropIndex)

  await reOrderSubscribes(props.groupId, newList, tablePaginatorFirst.value, toast)
  await onRefreshTable()
}

/** 生成服务器强制转换选项的消息 */
function alertServerConverterOption(converter_options: APIConverterOptions): string | null {
  if (!converter_options) return '无修改'
  const entries = Object.entries(converter_options).filter(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_, value]) => value !== null && value !== undefined,
  )
  if (entries.length === 0) return '无修改'
  return entries.map(([key, value]) => `${key}=${value}`).join(', ')
}

// 初始化，先获取一遍
onMounted(async () => {
  await onRefreshTable()
})

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
})
</script>
