<template>
  <div class="flex justify-end gap-2 mb-4">
    <Button icon="pi pi-plus" variant="text" rounded raised @click="onEditorOpenNew" />
  </div>

  <DataTable
    :value="groupSubscribes.results"
    :rows="tablePaginatorRows"
    :first="tablePaginatorFirst"
    :totalRecords="groupSubscribes.count"
    :rowsPerPageOptions="[10, 20, 50, 100]"
    @page="onTablePaginatorChange"
    @rowReorder="onTableRowReorder"
    class="whitespace-nowrap"
    dataKey="id"
    paginator
    lazy
  >
    <Column rowReorder headerStyle="width: 2rem" />
    <!-- <Column field="id" header="ID"></Column> -->
    <Column field="name" header="名称"></Column>
    <Column field="url" header="链接"></Column>
    <Column field="date_created" header="创建日">
      <template #body="slotProps">
        {{ new Date(slotProps.data.date_created).toLocaleString() }}
      </template>
    </Column>
    <Column field="converter" header="订阅转换">
      <template #body="slotProps">
        {{ slotProps.data.converter ? '开启' : '关闭' }}
      </template>
    </Column>
    <Column field="converter_options" header="订阅转换选项">
      <template #body="slotProps">
        <Button
          icon="pi pi-pencil"
          variant="text"
          rounded
          class="mr-2"
          @click="onOpenConverterDialog(slotProps.data.id, slotProps.data.converter_options)"
        />
        {{ alertServerConverterOption(slotProps.data.converter_options) }}
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
      <template v-if="editorGroupSubscribesID >= 0"><p class="text-xl">编辑订阅</p></template>
      <template v-else><p class="text-xl">新建订阅</p></template>
    </template>

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

      <div class="flex gap-2 mt-2">
        <ToggleSwitch name="converter" />
        <p>订阅转换</p>
      </div>

      <div class="flex justify-end gap-2 mt-4">
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
import { type Ref, ref } from 'vue'

import type { FormResolverOptions, FormSubmitEvent } from '@primevue/forms/form'
import type { DataTablePageEvent, DataTableRowReorderEvent } from 'primevue/datatable'
import { useToast } from 'primevue/usetoast'

import ConverterForm from '@/components/ConverterForm.vue'
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
  groupID: number
}

const toast = useToast()
const props = defineProps<GroupSubscribesEditorProps>()

const groupSubscribes: Ref<APIBasicList<APIGroupSubscribes>> = ref({
  count: 0,
  next: null,
  previous: null,
  results: [],
})

// 分页
const tablePaginatorRows = ref(10)
const tablePaginatorFirst = ref(0)

// 编辑器对话框
const editorVisible = ref(false)
const editorInitialValues: Ref<APIGroupSubscribesEdit> = ref({
  name: '',
  url: '',
  converter: false,
  group: props.groupID,
  order: -1,
  date_created: '',
  converter_options: null,
})
const editorGroupSubscribesID: Ref<number> = ref(-1)

// 删除对话框
const deleteVisible = ref(false)
const deleteGroupSubscribesID: Ref<number> = ref(-1)

// 转换选项对话框
const converterVisible = ref(false)
const converterInitialValues: Ref<ConverterOptions> = ref({ ...converterDefaultOptions })
const converterGroupSubscribesID: Ref<number> = ref(-1)

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
  } else if (url.length > 150) {
    errors.url = [{ message: '上游订阅链接长度不得大于 150。' }]
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
    group: props.groupID,
    order: -1,
    date_created: '',
    converter_options: null,
  }
  editorGroupSubscribesID.value = -1
  editorVisible.value = true
}

/**
 * 打开修改编辑器
 * @param gs 原分组订阅
 */
const onEditorOpenEdit = (gs: APIGroupSubscribes) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...safeInitial } = gs
  editorInitialValues.value = { ...safeInitial }
  editorGroupSubscribesID.value = gs.id
  editorVisible.value = true
}

/**
 * 编辑器保存事件
 * @param event 事件
 */
const onEditorSave = async (event: FormSubmitEvent) => {
  if (event.valid) {
    if (editorGroupSubscribesID.value >= 0) {
      const values: APIGroupSubscribesEdit = {
        ...editorInitialValues.value,
        ...event.values,
      }
      await modifyGroupSubscribe(props.groupID, editorGroupSubscribesID.value, values, toast)
    } else {
      const values: APIGroupSubscribesEdit = {
        ...editorInitialValues.value,
        ...event.values,
        group: props.groupID,
        order: groupSubscribes.value.count + 1,
        date_created: new Date().toISOString(),
        converter_options: null,
      }
      await createGroupSubscribe(props.groupID, values, toast)
    }

    groupSubscribes.value = await fetchGroupSubscribes(
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
  deleteGroupSubscribesID.value = id
  deleteVisible.value = true
}

/** 删除 */
const onDeleteConfirm = async () => {
  await deleteGroupSubscribe(props.groupID, deleteGroupSubscribesID.value, toast)

  groupSubscribes.value = await fetchGroupSubscribes(
    props.groupID,
    tablePaginatorRows.value,
    tablePaginatorFirst.value,
    toast,
  )
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
      props.groupID,
      converterGroupSubscribesID.value,
      convertToApiOptions(event.values as ConverterOptions),
      toast,
    )

    groupSubscribes.value = await fetchGroupSubscribes(
      props.groupID,
      tablePaginatorRows.value,
      tablePaginatorFirst.value,
      toast,
    )
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
  groupSubscribes.value = await fetchGroupSubscribes(props.groupID, event.rows, event.first, toast)
}

/**
 * 重新排序事件
 * @param event 事件
 */
const onTableRowReorder = async (event: DataTableRowReorderEvent) => {
  const newList = moveByIndex(groupSubscribes.value.results, event.dragIndex, event.dropIndex)

  await reOrderSubscribes(props.groupID, newList, tablePaginatorFirst.value, toast)
  groupSubscribes.value = await fetchGroupSubscribes(
    props.groupID,
    tablePaginatorRows.value,
    tablePaginatorFirst.value,
    toast,
  )
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
groupSubscribes.value = await fetchGroupSubscribes(
  props.groupID,
  tablePaginatorRows.value,
  tablePaginatorFirst.value,
  toast,
)
</script>
