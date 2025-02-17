<template>
  <v-card v-bind="$attrs">
    <v-container>
      <v-form
        fast-fail
        @submit.prevent="submit"
      >
        <v-text-field
          v-model="display.name"
          :rules="rules.nameRules"
          label="名称"
          variant="outlined"
          :disabled="deleted"
        />
        <v-text-field
          v-model="display.account"
          :rules="rules.accountRules"
          label="账号"
          variant="outlined"
          :disabled="deleted"
        />
        <v-text-field
          v-model="display.password"
          :rules="rules.passwordRules"
          label="密码"
          variant="outlined"
          :disabled="deleted"
        />
        <v-text-field
          v-model="display.manage"
          :rules="rules.manageRules"
          label="官网"
          variant="outlined"
          :disabled="deleted"
        />
        <v-text-field
          v-model="display.aff"
          :rules="rules.affRules"
          label="邀请码"
          variant="outlined"
          :disabled="deleted"
        />
        <v-text-field
          v-model="display.create_date_string"
          label="创建日"
          variant="outlined"
          :disabled="deleted"
          readonly
        />
        <v-row>
          <v-col>
            <v-btn
              class="mt-2"
              color="red"
              block
              :disabled="deleted"
              @click="delete_confirm"
              @dblclick="delete_share"
            >
              删除
            </v-btn>
          </v-col>
          <v-col>
            <v-btn
              class="mt-2"
              block
              :disabled="deleted"
              @click="reset"
            >
              重置
            </v-btn>
          </v-col>
          <v-col>
            <v-btn
              class="mt-2"
              type="submit"
              :disabled="disableSubmitBtn || deleted"
              block
            >
              保存
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-container>
  </v-card>
</template>

<script lang="ts" setup>
import type { GroupShare, ReturnMessage } from '@/interfaces'
import { useNotifyerStore } from '@/stores/notifyer'
import axios, { AxiosError } from 'axios'

type Props = GroupShare
interface Display extends Props {
  create_date_string: string
}

const route = useRoute()
const gid = route.query.gid
const notifyerStore = useNotifyerStore()
const props = defineProps<Props>()
const display: Ref<Display> = ref({
  ...props,
  aff: props.aff || "",
  create_date_string: props.create_date.toLocaleString()
})
const deleted: Ref<boolean> = ref(false)
const disableSubmitBtn: Ref<boolean> = ref(false)
const rules = {
  nameRules: [
    (value: string) => {
      if (value.length <= 255) {
        disableSubmitBtn.value = false
        return true
      }
      disableSubmitBtn.value = true
      return "分组共享账号的名称长度不得超过 255。"
    }
  ],
  accountRules: [
    (value: string) => {
      if (value.length <= 255) {
        disableSubmitBtn.value = false
        return true
      }
      disableSubmitBtn.value = true
      return "分组共享账号长度不得超过 255。"
    }
  ],
  passwordRules: [
    (value: string) => {
      if (value.length <= 255) {
        disableSubmitBtn.value = false
        return true
      }
      disableSubmitBtn.value = true
      return "分组共享账号的密码长度不得超过 255。"
    }
  ],
  manageRules: [
    (value: string) => {
      if (value.length <= 255) {
        disableSubmitBtn.value = false
        return true
      }
      disableSubmitBtn.value = true
      return "分组共享账号的官网长度不得超过 255。"
    }
  ],
  affRules: [
    (value: string) => {
      if (value.length <= 255) {
        disableSubmitBtn.value = false
        return true
      }
      disableSubmitBtn.value = true
      return "分组共享账号的邀请码长度不得超过 255。"
    }
  ]
}

async function submit() {
  const data = [{
    where_gsid: display.value.gsid,
    name: display.value.name,
    account: display.value.account,
    password: display.value.password,
    manage: display.value.manage,
    aff: display.value.aff
  }]
  await axios.put<ReturnMessage>(`/api/v2/admin/group/share?where_gid=${gid}`, data)
    .then(response => {
      notifyerStore.message = response.data.message
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `保存数据时发生错误。${error.response.data.message}`;
      } else {
        notifyerStore.message = "保存数据时发生错误。详情请查看开发者日志。";
        console.error(error)
      }
    })
  notifyerStore.open = true
}

function delete_confirm() {
  notifyerStore.message="请双击来确认删除。"
  notifyerStore.open=true
}

async function delete_share() {
  await axios.delete<ReturnMessage>(`/api/v2/admin/group/share?where_gsid=${display.value.gsid}&where_gid=${gid}`)
    .then(response => {
      notifyerStore.message = response.data.message

      display.value = {
        ...display.value,
        name: "已删除",
        account: "已删除",
        password: "已删除",
        manage: "已删除",
        aff: "已删除",
        create_date_string: "已删除"
      }
      deleted.value = true
    })
    .catch(error => {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `删除数据时发生错误。${error.response.data.message}`;
      } else {
        notifyerStore.message = "删除数据时发生错误。";
        console.error(error)
      }
    })
  notifyerStore.open = true
}

function reset() {
  display.value = {
    ...props,
    create_date_string: props.create_date.toLocaleString()
  }
}
</script>