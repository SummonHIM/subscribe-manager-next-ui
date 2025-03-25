<template>
  <v-data-table-server
    v-model="tableItem.selected"
    v-model:page="tableItem.page"
    v-model:sort-by="tableItem.sort"
    v-model:items-per-page="tableItem.itemsPerPage"
    :headers="tableItem.headers"
    :items="tableItem.table"
    :items-length="tableItem.length"
    :item-value="tableItem.mainValue"
    multi-sort
    page-text="{0}-{1} / {2}"
    no-data-text="暂无数据"
    loading-text="正在加载…"
    items-per-page-text="每页显示："
    :items-per-page-options="[10, 25, 50, 100]"
    @update:options="fetch"
  >
    <template #top>
      <v-toolbar flat>
        <v-toolbar-title>
          <v-icon
            color="medium-emphasis"
            icon="mdi-database"
            size="x-small"
            start
          />

          共享账号
        </v-toolbar-title>

        <v-spacer />

        <v-btn
          class="me-2"
          prepend-icon="mdi-plus"
          rounded="lg"
          text="创建"
          border
          @click="add"
        />
      </v-toolbar>
    </template>

    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template #item.actions="{ item }">
      <div class="d-flex ga-2">
        <v-icon
          color="medium-emphasis"
          icon="mdi-pencil"
          size="small"
          @click="edit(item.gsid)"
        />

        <v-icon
          color="medium-emphasis"
          icon="mdi-delete"
          size="small"
          @click="remove_confirm"
          @dblclick="remove(item.gsid)"
        />
      </div>
    </template>
  </v-data-table-server>

  <v-dialog
    v-model="tableEditorDialog.open"
    max-width="800"
  >
    <v-card>
      <v-form
        v-model="tableEditorDialog.submit"
        fast-fail
        @submit.prevent="dialogSubmit"
      >
        <v-toolbar>
          <v-toolbar-title>
            {{ `${tableEditorDialog.isEditing ? '编辑' : '创建'}分组共享账号` }}
          </v-toolbar-title>

          <v-spacer />

          <v-btn
            icon="mdi-close"
            @click="tableEditorDialog.open = false"
          />
        </v-toolbar>

        <v-card-text>
          <v-text-field
            v-if="tableEditorDialog.isEditing"
            v-model="tableEditorDialog.whereRecord.gsid"
            :rules="shareRules.gsid"
            label="正在编辑该分组共享账号 ID"
            variant="outlined"
            readonly
          />
          <v-text-field
            v-model="tableEditorDialog.record.gsid"
            :rules="shareRules.gsid"
            label="分组共享账号 ID *"
            variant="outlined"
            append-inner-icon="mdi-refresh"
            @click:append-inner="tableEditorDialog.record.gsid = uuid()"
          />
          <v-text-field
            v-model="tableEditorDialog.record.name"
            :rules="shareRules.name"
            label="名称 *"
            variant="outlined"
          />
          <v-text-field
            v-model="tableEditorDialog.record.account"
            :rules="shareRules.account"
            label="账号 *"
            variant="outlined"
          />
          <v-text-field
            v-model="tableEditorDialog.record.password"
            :rules="shareRules.password"
            label="密码 *"
            variant="outlined"
          />
          <v-text-field
            v-model="tableEditorDialog.record.manage"
            :rules="shareRules.manage"
            label="官网 *"
            variant="outlined"
          />
          <v-text-field
            v-model="tableEditorDialog.record.aff"
            :rules="shareRules.aff"
            label="邀请码"
            variant="outlined"
          />
          <v-text-field
            v-if="$props.root"
            v-model="tableEditorDialog.record.create_date"
            label="创建日期"
            variant="outlined"
            type="datetime-local"
          />
        </v-card-text>

        <v-divider />

        <v-card-actions class="bg-surface-light">
          <v-btn
            text="取消"
            variant="plain"
            @click="tableEditorDialog.open = false"
          />

          <v-spacer />

          <v-btn
            text="保存"
            type="submit"
            :disabled="!tableEditorDialog.submit"
          />
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { v4 as uuid } from 'uuid';

import { shareRules } from '@/editorRules';
import { useNotifyerStore } from '@/stores/notifyer';
import type { TableItem, TableSort, GroupShare, TableEditorDialog } from '@/interfaces';

const notifyerStore = useNotifyerStore()
/** 表格内容 */
const tableItem: Ref<TableItem<GroupShare>> = ref({
  table: [],
  length: 0,
  headers: [
    { key: "actions", title: "操作", minWidth: "85" },
    { key: "gsid", title: "分组共享账号 ID", sortable: true, minWidth: "300" },
    // { key: "gid", title: "分组 ID", sortable: true, minWidth: "300" },
    { key: "name", title: "账号名称", sortable: true, minWidth: "250" },
    { key: "account", title: "账号", sortable: true, minWidth: "250" },
    { key: "password", title: "密码", sortable: true, minWidth: "250" },
    { key: "manage", title: "官网", sortable: true, minWidth: "250" },
    { key: "aff", title: "邀请码", sortable: true, minWidth: "500" },
    { key: "create_date", title: "创建日期", sortable: true, minWidth: "165" },
  ],
  mainValue: "gsid",
  selected: [],
  sort: [{key: "create_date", order: "asc"}],
  page: 1,
  itemsPerPage: 10
})
/** 表格编辑器 */
const tableEditorDialog: Ref<TableEditorDialog<GroupShare>> = ref({
  open: false,
  submit: false,
  isEditing: false,
  error: false,
  record: {
    gsid: "",
    gid: "",
    name: "",
    account: "",
    password: "",
    manage: "",
    aff: "",
    create_date: new Date()
  },
  whereRecord: {
    gsid: "",
    gid: "",
    name: "",
    account: "",
    password: "",
    manage: "",
    aff: "",
    create_date: new Date()
  },
  defaultRecord: {
    gsid: "",
    gid: "",
    name: "",
    account: "",
    password: "",
    manage: "",
    aff: "",
    create_date: new Date()
  }
})

/**
 * 获取表格内容
 * @param param0 表格参数
 */
async function fetch({ page, itemsPerPage, sortBy }: { page: number, itemsPerPage: number, sortBy: TableSort[] }) {
  const [result, count] = await tableFetch({ page, itemsPerPage, sortBy })
  tableItem.value.table = result
  tableItem.value.length = count
}

/** 添加 */
function add() {
  tableEditorDialog.value.isEditing = false
  tableEditorDialog.value.record = { ...tableEditorDialog.value.defaultRecord }
  tableEditorDialog.value.whereRecord = { ...tableEditorDialog.value.defaultRecord }
  tableEditorDialog.value.open = true
}

/**
 * 编辑
 * @param gsid 分组共享账号 ID
 */
function edit(gsid: string) {
  tableEditorDialog.value.isEditing = true
  const found = tableItem.value.table.find(subscribes => subscribes.gsid === gsid)

  if (found) {
    tableEditorDialog.value.record = { ...found }
    tableEditorDialog.value.whereRecord = { ...found }
  }
  
  tableEditorDialog.value.open = true
}

/** 删除确认 */
function remove_confirm() {
  notifyerStore.message = "请双击来确认删除。"
  notifyerStore.open = true
}

/**
 * 删除
 * @param sid 分组共享账号 ID
 */
async function remove(sid: string) {
  await submitDelete(sid)
  fetch({page: tableItem.value.page, itemsPerPage: tableItem.value.itemsPerPage, sortBy: tableItem.value.sort})
}

/** 编辑器提交 */
async function dialogSubmit() {
  try {
    if (tableEditorDialog.value.isEditing) {
      await submitEdit(tableEditorDialog.value.record, tableEditorDialog.value.whereRecord)
    } else {
      await submitAdd(tableEditorDialog.value.record)
    }
    tableEditorDialog.value.open = false
    tableEditorDialog.value.error = false
  } catch {
    tableEditorDialog.value.error = true
  } finally {
    fetch({page: tableItem.value.page, itemsPerPage: tableItem.value.itemsPerPage, sortBy: tableItem.value.sort})
  }
}

const { tableFetch, submitAdd, submitEdit, submitDelete } = defineProps<{
  root: boolean
  tableFetch: ({ page, itemsPerPage, sortBy }: { page: number, itemsPerPage: number, sortBy: TableSort[] }) => Promise<[GroupShare[], number]>
  submitAdd: (record: GroupShare) => Promise<void>
  submitEdit: (record: GroupShare, whereRecord: GroupShare) => Promise<void>
  submitDelete: (sid: string) => Promise<void>
}>()
</script>