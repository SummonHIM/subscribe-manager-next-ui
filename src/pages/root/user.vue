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
            <h1>超管编辑用户 {{ userInfo.user.username }}</h1>
          </div>
          <v-btn
            class="mr-4"
            to="/root"
          >
            返回超管菜单
          </v-btn>
        </div>
      </v-container>
    </v-sheet>

    <v-container>
      <v-card class="mb-4">
        <v-card-text>
          <v-form
            v-model="userForm.submit"
            fast-fail
            @submit.prevent="modify"
          >
            <v-text-field
              v-model="userForm.user.uid"
              :rules="userRules.uid"
              label="用户 ID"
              variant="outlined"
              append-inner-icon="mdi-refresh"
              @click:append-inner="userForm.user.uid = uuid()"
            />
            <v-text-field
              v-model="userForm.user.username"
              :rules="userRules.username"
              label="用户名"
              variant="outlined"
            />
            <v-switch
              v-model="userForm.user.root"
              label="超级管理员"
              color="primary"
            />
            <v-text-field
              v-model="userForm.user.create_date"
              label="创建日期"
              variant="outlined"
              type="datetime-local"
            />
            <v-btn
              class="mt-2"
              type="submit"
              block
              :disabled="!userForm.submit"
            >
              保存
            </v-btn>
          </v-form>
        </v-card-text>
      </v-card>

      <v-card class="mb-4">
        <UserGroupList
          type="inUser"
          :root="true"
          :table-fetch="fetchUserGroup"
          :submit-add="createUserGroup"
          :submit-edit="modifyUserGroup"
          :submit-delete="deleteUserGroup"
          :search-gid="searchGid"
          :search-groups="searchGroups"
        />
      </v-card>

      <v-card>
        <UserTokenList 
          :table-fetch="fetchUserToken"
          :submit-add="createUserToken"
          :submit-edit="modifyUserToken"
          :submit-delete="deleteUserToken"
          :search-sid="searchSid"
          :search-subscribes="searchSubscribes"
        />
      </v-card>
    </v-container>
  </div>
</template>

<script lang="ts" setup>
import { v4 as uuid } from 'uuid';
import { format } from 'date-fns';
import { useTheme } from 'vuetify';
import axios, { AxiosError } from 'axios';

import { userRules } from '@/editorRules';
import favicon from '@/assets/favicon.png';
import { useNotifyerStore } from '@/stores/notifyer';
import type { Groups, GroupSubscribes, ReturnMessage, ReturnResult, TableSort, UserGroups, Users, UserToken } from '@/interfaces';

/** 页面信息 */
interface Page{
  notFound: boolean
}

/** 分组信息 */
interface UserInfo {
  uid: string
  user: Users
}

/** 分组表单 */
interface UserForm {
  submit: boolean
  user: Users
}

const route = useRoute()
const router = useRouter()
const appTheme = useTheme()
const notifyerStore = useNotifyerStore()
/** 页面信息 */
const page: Ref<Page> = ref({
  notFound: true,
})
/** 分组信息 */
const userInfo: Ref<UserInfo> = ref({
  uid: route.query.uid?.toString() || "",
  user: { uid: "", username: "", root: false, create_date: new Date() },
})
/** 分组信息表单 */
const userForm: Ref<UserForm> = ref({
  submit: false,
  user: { uid: "", username: "", root: false, create_date: new Date() },
})

/**
 * 修改分组
 */
async function modify() {
  const data = [{
    ...userForm.value.user,
    create_date: format(userForm.value.user.create_date!, 'yyyy-MM-dd HH:mm:ss'),
    where_uid: userInfo.value.user.uid,
  }]

  await axios.put<ReturnMessage>(`/api/v2/root/users`, data)
    .then(response => {
      notifyerStore.message = response.data.message
      userInfo.value.user = { ...userForm.value.user }
      router.push(`/root/user?uid=${userForm.value.user.uid}`)
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `修改分组时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "修改分组时发生错误。详情请查看开发者日志。"
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
    const response = await axios.get<ReturnResult<UserGroups>>(`/api/v2/root/user/groups?where_uid=${userInfo.value.uid}&limit=${itemsPerPage}&offset=${((page - 1) * itemsPerPage)}${sortString}`)
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
    uid: userInfo.value.uid,
    expire: format(ug.expire, 'yyyy-MM-dd HH:mm:ss')
  }]

  await axios.post<ReturnMessage>(`/api/v2/root/user/groups`, data)
    .then(response => {
      notifyerStore.message = response.data.message
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `保存用户分组时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "保存用户分组时发生错误。详情请查看开发者日志。"
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
    where_uid: userInfo.value.uid,
    where_gid: whereUg.gid
  }]

  await axios.put<ReturnMessage>(`/api/v2/root/user/groups`, data)
    .then(response => {
      notifyerStore.message = response.data.message
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `修改用户分组时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "修改用户分组时发生错误。详情请查看开发者日志。"
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
  await axios.delete<ReturnMessage>(`/api/v2/root/user/group?where_ugid=${ugid}`)
    .then(response => {
      notifyerStore.message = response.data.message
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `删除用户分组时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "删除用户分组时发生错误。详情请查看开发者日志。"
        console.error(error)
      }
    })
  notifyerStore.open = true
}

/**
 * 通过分组 ID 搜索分组
 * @param uid 分组 ID
 */
async function searchGid(gid: string) {
  try {
    const response = await axios.get<ReturnResult<Groups>>(`/api/v2/root/groups?where_gid=${gid}&limit=1&offset=0`)
    if (response.data.status === 200) {
      return response.data.result[0].name
    }
  } catch (error) {
    const axiosError = error as AxiosError<ReturnMessage>
    if (axiosError.response && axiosError.response.data.message) {
      notifyerStore.message = `搜索分组时发生错误。${axiosError.response.data.message}`
    } else {
      notifyerStore.message = "搜索分组时发生错误。详情请查看开发者日志。"
      console.error(error)
    }
    notifyerStore.open = true
  }
}

/**
 * 通过分组名称搜索分组
 * @param like 搜索字段
 */
async function searchGroups(like: string | null) {
  if (!like)
    return []

  try {
    const response = await axios.get<ReturnResult<Groups>>(`/api/v2/root/groups?like=${like}&limit=10&offset=0`)
    if (response.data.status === 200) {
      return response.data.result
    }
  } catch (error) {
    const axiosError = error as AxiosError<ReturnMessage>
    if (axiosError.response && axiosError.response.data.message) {
      notifyerStore.message = `搜索分组时发生错误。${axiosError.response.data.message}`
    } else {
      notifyerStore.message = "搜索分组时发生错误。详情请查看开发者日志。"
      console.error(error)
    }
    notifyerStore.open = true
  }

  return []
}

/**
 * 获取用户令牌
 * @param param0 表格参数
 */
async function fetchUserToken({ page, itemsPerPage, sortBy }: { page: number, itemsPerPage: number, sortBy: TableSort[] }): Promise<[UserToken[], number]> {
  const sortString = `&sort=${sortBy.map(({ key, order }) => `${key}:${order}`).join(",")}`

  try {
    const response = await axios.get<ReturnResult<UserToken>>(`/api/v2/root/user/token?where_uid=${userInfo.value.uid}&limit=${itemsPerPage}&offset=${((page - 1) * itemsPerPage)}${sortString}`)
    if (response.data.status === 200) {
      return [response.data.result, response.data.count]
    }
    return [[], 0]
  } catch (error) {
    const axiosError = error as AxiosError<ReturnMessage>
    if (axiosError.response && axiosError.response.data.message) {
      notifyerStore.message = `获取用户令牌时发生错误。${axiosError.response.data.message}`
    } else {
      notifyerStore.message = "获取用户令牌时发生错误。详情请查看开发者日志。"
      console.error(error)
    }
    notifyerStore.open = true
    return [[], 0]
  }
}

/**
 * 创建用户令牌
 * @param ug 新用户令牌
 */
async function createUserToken(ut: UserToken) {
  const data = [{
    ...ut,
    uid: userInfo.value.uid,
  }]

  await axios.post<ReturnMessage>(`/api/v2/root/user/token`, data)
    .then(response => {
      notifyerStore.message = response.data.message
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `保存用户令牌时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "保存用户令牌时发生错误。详情请查看开发者日志。"
        console.error(error)
      }
    })
  notifyerStore.open = true
}

/**
 * 修改用户令牌
 * @param ut 新用户令牌
 * @param whereUt 原用户令牌
 */
async function modifyUserToken(ut: UserToken, whereUt: UserToken) {
  const data = [{
    ...ut,
    uid: userInfo.value.uid,
    where_token: whereUt.token,
    where_uid: userInfo.value.uid,
    where_sid: whereUt.sid
  }]

  await axios.put<ReturnMessage>(`/api/v2/root/user/token`, data)
    .then(response => {
      notifyerStore.message = response.data.message
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `修改用户令牌时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "修改用户令牌时发生错误。详情请查看开发者日志。"
        console.error(error)
      }
    })
  notifyerStore.open = true
}

/**
 * 删除用户令牌
 * @param token 用户令牌
 */
async function deleteUserToken(token: string) {
  await axios.delete<ReturnMessage>(`/api/v2/root/user/token?where_token=${token}`)
    .then(response => {
      notifyerStore.message = response.data.message
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `删除用户令牌时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "删除用户令牌时发生错误。详情请查看开发者日志。"
        console.error(error)
      }
    })
  notifyerStore.open = true
}

/**
 * 通过分组订阅 ID 搜索分组订阅
 * @param sid 分组订阅 ID
 */
async function searchSid(sid: string) {
  try {
    const response = await axios.get<ReturnResult<GroupSubscribes>>(`/api/v2/root/group/subscribes?where_sid=${sid}&limit=1&offset=0`)
    if (response.data.status === 200) {
      return response.data.result[0].name
    }
  } catch (error) {
    const axiosError = error as AxiosError<ReturnMessage>
    if (axiosError.response && axiosError.response.data.message) {
      notifyerStore.message = `搜索分组订阅时发生错误。${axiosError.response.data.message}`
    } else {
      notifyerStore.message = "搜索分组订阅时发生错误。详情请查看开发者日志。"
      console.error(error)
    }
    notifyerStore.open = true
  }
}

/**
 * 通过分组订阅名称搜索分组订阅
 * @param like 搜索字段
 */
async function searchSubscribes(like: string | null) {
  if (!like)
    return []

  try {
    const response = await axios.get<ReturnResult<GroupSubscribes>>(`/api/v2/root/group/subscribes?like=${like}&limit=10&offset=0`)
    if (response.data.status === 200) {
      return response.data.result
    }
  } catch (error) {
    const axiosError = error as AxiosError<ReturnMessage>
    if (axiosError.response && axiosError.response.data.message) {
      notifyerStore.message = `搜索分组时发生错误。${axiosError.response.data.message}`
    } else {
      notifyerStore.message = "搜索分组时发生错误。详情请查看开发者日志。"
      console.error(error)
    }
    notifyerStore.open = true
  }

  return []
}

/** 初始化基础信息 */
try {
  const resp = await axios.get<ReturnResult<Users>>(`/api/v2/root/users?where_uid=${userInfo.value.uid}`)

  if (resp.data.status === 200) {
    userInfo.value.user = { ...resp.data.result[0] }
    userForm.value.user = { ...resp.data.result[0] }
    page.value.notFound = false
  }
} catch (error) {
  page.value.notFound = true
  const axiosError = error as AxiosError<ReturnMessage>
  if (axiosError.response && axiosError.response.data.message) {
    notifyerStore.message = `获取分组和用户分组时发生错误。${axiosError.response.data.message}`
  } else {
    notifyerStore.message = "获取分组和用户分组时发生错误。详情请查看开发者日志。"
    console.error(error)
  }
  notifyerStore.open = true
}

onMounted(() => {
  document.title = `超管编辑用户 ${userInfo.value.user.username} - Subscribe Manager Next`
})
</script>

<route lang="yaml">
  meta:
    layout: root
</route>