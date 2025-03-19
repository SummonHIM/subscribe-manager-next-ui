<template>
  <v-container>
    <div class="d-flex justify-end">
      <v-btn
        color="red"
        class="mr-4"
        @click="delete_confirm"
        @dblclick="delete_ug"
      >
        删除
      </v-btn>
      <v-tooltip
        location="bottom"
      >
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            @click="submit"
          >
            保存
          </v-btn>
        </template>
        <span>
          仅保存本页内容
        </span>
      </v-tooltip>
    </div>
    <v-data-table-server
      v-model="items.selected"
      v-model:page="table.page"
      v-model:items-per-page="table.itemsPerPage"
      show-select
      multi-sort
      :headers="table.headers"
      :items="items.table"
      :items-length="items.length"
      :loading="table.loading"
      :item-value="table.itemValue"
      page-text="{0}-{1} / {2}"
      no-data-text="暂无数据"
      items-per-page-text="每页显示："
      :items-per-page-options="[10, 25, 50, 100]"
      class="mb-2"
      @update:options="fetchUserGroups"
    >
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template #item.expire="{ item }">
        <v-text-field
          v-model="item.expire_string"
          style="min-width: 160px;"
          hide-details
          label="请输入过期日"
          variant="underlined"
        />
      </template>
    </v-data-table-server>
    <v-divider class="mb-4" />
    <p class="mb-2">
      添加新用户
    </p>
    <v-row align="center">
      <v-col
        cols="12"
        sm="10"
      >
        <v-combobox
          v-model="userAddForm.uid"
          no-filter
          :items="userAddForm.searchResult.display"
          label="用户 ID"
          variant="outlined"
          @input="handleUidSearch"
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props">
              <v-list-item-subtitle>{{ uidToUserName(item.value) }}</v-list-item-subtitle>
            </v-list-item>
          </template>
        </v-combobox>
      </v-col>
      <v-col>
        <v-btn
          text="保存"
          block
          class="mb-6"
          @click="create"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { format } from 'date-fns'
import axios, { AxiosError } from 'axios'

import { getNextMonth } from '@/dateTime'
import { useNotifyerStore } from '@/stores/notifyer'
import type { ReturnMessage, ReturnResult, UserGroups, Users } from '@/interfaces'


interface GroupUsers extends UserGroups {
  username: string
  expire_string: string
}

interface Items {
  table: GroupUsers[],
  selected: string[]
  length: number
}
interface Sort {
  key: string,
  order: "asc" | "desc"
}

interface SearchResult {
  result: Users[]
  display: string[]
}
interface userAddForm {
  uid: string | null,
  searchResult: SearchResult
}

const route = useRoute()
const gid = route.query.gid
const notifyerStore = useNotifyerStore()
/** 用户表格内容 */
const table = ref({
  page: 1,
  itemValue: "ugid",
  itemsPerPage: 10,
  headers: [
    { key: "username", title: "用户名", sortable: false, width: '20%' },
    { key: "expire", title: "过期日", sortable: true },
  ],
  loading: true
})
/** 用户表格交互 */
const items: Ref<Items> = ref({
  table: [],
  selected: [],
  length: 0
})

const userAddForm: Ref<userAddForm> = ref({
  uid: null,
  searchResult: {
    result: [],
    display: []
  }
})

/**
 * 获取用户名
 * @param uid 用户 ID
 */
 async function fetchUserName(uid: string) {
  try {
    const response = await axios.get<ReturnResult<Users>>(`/api/v2/admin/users?gid=${gid}&uid=${uid}&limit=1&offset=0`)
    if (response.data.status === 200) {
      return response.data.result[0].username
    }
  } catch (error) {
    const axiosError = error as AxiosError<ReturnMessage>
    if (axiosError.response && axiosError.response.data.message) {
      notifyerStore.message = `获取用户时发生错误。${axiosError.response.data.message}`
    } else {
      notifyerStore.message = "获取用户时发生错误。详情请查看开发者日志。"
      console.error(error)
    }
    notifyerStore.open = true
  }
}

/**
 * 获取分组用户
 * @param param0 表格的参数
 */
async function fetchUserGroups(
  { page, itemsPerPage, sortBy }: { page: number, itemsPerPage: number, sortBy: Sort[] }
) {
  table.value.loading = true
  const sortString = `&sort=${sortBy.map(({ key, order }) => `${key}:${order}`).join(",")}`

  try {
    const response = await axios.get<ReturnResult<UserGroups>>(`/api/v2/admin/group/users?where_gid=${gid}&limit=${itemsPerPage}&offset=${((page - 1) * 5)}${sortString}`)
    if (response.data.status === 200) {
      items.value.table = await Promise.all(
        response.data.result.map(async (userGroup) => ({
          ...userGroup,
          expire_string: format(new Date(userGroup.expire), 'yyyy-MM-dd HH:mm:ss'),
          username: await fetchUserName(userGroup.uid) ?? "无法获取用户名。",
        }))
      )
      items.value.length = response.data.count
    }
  } catch (error) {
    const axiosError = error as AxiosError<ReturnMessage>
    if (axiosError.response && axiosError.response.data.message) {
      notifyerStore.message = `获取用户分组时发生错误。${axiosError.response.data.message}`
    } else {
      notifyerStore.message = "获取用户分组时发生错误。详情请查看开发者日志。"
      console.error(error)
    }
    notifyerStore.open = true
  } finally {
    table.value.loading = false
  }
}

/** 删除确认 */
function delete_confirm() {
  notifyerStore.message = "请双击来确认删除。"
  notifyerStore.open = true
}

/** 删除分组用户 */
async function delete_ug() {
  items.value.selected.forEach(async (value) => {
    await axios.delete<ReturnMessage>(`/api/v2/admin/group/users?where_gid=${gid}&where_ugid=${value}`)
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

  })
  notifyerStore.open = true

  await fetchUserGroups({ page: table.value.page, itemsPerPage: table.value.itemsPerPage, sortBy: [] })
}

/** 提交分组用户 */
async function submit() {
  const data = items.value.table.map(userGroup => ({
    where_ugid: userGroup.ugid,
    where_uid: userGroup.uid,
    expire: userGroup.expire_string
  }))

  await axios.put<ReturnMessage>(`/api/v2/admin/group/users?where_gid=${gid}`, data)
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
}

/** 创建分组用户 */
async function create() {
  const data = [{
    uid: userAddForm.value.uid,
    expire: format(getNextMonth(), 'yyyy-MM-dd HH:mm:ss')
  }]

  await axios.post<ReturnMessage>(`/api/v2/admin/group/users?where_gid=${gid}`, data)
    .then(response => {
      notifyerStore.message = response.data.message

      userAddForm.value = {
        uid: "",
        searchResult: {
          result: [],
          display: []
        }
      }
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `创建数据时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "创建数据时发生错误。详情请查看开发者日志。"
        console.error(error)
      }
    })
  notifyerStore.open = true

  await fetchUserGroups({ page: table.value.page, itemsPerPage: table.value.itemsPerPage, sortBy: [] })
}

/**
 * 搜索用户的用户 ID
 * @param like 搜索字段
 */
 async function searchUid(like: string | null) {
  if (!like)
    return []

  try {
    const response = await axios.get<ReturnResult<Users>>(`/api/v2/admin/users?gid=${gid}&like=${like}&limit=10&offset=0`)
    if (response.data.status === 200) {
      return response.data.result
    }
  } catch (error) {
    const axiosError = error as AxiosError<ReturnMessage>
    if (axiosError.response && axiosError.response.data.message) {
      notifyerStore.message = `获取用户时发生错误。${axiosError.response.data.message}`
    } else {
      notifyerStore.message = "获取用户时发生错误。详情请查看开发者日志。"
      console.error(error)
    }
    notifyerStore.open = true
  }

  return []
}

/** 处理搜索用户 ID */
async function handleUidSearch() {
  const result = await searchUid(userAddForm.value.uid)
  userAddForm.value.searchResult.result = result
  userAddForm.value.searchResult.display = result.map(user => user.uid)
}

/**
 * 通过用户 ID 获取用户名
 * @param uid 用户 ID
 */
function uidToUserName(uid: string): string | undefined {
  const user = userAddForm.value.searchResult.result.find(user => user.uid === uid)
  return user ? user.username : undefined
}
</script>