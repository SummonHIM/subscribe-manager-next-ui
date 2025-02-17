<template>
  <v-container>
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
      @update:options="fetchUserGroups"
    >
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template #item.expire="{ item }">
        <v-text-field
          v-model="item.expire_string"
          hide-details
          label="请输入过期日"
          variant="underlined"
        />
      </template>
    </v-data-table-server>
    <v-row class="mt-2">
      <v-col>
        <v-btn
          color="red"
          block
          @click="delete_confirm"
          @dblclick="delete_ug"
        >
          删除已选用户
        </v-btn>
      </v-col>
      <v-col>
        <v-btn
          block
          @click="addUserDialog.open = true"
        >
          添加用户
        </v-btn>
      </v-col>
      <v-col>
        <v-btn
          block
          @click="submit"
        >
          保存当前表格页
        </v-btn>
      </v-col>
    </v-row>
  </v-container>

  <v-dialog
    v-model="addUserDialog.open"
    persistent
    max-width="600"
  >
    <v-card
      prepend-icon="mdi-account-plus"
      title="添加新用户"
    >
      <v-container>
        <v-combobox
          v-model="addUserDialog.uid"
          no-filter
          :items="addUserDialog.searchResult.display"
          label="用户 ID"
          variant="outlined"
          @input="handleUidSearch"
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props">
              <v-list-item-content>
                <v-list-item-subtitle>{{ uidToUserName(item.value) }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </template>
        </v-combobox>
        <v-text-field
          v-model="addUserDialog.expire"
          label="过期日"
          variant="outlined"
        />
      </v-container>
      <template #actions>
        <v-btn
          text="返回"
          @click="addUserDialog.open = false"
        />
        <v-btn
          text="保存"
          @click="create"
        />
      </template>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import axios, { AxiosError } from 'axios'
import { format } from 'date-fns'
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
interface AddUserDialog {
  open: boolean,
  uid: string,
  expire: string,
  searchResult: SearchResult
}

const route = useRoute()
const gid = route.query.gid
const notifyerStore = useNotifyerStore()
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
const items: Ref<Items> = ref({
  table: [],
  selected: [],
  length: 0
})
const addUserDialog: Ref<AddUserDialog> = ref({
  open: false,
  uid: "",
  expire: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
  searchResult: {
    result: [],
    display: []
  }
})


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

async function searchUid(like: string) {
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

function delete_confirm() {
  notifyerStore.message = "请双击来确认删除。"
  notifyerStore.open = true
}

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

async function create() {
  const data = [{
    uid: addUserDialog.value.uid,
    expire: addUserDialog.value.expire
  }]

  await axios.post<ReturnMessage>(`/api/v2/admin/group/users?where_gid=${gid}`, data)
    .then(response => {
      notifyerStore.message = response.data.message

      addUserDialog.value = {
        open: false,
        uid: "",
        expire: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
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

async function handleUidSearch() {
  const result = await searchUid(addUserDialog.value.uid)
  addUserDialog.value.searchResult.result = result
  addUserDialog.value.searchResult.display = result.map(user => user.uid)
  console.log(addUserDialog.value.searchResult)
}

function uidToUserName(uid: string): string | undefined {
  const user = addUserDialog.value.searchResult.result.find(user => user.uid === uid)
  return user ? user.username : undefined
}
</script>