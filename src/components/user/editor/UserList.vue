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
          用户
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
    <template #item.root="{ item }">
      {{ item.root ? '√ 是' : '× 否' }}
    </template>
  
    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template #item.actions="{ item }">
      <div class="d-flex ga-2">
        <v-icon
          color="medium-emphasis"
          icon="mdi-pencil"
          size="small"
          @click="edit(item.uid)"
        />
  
        <v-icon
          color="medium-emphasis"
          icon="mdi-delete"
          size="small"
          @click="remove_confirm"
          @dblclick="remove(item)"
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
            {{ `${tableEditorDialog.isEditing ? '编辑' : '创建'}用户` }}
          </v-toolbar-title>
  
          <v-spacer />
  
          <v-btn
            icon="mdi-close"
            @click="tableEditorDialog.open = false"
          />
        </v-toolbar>
  
        <v-card-text>
          <v-text-field
            v-model="tableEditorDialog.record.uid"
            :rules="userRules.uid"
            label="用户 ID *"
            variant="outlined"
            append-inner-icon="mdi-refresh"
            @click:append-inner="tableEditorDialog.record.uid = uuid()"
          />
          <v-text-field
            v-model="tableEditorDialog.record.username"
            :rules="userRules.username"
            label="用户名 *"
            variant="outlined"
          />
          <v-switch
            v-model="tableEditorDialog.record.root"
            label="超级管理员"
            color="primary"
          />
          <v-text-field
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
import { format } from 'date-fns';
import { v4 as uuid } from 'uuid';
import axios, { AxiosError } from 'axios';
  
import { userRules } from '@/editorRules';
import { useNotifyerStore } from '@/stores/notifyer';
import type { Users, ReturnMessage, ReturnResult, TableEditorDialog, TableItem, TableSort } from '@/interfaces';

const router = useRouter()
const notifyerStore = useNotifyerStore()
/** 表格内容 */
const tableItem: Ref<TableItem<Users>> = ref({
  table: [],
  length: 0,
  headers: [
    { key: "actions", title: "操作", minWidth: "85" },
    { key: "uid", title: "分组 ID", sortable: true, minWidth: "300" },
    { key: "username", title: "订阅名称", sortable: true, minWidth: "215" },
    { key: "root", title: "超级管理员", sortable: true, minWidth: "125" },
    { key: "create_date", title: "创建日期", sortable: true, minWidth: "165" }
  ],
  mainValue: "uid",
  selected: [],
  sort: [{key: "create_date", order: "asc"}],
  page: 1,
  itemsPerPage: 10
})
/** 表格编辑器 */
const tableEditorDialog: Ref<TableEditorDialog<Users>> = ref({
  open: false,
  submit: false,
  isEditing: false,
  error: false,
  record: {
    uid: "",
    username: "",
    root: false,
    create_date: new Date()
  },
  whereRecord: {
    uid: "",
    username: "",
    root: false,
    create_date: new Date()
  },
  defaultRecord: {
    uid: "",
    username: "",
    root: false,
    create_date: new Date()
  }
})

/**
 * 获取表格内容
 * @param param0 表格参数
 */
async function fetch({ page, itemsPerPage, sortBy }: { page: number, itemsPerPage: number, sortBy: TableSort[] }) {
  const sortString = `&sort=${sortBy.map(({ key, order }) => `${key}:${order}`).join(",")}`
  
  try {
    const response = await axios.get<ReturnResult<Users>>(`/api/v2/root/users?limit=${itemsPerPage}&offset=${((page - 1) * itemsPerPage)}${sortString}`)
    if (response.data.status === 200) {
      tableItem.value.table = response.data.result
      tableItem.value.length = response.data.count
    }
  } catch (error) {
    const axiosError = error as AxiosError<ReturnMessage>
    if (axiosError.response && axiosError.response.data.message) {
      notifyerStore.message = `获取订阅时发生错误。${axiosError.response.data.message}`
    } else {
      notifyerStore.message = "获取订阅时发生错误。详情请查看开发者日志。"
      console.error(error)
    }
    notifyerStore.open = true
  }
}

/** 添加 */
function add() {
  tableEditorDialog.value.isEditing = false
  tableEditorDialog.value.record = { ...tableEditorDialog.value.defaultRecord }
  tableEditorDialog.value.whereRecord = { ...tableEditorDialog.value.defaultRecord }
  tableEditorDialog.value.open = true
}

/** 编辑 */
function edit(uid: string) {
  router.push(`/root/user?uid=${uid}`)
}

/** 编辑器提交 */
async function dialogSubmit() {
  const data = [{ 
    ...tableEditorDialog.value.record,
    create_date: format(tableEditorDialog.value.record.create_date!, 'yyyy-MM-dd HH:mm:ss')
  }]
  
  await axios.post<ReturnMessage>(`/api/v2/root/users`, data)
    .then(response => {
      notifyerStore.message = response.data.message
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `提交数据时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "提交数据时发生错误。详情请查看开发者日志。"
        console.error(error)
      }
    })
  notifyerStore.open = true
  
  fetch({page: tableItem.value.page, itemsPerPage: tableItem.value.itemsPerPage, sortBy: tableItem.value.sort})
}

/** 删除确认 */
function remove_confirm() {
  notifyerStore.message = "请双击来确认删除。"
  notifyerStore.open = true
}

/** 删除 */
async function remove(user: Users) {
  await axios.delete<ReturnMessage>(`/api/v2/root/user?where_uid=${user.uid}&where_username=${user.username}`)
    .then(response => {
      notifyerStore.message = response.data.message
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `删除数据时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "删除数据时发生错误。详情请查看开发者日志。"
        console.error(error)
      }
    })
  notifyerStore.open = true
  
  fetch({page: tableItem.value.page, itemsPerPage: tableItem.value.itemsPerPage, sortBy: tableItem.value.sort})
}
</script>