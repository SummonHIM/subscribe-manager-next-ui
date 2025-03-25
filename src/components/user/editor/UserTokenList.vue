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
          用户令牌
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
    <template #item.sid="{ item }">
      {{ item.sid }} ({{ searchSids[item.sid] }})
    </template>

    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template #item.actions="{ item }">
      <div class="d-flex ga-2">
        <v-icon
          color="medium-emphasis"
          icon="mdi-pencil"
          size="small"
          @click="edit(item.token)"
        />
  
        <v-icon
          color="medium-emphasis"
          icon="mdi-delete"
          size="small"
          @click="remove_confirm"
          @dblclick="remove(item.token)"
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
            {{ `${tableEditorDialog.isEditing ? '编辑' : '创建'}用户令牌` }}
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
            v-model="tableEditorDialog.whereRecord.token"
            :rules="userTokenRules.token"
            label="正在编辑该用户令牌"
            variant="outlined"
            readonly
          />
          <v-text-field
            v-model="tableEditorDialog.record.token"
            :rules="userTokenRules.token"
            label="用户令牌 *"
            variant="outlined"
            append-inner-icon="mdi-refresh"
            @click:append-inner="tableEditorDialog.record.token = uuid()"
          />
          <v-combobox
            v-model="tableEditorDialog.record.sid"
            :rules="userTokenRules.sid"
            label="分组订阅 ID *"
            variant="outlined"
            hint="输入订阅名称可搜索分组订阅 ID。"
            no-filter
            :items="searchSubscribeLists.ids"
            @input="handleSidSearch(tableEditorDialog.record.sid)"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <v-list-item-subtitle>{{ searchSubscribeLists.result.find(values => values.sid === item.value)?.name }}</v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-combobox>
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

import { userTokenRules } from '@/editorRules';
import { useNotifyerStore } from '@/stores/notifyer';
import type { TableItem, TableSort, UserToken, GroupSubscribes, TableEditorDialog } from '@/interfaces';

interface SearchResult<T> {
  result: T[]
  ids: string[]
}

const componentProps = defineProps<{
  tableFetch: ({ page, itemsPerPage, sortBy }: { page: number, itemsPerPage: number, sortBy: TableSort[] }) => Promise<[UserToken[], number]>
  submitAdd: (record: UserToken) => Promise<void>
  submitEdit: (record: UserToken, whereRecord: UserToken) => Promise<void>
  submitDelete: (ugid: string) => Promise<void>
  searchSid?: (uid: string) => Promise<string | undefined>
  searchSubscribes?: (like: string | null) => Promise<GroupSubscribes[]>
}>()

const notifyerStore = useNotifyerStore()
/** 表格内容 */
const tableItem: Ref<TableItem<UserToken>> = ref({
  table: [],
  length: 0,
  headers: [
    { key: "actions", title: "操作", minWidth: "85" },
    { key: "token", title: "令牌", sortable: true, minWidth: "300" },
    { key: "sid", title: "订阅 ID", sortable: true, minWidth: "300" },
  ],
  mainValue: "token",
  selected: [],
  sort: [],
  page: 1,
  itemsPerPage: 10
})
/** 表格编辑器 */
const tableEditorDialog: Ref<TableEditorDialog<UserToken>> = ref({
  open: false,
  submit: false,
  isEditing: false,
  error: false,
  record: {
    token: "",
    uid: "",
    sid: ""
  },
  whereRecord: {
    token: "",
    uid: "",
    sid: ""
  },
  defaultRecord: {
    token: "",
    uid: "",
    sid: ""
  }
})
/** 订阅 ID 搜索结果 */
const searchSids = ref<Record<string, string | undefined>>({});
/** 订阅名称搜索结果 */
const searchSubscribeLists: Ref<SearchResult<GroupSubscribes>> = ref({
  result: [],
  ids: []
})

/**
 * 获取表格内容
 * @param param0 表格参数
 */
async function fetch({ page, itemsPerPage, sortBy }: { page: number, itemsPerPage: number, sortBy: TableSort[] }) {
  const [result, count] = await componentProps.tableFetch({ page, itemsPerPage, sortBy })
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

/** 编辑 */
function edit(token: string) {
  tableEditorDialog.value.isEditing = true
  const found = tableItem.value.table.find(value => value.token === token)
  
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

/** 删除 */
async function remove(token: string) {
  await componentProps.submitDelete(token)
  fetch({page: tableItem.value.page, itemsPerPage: tableItem.value.itemsPerPage, sortBy: tableItem.value.sort})
}

/** 对话框提交 */
async function dialogSubmit() {
  try {
    if (tableEditorDialog.value.isEditing) {
      await componentProps.submitEdit(tableEditorDialog.value.record, tableEditorDialog.value.whereRecord)
    } else {
      await componentProps.submitAdd(tableEditorDialog.value.record)
    }
    tableEditorDialog.value.open = false
    tableEditorDialog.value.error = false
  } catch {
    tableEditorDialog.value.error = true
  } finally {
    fetch({page: tableItem.value.page, itemsPerPage: tableItem.value.itemsPerPage, sortBy: tableItem.value.sort})
  }
}

/** 处理搜索用户 ID */
async function handleSidSearch(like: string | null) {
  if (componentProps.searchSubscribes !== undefined && like !== null && like.length < 24) {
    const result = await componentProps.searchSubscribes(like)
    searchSubscribeLists.value.result = result
    searchSubscribeLists.value.ids = result.map((item) => item.sid)
  }
}

/** 获取表格各 ID 的名称 */
watchEffect(() => {
  for (const row of tableItem.value.table) {
    if (searchSids.value[row.sid]) continue;

    if (componentProps.searchSid !== undefined) {
      componentProps.searchSid(row.sid).then((res) => {
        searchSids.value[row.sid] = res;
      });
    }
    break;
  }
});
</script>