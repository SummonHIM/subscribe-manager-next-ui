<template>
  <v-card v-bind="$attrs">
    <v-container>
      <v-form
        v-model="disableSubmitBtn"
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
          v-model="display.url"
          :rules="rules.urlRules"
          label="订阅链接"
          variant="outlined"
          :disabled="deleted"
        />
        <v-text-field
          v-model="display.order"
          type="number"
          :rules="rules.orderRules"
          label="排序"
          variant="outlined"
          :disabled="deleted"
        />
        <v-switch
          v-model="display.converter"
          label="开启转换"
          color="primary"
          :disabled="deleted"
        />

        <v-expansion-panels
          :disabled="deleted"
          class="mt-4 mb-4 mt-sm-0"
        >
          <v-expansion-panel title="自定义">
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
                          v-model="display.converter_options[key as keyof ConverterOptions]"
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
                          v-model="display.converter_options[key as keyof ConverterOptions]"
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
                          v-model="display.converter_options[key as keyof ConverterOptions]"
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
                          v-model="display.converter_options.target"
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

        <v-row>
          <v-col>
            <v-btn
              class="mt-2"
              color="red"
              block
              :disabled="deleted"
              @click="delete_confirm"
              @dblclick="delete_subscribe"
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
              :disabled="!disableSubmitBtn || deleted"
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
import axios, { AxiosError } from 'axios'
import { useNotifyerStore } from '@/stores/notifyer'
import { converterForm, defaultConverterOptions } from "@/plugins/converter"
import type { ConverterOptions, GroupSubscribes, ReturnMessage } from "@/interfaces"

/** 传入的参数 */
type Props = GroupSubscribes

const route = useRoute()
const gid = route.query.gid
const notifyerStore = useNotifyerStore()
/** 传入的参数 */
const props = defineProps<Props>()
/** 实际显示的内容 */
const display: Ref<Props> = ref({
  ...props,
  converter_options: {
    ...defaultConverterOptions,
    ...props.converter_options
  }
})
/** 已删除？ */
const deleted: Ref<boolean> = ref(false)
/** 禁用提交按钮 */
const disableSubmitBtn: Ref<boolean> = ref(true)
/** 表单规则 */
const rules = {
  orderRules: [
    (value: number) => {
      if (value < 0 || value > 255) {
        return "分组订阅的排序需为小于等于 255 以内的无符号的正整数。"
      }
      return true
    }
  ],
  nameRules: [
    (value: string) => {
      if (value.length === 0) {
        return "分组订阅名称不得为空。"
      }
      if (value.length > 25) {
        return "分组订阅名称的字符长度不能超过 25。"
      }
      return true
    }
  ],
  urlRules: [
    (value: string) => {
      if (value.length === 0) {
        return "分组订阅链接不得为空。"
      }
      if (value.length > 255) {
        return "分组订阅链接的字符长度不能超过 255。"
      }

      try { new URL(value) }
      catch { return "分组订阅链接不是一个合法的链接。" }

      return true
    }
  ]
}

/** 提交数据 */
async function submit() {
  const data = [{
    where_sid: display.value.sid,
    order: display.value.order,
    name: display.value.name,
    url: display.value.url,
    converter: display.value.converter,
    converter_options: Object.keys(display.value.converter_options).reduce((result, key) => {
      if (display.value.converter_options[key as keyof ConverterOptions] !== defaultConverterOptions[key as keyof ConverterOptions]) {
        (result as Record<string, unknown>)[key] = display.value.converter_options[key as keyof ConverterOptions]
      }
      return result
    }, {} as Partial<ConverterOptions>)
  }]

  await axios.put<ReturnMessage>(`/api/v2/admin/group/subscribes?where_gid=${gid}`, data)
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

/** 确认删除 */
function delete_confirm() {
  notifyerStore.message = "请双击来确认删除。"
  notifyerStore.open = true
}

/** 删除订阅 */
async function delete_subscribe() {
  await axios.delete<ReturnMessage>(`/api/v2/admin/group/subscribes?where_sid=${display.value.sid}&where_gid=${gid}`)
    .then(response => {
      notifyerStore.message = response.data.message

      display.value = {
        ...display.value,
        name: "已删除",
        url: "已删除",
        order: 255,
        converter: false
      }
      deleted.value = true
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

/** 重置数据到编辑状态前 */
function reset() {
  display.value = { ...props }
}

</script>