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

          订阅
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
          @click="edit(item.sid)"
        />

        <v-icon
          color="medium-emphasis"
          icon="mdi-delete"
          size="small"
          @click="remove_confirm"
          @dblclick="remove(item.sid)"
        />
      </div>
    </template>

    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template #item.converter="{ item }">
      {{ item.converter ? '√ 开启' : '× 关闭' }}
    </template>

    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template #item.converter_options="{ item }">
      {{ readableConverterOption(item.converter_options) }}
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
            {{ `${tableEditorDialog.isEditing ? '编辑' : '创建'}分组订阅` }}
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
            v-model="tableEditorDialog.whereRecord.sid"
            :rules="subscribeRules.sid"
            label="正在编辑该分组订阅 ID"
            variant="outlined"
            readonly
          />
          <v-text-field
            v-model="tableEditorDialog.record.sid"
            :rules="subscribeRules.sid"
            label="分组订阅 ID *"
            variant="outlined"
            append-inner-icon="mdi-refresh"
            @click:append-inner="tableEditorDialog.record.sid = uuid()"
          />
          <v-text-field
            v-model="tableEditorDialog.record.name"
            :rules="subscribeRules.name"
            label="名称 *"
            variant="outlined"
          />
          <v-text-field
            v-model="tableEditorDialog.record.url"
            :rules="subscribeRules.url"
            label="订阅链接 *"
            variant="outlined"
          />
          <v-text-field
            v-model="tableEditorDialog.record.order"
            type="number"
            :rules="subscribeRules.order"
            label="排序 *"
            variant="outlined"
          />
          <v-switch
            v-model="tableEditorDialog.record.converter"
            label="开启转换"
            color="primary"
          />

          <v-expansion-panels
            class="mt-4 mb-4 mt-sm-0"
            :disabled="!tableEditorDialog.isEditing"
          >
            <v-expansion-panel :title="!tableEditorDialog.isEditing ? '请先创建' : '自定义'">
              <v-expansion-panel-text>
                <div
                  v-for="(fields, category) in converterForm"
                  :key="category"
                >
                  <p class="text-grey-darken-1">
                    {{ category }}
                  </p>
                  <v-divider class="mb-5" />
                  <v-row>
                    <v-col
                      v-for="(config, key) in fields"
                      :key="key"
                      cols="0"
                      :sm="config.cols"
                    >
                      <v-tooltip
                        v-if="config.type === 'text'"
                        location="bottom"
                      >
                        <template #activator="{ props: tooltipProps }">
                          <v-text-field
                            v-bind="tooltipProps"
                            v-model="tableEditorDialog.record.converter_options[key as keyof ConverterOptions]"
                            :label="config.label"
                            variant="outlined"
                          />
                        </template>
                        <span>
                          <pre>{{ key }}</pre> {{ config.tooltip }}
                        </span>
                      </v-tooltip>
                      <v-tooltip
                        v-else-if="config.type === 'switch'"
                        location="bottom"
                      >
                        <template #activator="{ props: tooltipProps }">
                          <v-switch
                            v-bind="tooltipProps"
                            v-model="tableEditorDialog.record.converter_options[key as keyof ConverterOptions]"
                            :label="config.label"
                            color="primary"
                          />
                        </template>
                        <span>
                          <pre>{{ key }}</pre> {{ config.tooltip }}
                        </span>
                      </v-tooltip>
                      <v-tooltip
                        v-else-if="config.type === 'textarea'"
                        location="bottom"
                      >
                        <template #activator="{ props: tooltipProps }">
                          <v-textarea
                            v-bind="tooltipProps"
                            v-model="tableEditorDialog.record.converter_options[key as keyof ConverterOptions]"
                            :label="config.label"
                            variant="outlined"
                          />
                        </template>
                        <span>
                          <pre>{{ key }}</pre> {{ config.tooltip }}
                        </span>
                      </v-tooltip>
                      <v-tooltip
                        v-else-if="config.type === 'target-combobox'"
                        location="bottom"
                      >
                        <template #activator="{ props: tooltipProps }">
                          <v-combobox
                            v-bind="tooltipProps"
                            v-model="tableEditorDialog.record.converter_options.target"
                            :items="['auto', 'clash', 'clashr', 'quan', 'quanx', 'loon', 'mellow', 'ss', 'sssub', 'ssd', 'ssr', 'surfboard', 'surge', 'trojan', 'v2ray', 'singbox', 'mixed']"
                            :label="config.label"
                            no-data-text="暂无数据"
                            variant="outlined"
                          />
                        </template>
                        <span>
                          <pre>{{ key }}</pre> {{ config.tooltip }}
                        </span>
                      </v-tooltip>
                      <p v-else>
                        维护中！尽情期待。
                      </p>
                    </v-col>
                  </v-row>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
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

import { subscribeRules } from '@/editorRules';
import { useNotifyerStore } from '@/stores/notifyer';
import { converterForm ,defaultConverterOptions } from '@/converter';
import type { TableItem, GroupSubscribes, TableSort, TableEditorDialog, ConverterOptions } from '@/interfaces';

const notifyerStore = useNotifyerStore()
/** 表格内容 */
const tableItem: Ref<TableItem<GroupSubscribes>> = ref({
  table: [],
  length: 0,
  headers: [
    { key: "actions", title: "操作", minWidth: "85" },
    { key: "order", title: "排序", sortable: true, minWidth: "105" },
    { key: "sid", title: "分组订阅 ID", sortable: true, minWidth: "300" },
    // { key: "gid", title: "分组 ID", sortable: true, minWidth: "300" },
    { key: "name", title: "订阅名称", sortable: true, minWidth: "215" },
    { key: "url", title: "订阅链接", sortable: true, minWidth: "750" },
    { key: "converter", title: "订阅转换", sortable: true, minWidth: "110" },
    { key: "converter_options", title: "转换选项", sortable: true, minWidth: "250" },
  ],
  mainValue: "sid",
  selected: [],
  sort: [{key: "order", order: "asc"}],
  page: 1,
  itemsPerPage: 10
})
/** 表格编辑器 */
const tableEditorDialog: Ref<TableEditorDialog<GroupSubscribes>> = ref({
  open: false,
  submit: false,
  isEditing: false,
  error: false,
  record: {
    sid: "",
    gid: "",
    order: 255,
    name: "",
    url: "",
    converter: true,
    converter_options: defaultConverterOptions
  },
  whereRecord: {
    sid: "",
    gid: "",
    order: 255,
    name: "",
    url: "",
    converter: true,
    converter_options: defaultConverterOptions
  },
  defaultRecord: {
    sid: "",
    gid: "",
    order: 255,
    name: "",
    url: "",
    converter: true,
    converter_options: defaultConverterOptions
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

/** 编辑 */
function edit(sid: string) {
  tableEditorDialog.value.isEditing = true
  const found = tableItem.value.table.find(subscribes => subscribes.sid === sid)

  if (found) {
    tableEditorDialog.value.record = {
      ...found,
      converter_options: {
        ...defaultConverterOptions,
        ...found.converter_options
      }
    }
    tableEditorDialog.value.whereRecord = { 
      ...found,
      converter_options: {
        ...defaultConverterOptions,
        ...found.converter_options
      }
    }
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

/** 转换为可读的转换选项*/
function readableConverterOption(converterOptions: ConverterOptions): string {
  const entries = Object.entries(converterOptions)
  if (entries.length === 0) {
    return "无修改"
  }
  return entries
    .map(([key, value]) => `${key}=${value}`)
    .join(", ")
}

const { tableFetch, submitAdd, submitEdit, submitDelete } = defineProps<{
  tableFetch: ({ page, itemsPerPage, sortBy }: { page: number, itemsPerPage: number, sortBy: TableSort[] }) => Promise<[GroupSubscribes[], number]>
  submitAdd: (record: GroupSubscribes) => Promise<void>
  submitEdit: (record: GroupSubscribes, whereRecord: GroupSubscribes) => Promise<void>
  submitDelete: (sid: string) => Promise<void>
}>()
</script>