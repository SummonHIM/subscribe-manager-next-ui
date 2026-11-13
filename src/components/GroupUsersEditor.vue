<template>
  <DataTable
    :value="groupUsers.results"
    :rows="tablePaginatorRows"
    :first="tablePaginatorFirst"
    :totalRecords="groupUsers.count"
    :rowsPerPageOptions="[10, 20, 50, 100]"
    v-model:editingRows="editingRows"
    editMode="row"
    @page="onTablePaginatorChange"
    @row-dblclick="onRowDblClick"
    dataKey="id"
    size="small"
    paginator
    lazy
    class="user-table"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="section-title">分组用户</span>
        <div class="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
          <InputText
            v-model="search"
            placeholder="搜索用户名或邮箱"
            size="small"
            class="w-full min-w-0 sm:w-52"
            aria-label="搜索用户"
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
          </div>
        </div>
      </div>
    </template>

    <template #empty>
      <div class="py-10 text-center text-sm text-neutral-400 dark:text-neutral-500">
        {{ search.trim() ? '没有匹配的结果' : '暂无数据' }}
      </div>
    </template>

    <Column field="username" header="用户" style="width: 100%">
      <template #body="slotProps">
        <div class="min-w-0">
          <div class="truncate font-medium text-neutral-900 dark:text-neutral-100">
            {{ slotProps.data.username }}
          </div>
          <div class="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
            ID {{ slotProps.data.user }} ·
            {{ slotProps.data.admin ? '管理员' : '普通成员' }}
          </div>
        </div>
      </template>
    </Column>
    <Column field="expire" header="过期日" style="width: 23rem">
      <template #body="slotProps">
        <span class="block truncate" :title="new Date(slotProps.data.expire).toLocaleString()">
          {{ new Date(slotProps.data.expire).toLocaleString() }}
        </span>
      </template>
      <template #editor="{ data }">
        <div class="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <DatePicker
            :modelValue="new Date(data.expire)"
            dateFormat="yy/mm/dd"
            hourFormat="24"
            showSeconds
            showTime
            size="small"
            class="w-full min-w-0 sm:w-48"
            @update:modelValue="(value) => onExpirePicked(data, value)"
          />
          <Select
            v-model="pickedSubscribe"
            :options="subscribeOptions"
            optionLabel="name"
            optionValue="id"
            placeholder="按订阅设置"
            size="small"
            class="w-full min-w-0 sm:w-40"
            :loading="expireLoading"
            aria-label="按订阅设置过期日"
            @change="onApplySubscribeExpire(data)"
          />
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
              aria-label="编辑过期日"
              @click="startEdit(slotProps.data)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              variant="text"
              rounded
              size="small"
              aria-label="删除分组用户"
              @click="onOpenDeleteDialog(slotProps.data.id)"
            />
          </template>
        </div>
      </template>
    </Column>
  </DataTable>

  <Dialog v-model:visible="deleteVisible" modal :style="{ width: '30rem' }" header="删除确认">
    <p>确定要删除该分组用户吗？</p>

    <template #footer>
      <Button label="取消" icon="pi pi-times" text @click="deleteVisible = false" />
      <Button label="确定" icon="pi pi-check" @click="onDeleteConfirm" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { type Ref, onMounted, onUnmounted, ref, watch } from 'vue'

import type { DataTablePageEvent, DataTableRowDoubleClickEvent } from 'primevue/datatable'
import { useToast } from 'primevue/usetoast'

import {
  deleteGroupUser,
  fetchGroupSubscribes,
  fetchGroupSubscribesUsage,
  fetchGroupUsers,
  modifyGroupUser,
} from '@/groups'
import type { APIBasicList, APIGroupUsers } from '@/interfaces'

interface GroupUserEditorProps {
  groupId: number
}

interface SubscribeOption {
  id: number
  name: string
}

const toast = useToast()
const props = defineProps<GroupUserEditorProps>()
const emit = defineEmits<{
  (e: 'editing-state', value: boolean): void
}>()

const groupUsers: Ref<APIBasicList<APIGroupUsers>> = ref({
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
const editingRows: Ref<APIGroupUsers[]> = ref([])

// 通知父组件是否有未保存的编辑
watch(editingRows, (rows) => emit('editing-state', rows.length > 0))

// 订阅过期日快捷填充
const subscribeOptions: Ref<SubscribeOption[]> = ref([])
const pickedSubscribe: Ref<number | null> = ref(null)
const expireLoading = ref(false)

// 删除对话框
const deleteVisible = ref(false)
const deleteGroupUserID: Ref<number> = ref(-1)

/** 刷新表格 */
const onRefreshTable = async () => {
  editingRows.value = []
  groupUsers.value = await fetchGroupUsers(
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
let editSnapshot: APIGroupUsers | null = null

/**
 * 该行是否正在编辑
 * @param row 行数据
 */
const isEditing = (row: APIGroupUsers) => {
  return editingRows.value.some((item) => item.id === row.id)
}

/**
 * 开始编辑某一行
 * @param row 行数据
 */
const startEdit = (row: APIGroupUsers) => {
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
const saveRow = async (row: APIGroupUsers) => {
  const { id } = row

  await modifyGroupUser(props.groupId, id, { expire: new Date(row.expire) }, toast)
  editSnapshot = null
  editingRows.value = editingRows.value.filter((item) => item.id !== id)
  await onRefreshTable()
}

/**
 * 取消行内编辑并还原
 * @param row 正在编辑的行
 */
const cancelRow = (row: APIGroupUsers) => {
  if (editSnapshot) Object.assign(row, editSnapshot)
  editSnapshot = null
  editingRows.value = editingRows.value.filter((item) => item.id !== row.id)
}

/**
 * 日期选择器回填
 * @param row 正在编辑的行
 * @param value 新日期
 */
const onExpirePicked = (
  row: APIGroupUsers,
  value: Date | Date[] | (Date | null)[] | null | undefined,
) => {
  if (value instanceof Date) {
    row.expire = value.toISOString()
  }
}

/**
 * 用选中订阅的过期日填充当前行
 * @param row 正在编辑的行
 */
const onApplySubscribeExpire = async (row: APIGroupUsers) => {
  const subscribeID = pickedSubscribe.value
  if (!subscribeID) return

  expireLoading.value = true
  try {
    const usage = await fetchGroupSubscribesUsage(props.groupId, subscribeID)

    if (usage.expire) {
      row.expire = new Date(usage.expire * 1000).toISOString()
      toast.add({
        severity: 'success',
        summary: '已按订阅设置过期日',
        life: 2000,
      })
    } else {
      toast.add({
        severity: 'warn',
        summary: '该订阅没有返回过期时间',
        life: 3000,
      })
    }
  } finally {
    expireLoading.value = false
    pickedSubscribe.value = null
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
  editingRows.value = []
  groupUsers.value = await fetchGroupUsers(
    props.groupId,
    event.rows,
    event.first,
    toast,
    search.value,
  )
}

/** 加载订阅列表，供“按订阅设置”使用 */
const loadSubscribeOptions = async () => {
  const subscribes = await fetchGroupSubscribes(props.groupId, 10, 0, toast)
  subscribeOptions.value = subscribes.results.map((item) => ({
    id: item.id,
    name: item.name,
  }))
}

// 初始化
onMounted(async () => {
  await Promise.all([onRefreshTable(), loadSubscribeOptions()])
})

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
})
</script>
