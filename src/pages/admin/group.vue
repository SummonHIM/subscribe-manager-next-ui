<template>
  <v-empty-state
    v-if="page.notFound"
    headline="啊噢，这里啥都没有…"
    :image="favicon"
    text="您所寻找的页面不存在"
    title="页面未找到"
  />
  <div v-else>
    <v-sheet :theme="appTheme.current.value.dark ? '' : 'sheet'">
      <v-container class="pt-12 pb-12 mb-4">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1>编辑分组 {{ groupInfo.group.name }}</h1>
          </div>
          <div v-if="groupInfo.userGroup.admin">
            <v-btn
              class="mr-4"
              :to="`/group?gid=${groupInfo.gid}`"
            >
              退出编辑
            </v-btn>
          </div>
        </div>
      </v-container>
    </v-sheet>

    <v-container>
      <v-card class="mb-4">
        <v-card-text>
          <v-form
            v-model="groupForm.submit"
            fast-fail
            @submit.prevent="modify"
          >
            <v-text-field
              v-model="groupForm.group.gid"
              :rules="groupRules.gid"
              label="分组 ID"
              variant="outlined"
              readonly
            />
            <v-text-field
              v-model="groupForm.group.name"
              :rules="groupRules.name"
              label="分组名称"
              variant="outlined"
            />
            <v-btn
              class="mt-2"
              type="submit"
              block
              :disabled="!groupForm.submit"
            >
              保存
            </v-btn>
          </v-form>
        </v-card-text>
      </v-card>
      <v-card class="mb-4">
        <SubscribeList
          :table-fetch="fetchSubscribes"
          :submit-add="createSubscribe"
          :submit-edit="modifySubscribe"
          :submit-delete="deleteSubscribe"
        />
      </v-card>
      <v-card class="mb-4">
        <ShareList
          :root="false"
          :table-fetch="fetchShare"
          :submit-add="createShare"
          :submit-edit="modifyShare"
          :submit-delete="deleteShare"
        />
      </v-card>
      <v-card>
        <UserGroupList
          type="inGroup"
          :root="false"
          :table-fetch="fetchUserGroup"
          :submit-add="createUserGroup"
          :submit-edit="modifyUserGroup"
          :submit-delete="deleteUserGroup"
          :search-uid="searchUid"
          :search-users="searchUsers"
        />
      </v-card>
    </v-container>
  </div>
</template>

<script lang="ts" setup>
import { format } from 'date-fns';
import { useTheme } from 'vuetify';
import axios, { AxiosError } from 'axios';

import { groupRules } from '@/editorRules';
import favicon from '@/assets/favicon.png';
import { fliterDefaultOptions } from '@/converter';
import { useNotifyerStore } from '@/stores/notifyer';
import type { Groups, GroupShare, GroupSubscribes, ReturnMessage, ReturnResult, TableSort, UserGroups, Users } from '@/interfaces';


/** 页面信息 */
interface Page{
  notFound: boolean
}

/** 分组信息 */
interface GroupInfo {
  gid: string
  group: Groups
  userGroup: UserGroups
}

interface GroupForm {
  submit: boolean
  group: Groups
}

const route = useRoute()
const appTheme = useTheme()
const notifyerStore = useNotifyerStore()
/** 页面信息 */
const page: Ref<Page> = ref({
  notFound: true,
})
/** 分组信息 */
const groupInfo: Ref<GroupInfo> = ref({
  gid: route.query.gid?.toString() || "",
  group: { gid: "", name: "", create_date: new Date() },
  userGroup: { ugid: "", uid: "", gid: "", expire: new Date(), admin: false }
})
/** 分组信息表单 */
const groupForm: Ref<GroupForm> = ref({
  submit: false,
  group: { gid: "", name: "", create_date: new Date() },
})

/**
 * 修改分组
 */
async function modify() {
  const data = {
    name: groupForm.value.group.name,
  }

  await axios.put<ReturnMessage>(`/api/v2/admin/group?where_gid=${groupInfo.value.gid}`, data)
    .then(response => {
      notifyerStore.message = response.data.message
      groupInfo.value.group = { ...groupForm.value.group }
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `创建分组时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "创建分组时发生错误。详情请查看开发者日志。"
        console.error(error)
      }
    })
  notifyerStore.open = true
}

/**
 * 获取分组订阅
 * @param param0 表格参数
 */
async function fetchSubscribes({ page, itemsPerPage, sortBy }: { page: number, itemsPerPage: number, sortBy: TableSort[] }): Promise<[GroupSubscribes[], number]> {
  const sortString = `&sort=${sortBy.map(({ key, order }) => `${key}:${order}`).join(",")}`

  try {
    const response = await axios.get<ReturnResult<GroupSubscribes>>(`/api/v2/group/subscribes?where_gid=${groupInfo.value.gid}&limit=${itemsPerPage}&offset=${((page - 1) * itemsPerPage)}${sortString}`)
    if (response.data.status === 200) {
      return [response.data.result, response.data.count]
    }
    return [[], 0]
  } catch (error) {
    const axiosError = error as AxiosError<ReturnMessage>
    if (axiosError.response && axiosError.response.data.message) {
      notifyerStore.message = `获取订阅时发生错误。${axiosError.response.data.message}`
    } else {
      notifyerStore.message = "获取订阅时发生错误。详情请查看开发者日志。"
      console.error(error)
    }
    notifyerStore.open = true
    return [[], 0]
  }
}

/**
 * 创建分组订阅
 * @param subscribe 新分组订阅
 */
async function createSubscribe(subscribe: GroupSubscribes) {
  const data = [{
    ...subscribe,
    converter_options: {}
  }]

  await axios.post<ReturnMessage>(`/api/v2/admin/group/subscribes?where_gid=${groupInfo.value.gid}`, data)
    .then(response => {
      notifyerStore.message = response.data.message
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `保存数据时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "保存数据时发生错误。详情请查看开发者日志。"
        console.error(error)
      }
    })
  notifyerStore.open = true
}

/**
 * 修改分组订阅
 * @param subscribe 新分组订阅
 */
async function modifySubscribe(subscribe: GroupSubscribes, whereSubscribe: GroupSubscribes) {
  const data = [{
    ...subscribe,
    converter_options: fliterDefaultOptions(subscribe.converter_options),
    where_sid: whereSubscribe.sid
  }]

  await axios.put<ReturnMessage>(`/api/v2/admin/group/subscribes?where_gid=${groupInfo.value.gid}`, data)
    .then(response => {
      notifyerStore.message = response.data.message
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `保存数据时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "保存数据时发生错误。详情请查看开发者日志。"
        console.error(error)
      }
    })
  notifyerStore.open = true
}

/**
 * 删除分组订阅
 * @param sid 分组订阅 ID
 */
async function deleteSubscribe(sid: string) {
  await axios.delete<ReturnMessage>(`/api/v2/admin/group/subscribe?where_sid=${sid}&where_gid=${groupInfo.value.gid}`)
    .then(response => {
      notifyerStore.message = response.data.message
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `保存数据时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "保存数据时发生错误。详情请查看开发者日志。"
        console.error(error)
      }
    })
  notifyerStore.open = true
}

/**
 * 获取分组共享账号
 * @param param0 表格参数
 */
async function fetchShare({ page, itemsPerPage, sortBy }: { page: number, itemsPerPage: number, sortBy: TableSort[] }): Promise<[GroupShare[], number]> {
  const sortString = `&sort=${sortBy.map(({ key, order }) => `${key}:${order}`).join(",")}`

  try {
    const response = await axios.get<ReturnResult<GroupShare>>(`/api/v2/group/share?where_gid=${groupInfo.value.gid}&limit=${itemsPerPage}&offset=${((page - 1) * itemsPerPage)}${sortString}`)
    if (response.data.status === 200) {
      return [response.data.result, response.data.count]
    }
    return [[], 0]
  } catch (error) {
    const axiosError = error as AxiosError<ReturnMessage>
    if (axiosError.response && axiosError.response.data.message) {
      notifyerStore.message = `获取共享账号时发生错误。${axiosError.response.data.message}`
    } else {
      notifyerStore.message = "获取共享账号时发生错误。详情请查看开发者日志。"
      console.error(error)
    }
    notifyerStore.open = true
    return [[], 0]
  }
}

/**
 * 创建分组共享账号
 * @param share 新分组共享账号
 */
async function createShare(share: GroupShare) {
  const data = [{ 
    ...share,
    create_date: null
  }]

  await axios.post<ReturnMessage>(`/api/v2/admin/group/share?where_gid=${groupInfo.value.gid}`, data)
    .then(response => {
      notifyerStore.message = response.data.message
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `保存数据时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "保存数据时发生错误。详情请查看开发者日志。"
        console.error(error)
      }
    })
  notifyerStore.open = true
}

/**
 * 修改分组共享账号
 * @param share 新分组共享账号
 * @param whereShare 原分组共享账号
 */
async function modifyShare(share: GroupShare, whereShare: GroupShare) {
  const data = [{
    ...share,
    where_gsid: whereShare.gsid
  }]

  await axios.put<ReturnMessage>(`/api/v2/admin/group/share?where_gid=${groupInfo.value.gid}`, data)
    .then(response => {
      notifyerStore.message = response.data.message
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `保存数据时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "保存数据时发生错误。详情请查看开发者日志。"
        console.error(error)
      }
    })
  notifyerStore.open = true
}

/**
 * 删除分组共享账号
 * @param gsid 共享账号 ID
 */
async function deleteShare(gsid: string) {
  await axios.delete<ReturnMessage>(`/api/v2/admin/group/share?where_gsid=${gsid}&where_gid=${groupInfo.value.gid}`)
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
}

/**
 * 获取用户分组
 * @param param0 表格参数
 */
async function fetchUserGroup({ page, itemsPerPage, sortBy }: { page: number, itemsPerPage: number, sortBy: TableSort[] }): Promise<[UserGroups[], number]> {
  const sortString = `&sort=${sortBy.map(({ key, order }) => `${key}:${order}`).join(",")}`

  try {
    const response = await axios.get<ReturnResult<UserGroups>>(`/api/v2/admin/group/users?where_gid=${groupInfo.value.gid}&limit=${itemsPerPage}&offset=${((page - 1) * itemsPerPage)}${sortString}`)
    if (response.data.status === 200) {
      return [response.data.result, response.data.count]
    }
    return [[], 0]
  } catch (error) {
    const axiosError = error as AxiosError<ReturnMessage>
    if (axiosError.response && axiosError.response.data.message) {
      notifyerStore.message = `获取用户分组时发生错误。${axiosError.response.data.message}`
    } else {
      notifyerStore.message = "获取用户分组时发生错误。详情请查看开发者日志。"
      console.error(error)
    }
    notifyerStore.open = true
    return [[], 0]
  }
}

/**
 * 创建用户分组
 * @param ug 新用户分组
 */
async function createUserGroup(ug: UserGroups) {
  const data = [{
    ...ug,
    expire: format(ug.expire, 'yyyy-MM-dd HH:mm:ss')
  }]

  await axios.post<ReturnMessage>(`/api/v2/admin/group/users?where_gid=${groupInfo.value.gid}`, data)
    .then(response => {
      notifyerStore.message = response.data.message
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `保存数据时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "保存数据时发生错误。详情请查看开发者日志。"
        console.error(error)
      }
    })
  notifyerStore.open = true
}

/**
 * 修改用户分组
 * @param ug 新用户分组
 * @param whereUg 原用户分组
 */
async function modifyUserGroup(ug: UserGroups, whereUg: UserGroups) {
  const data = [{
    ...ug,
    expire: format(ug.expire, 'yyyy-MM-dd HH:mm:ss'),
    where_ugid: whereUg.ugid,
    where_uid: whereUg.uid,
    where_gid: groupInfo.value.gid
  }]

  await axios.put<ReturnMessage>(`/api/v2/admin/group/users?where_gid=${groupInfo.value.gid}`, data)
    .then(response => {
      notifyerStore.message = response.data.message
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `保存数据时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "保存数据时发生错误。详情请查看开发者日志。"
        console.error(error)
      }
    })
  notifyerStore.open = true
}

/**
 * 删除用户分组
 * @param gsid 用户 ID
 */
async function deleteUserGroup(ugid: string) {
  await axios.delete<ReturnMessage>(`/api/v2/admin/group/users?where_ugid=${ugid}&where_gid=${groupInfo.value.gid}`)
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
}

/**
 * 根据用户 ID 搜索用户
 * @param uid 用户 ID
 */
async function searchUid(uid: string) {
  try {
    const response = await axios.get<ReturnResult<Users>>(`/api/v2/admin/users?gid=${groupInfo.value.gid}&uid=${uid}&limit=1&offset=0`)
    if (response.data.status === 200) {
      return response.data.result[0].username
    }
  } catch (error) {
    const axiosError = error as AxiosError<ReturnMessage>
    if (axiosError.response && axiosError.response.data.message) {
      notifyerStore.message = `搜索用户时发生错误。${axiosError.response.data.message}`
    } else {
      notifyerStore.message = "搜索用户时发生错误。详情请查看开发者日志。"
      console.error(error)
    }
    notifyerStore.open = true
  }
}

/**
 * 通过用户名搜索用户
 * @param like 搜索字段
 */
async function searchUsers(like: string | null) {
  if (!like)
    return []

  try {
    const response = await axios.get<ReturnResult<Users>>(`/api/v2/admin/users?gid=${groupInfo.value.gid}&like=${like}&limit=10&offset=0`)
    if (response.data.status === 200) {
      return response.data.result
    }
  } catch (error) {
    const axiosError = error as AxiosError<ReturnMessage>
    if (axiosError.response && axiosError.response.data.message) {
      notifyerStore.message = `搜索用户时发生错误。${axiosError.response.data.message}`
    } else {
      notifyerStore.message = "搜索用户时发生错误。详情请查看开发者日志。"
      console.error(error)
    }
    notifyerStore.open = true
  }

  return []
}

/** 初始化基础信息 */
try {
  const respGroup = await axios.get<ReturnResult<Groups>>(`/api/v2/group?where_gid=${groupInfo.value.gid}`)
  const respUserGroup = await axios.get<ReturnResult<UserGroups>>(`/api/v2/user/groups?where_gid=${groupInfo.value.gid}`)

  if (respGroup.data.status === 200) {
    groupInfo.value.group = { ...respGroup.data.result[0] }
    groupForm.value.group = { ...respGroup.data.result[0] }
  }

  if (respUserGroup.data.status === 200) {
    groupInfo.value.userGroup = respUserGroup.data.result.map(userGroup => ({
      ...userGroup,
      expire: new Date(userGroup.expire)
    }))[0]
  }

  page.value.notFound = !groupInfo.value.userGroup.admin
} catch (error) {
  const axiosError = error as AxiosError<ReturnMessage>
  page.value.notFound = true
  if (axiosError.response && axiosError.response.data.message) {
    notifyerStore.message = `获取分组和用户分组时发生错误。${axiosError.response.data.message}`
  } else {
    notifyerStore.message = "获取分组和用户分组时发生错误。详情请查看开发者日志。"
    console.error(error)
  }
  notifyerStore.open = true
}

onMounted(() => {
  document.title = `编辑分组 ${groupInfo.value.group.name} - Subscribe Manager Next`
})
</script>