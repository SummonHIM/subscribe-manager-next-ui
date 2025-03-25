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
  
          {{ title }}
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
    <template #item.uid="{ item }">
      {{ item.uid }} ({{ searchUids[item.uid] }})
    </template>

    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template #item.gid="{ item }">
      {{ item.gid }} ({{ searchGids[item.gid] }})
    </template>

    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template #item.admin="{ item }">
      {{ item.admin ? '√ 是' : '× 否' }}
    </template>
  
    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template #item.actions="{ item }">
      <div class="d-flex ga-2">
        <v-icon
          color="medium-emphasis"
          icon="mdi-pencil"
          size="small"
          @click="edit(item.ugid)"
        />
  
        <v-icon
          color="medium-emphasis"
          icon="mdi-delete"
          size="small"
          @click="remove_confirm"
          @dblclick="remove(item.ugid)"
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
            {{ `${tableEditorDialog.isEditing ? '编辑' : '创建'}${title}` }}
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
            v-model="tableEditorDialog.whereRecord.ugid"
            :rules="userGroupRules.ugid"
            label="正在编辑该用户分组 ID"
            variant="outlined"
            readonly
          />
          <v-text-field
            v-model="tableEditorDialog.record.ugid"
            :rules="userGroupRules.ugid"
            label="用户分组 ID *"
            variant="outlined"
            append-inner-icon="mdi-refresh"
            @click:append-inner="tableEditorDialog.record.ugid = uuid()"
          />
          <v-combobox
            v-if="componentProps.type === 'inGroup'"
            v-model="tableEditorDialog.record.uid"
            :rules="userGroupRules.uid"
            label="用户 ID *"
            variant="outlined"
            hint="输入用户名可搜索用户 ID。"
            no-filter
            :items="searchUserLists.ids"
            @input="handleUidSearch(tableEditorDialog.record.uid)"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <v-list-item-subtitle>{{ searchUserLists.result.find(values => values.uid === item.value)?.username }}</v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-combobox>
          <v-combobox
            v-if="componentProps.type === 'inUser'"
            v-model="tableEditorDialog.record.gid"
            :rules="userGroupRules.gid"
            label="分组 ID *"
            variant="outlined"
            hint="输入分组名称可搜索分组 ID。"
            no-filter
            :items="searchGroupLists.ids"
            @input="handleGidSearch(tableEditorDialog.record.gid)"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <v-list-item-subtitle>{{ searchGroupLists.result.find(values => values.gid === item.value)?.name }}</v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-combobox>
          <v-text-field
            v-model="tableEditorDialog.record.expire"
            label="过期日"
            variant="outlined"
            type="datetime-local"
            append-inner-icon="mdi-plus"
            @click:append-inner="tableEditorDialog.record.expire = format(getNextMonth(tableEditorDialog.record.expire), 'yyyy-MM-dd\'T\'HH:mm:ss')"
          />
          <v-switch
            v-if="componentProps.root"
            v-model="tableEditorDialog.record.admin"
            label="分组管理员"
            color="primary"
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
import { format } from 'date-fns';
import { v4 as uuid } from 'uuid';

import { getNextMonth } from '@/dateTime';
import { userGroupRules } from '@/editorRules';
import { useNotifyerStore } from '@/stores/notifyer';
import type { Users, Groups, UserGroups, TableItem, TableSort, TableEditorDialog } from '@/interfaces';

/** 搜索结果 */
interface SearchResult<T> {
  result: T[]
  ids: string[]
}

const componentProps = defineProps<{
  type: 'inUser' | 'inGroup'
  root: boolean
  tableFetch: ({ page, itemsPerPage, sortBy }: { page: number, itemsPerPage: number, sortBy: TableSort[] }) => Promise<[UserGroups[], number]>
  submitAdd: (record: UserGroups) => Promise<void>
  submitEdit: (record: UserGroups, whereRecord: UserGroups) => Promise<void>
  submitDelete: (ugid: string) => Promise<void>
  searchUid?: (uid: string) => Promise<string | undefined>
  searchUsers?: (like: string | null) => Promise<Users[]>
  searchGid?: (gid: string) => Promise<string | undefined>
  searchGroups?: (like: string | null) => Promise<Groups[]>
}>()

/** 表格标题 */
const title = computed(() =>{
  switch(componentProps.type) {
    case 'inUser': return "用户分组"
    case 'inGroup': return "分组用户"
  }
});

const notifyerStore = useNotifyerStore()
/** 表格内容 */
const tableItem: Ref<TableItem<UserGroups>> = ref({
  table: [],
  length: 0,
  headers: [
    { key: "actions", title: "操作", minWidth: "85" },
    { key: "ugid", title: "用户分组 ID", sortable: true, minWidth: "300" },
    ...(componentProps.type === 'inGroup' ? [{ key: "uid", title: "用户 ID", sortable: true, minWidth: "350" }] : []),
    ...(componentProps.type === 'inUser' ? [{ key: "gid", title: "分组 ID", sortable: true, minWidth: "350" }] : []),
    { key: "expire", title: "过期日", sortable: true, minWidth: "165" },
    ...(componentProps.root ? [{ key: "admin", title: "分组管理员", sortable: true, minWidth: "125" }] : [])
  ],
  mainValue: "ugid",
  selected: [],
  sort: [],
  page: 1,
  itemsPerPage: 10
})
/** 表格编辑器 */
const tableEditorDialog: Ref<TableEditorDialog<UserGroups>> = ref({
  open: false,
  submit: false,
  isEditing: false,
  error: false,
  record: {
    ugid: "",
    uid: "",
    gid: "",
    expire: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    admin: false
  },
  whereRecord: {
    ugid: "",
    uid: "",
    gid: "",
    expire: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    admin: false
  },
  defaultRecord: {
    ugid: "",
    uid: "",
    gid: "",
    expire: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    admin: false
  }
})

/** 用户 ID 搜索结果 */
const searchUids = ref<Record<string, string | undefined>>({});
/** 用户名搜索结果 */
const searchUserLists: Ref<SearchResult<Users>> = ref({
  result: [],
  ids: []
})

/** 分组 ID 搜索结果 */
const searchGids = ref<Record<string, string | undefined>>({});
/** 分组名搜索结果 */
const searchGroupLists: Ref<SearchResult<Groups>> = ref({
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
function edit(ugid: string) {
  tableEditorDialog.value.isEditing = true
  const found = tableItem.value.table.find(subscribes => subscribes.ugid === ugid)
  
  if (found) {
    tableEditorDialog.value.record = {
      ...found,
      expire: format(found.expire, 'yyyy-MM-dd\'T\'HH:mm:ss')
    }
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
async function remove(sid: string) {
  await componentProps.submitDelete(sid)
  fetch({page: tableItem.value.page, itemsPerPage: tableItem.value.itemsPerPage, sortBy: tableItem.value.sort})
}

/** 编辑器提交 */
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
async function handleUidSearch(like: string | null) {
  if (componentProps.searchUsers !== undefined && like !== null && like.length < 24) {
    const result = await componentProps.searchUsers(like)
    searchUserLists.value.result = result
    searchUserLists.value.ids = result.map((item) => item.uid)
  }
}

/** 处理搜索分组 ID */
async function handleGidSearch(like: string | null) {
  if (componentProps.searchGroups !== undefined && like !== null && like.length < 24) {
    const result = await componentProps.searchGroups(like)
    searchGroupLists.value.result = result
    searchGroupLists.value.ids = result.map((item) => item.gid)
  }
}

/** 获取表格各 ID 的名称 */
watchEffect(() => {
  for (const row of tableItem.value.table) {
    switch (componentProps.type) {
      case 'inUser':
        if (searchGids.value[row.gid]) continue;

        if (componentProps.searchGid !== undefined) {
          componentProps.searchGid(row.gid).then((res) => {
            searchGids.value[row.gid] = res;
          });
        }
        break;
      case 'inGroup':
        if (searchUids.value[row.uid]) continue;

        if (componentProps.searchUid !== undefined) {
          componentProps.searchUid(row.uid).then((res) => {
            searchUids.value[row.uid] = res;
          });
        }
        break;
    }
  }
});
</script>