<template>
  <v-card v-bind="$attrs">
    <v-container>
      <p class="mb-4">
        {{ props.name }}
      </p>
      <v-row>
        <v-col>
          <v-text-field
            v-model="convertedUrl.url"
            :append-inner-icon="props.converter ? 'mdi-refresh' : ''"
            label="订阅链接"
            readonly
            variant="outlined"
            @click:append-inner="refreshToken"
          />
        </v-col>
        <v-col
          align-self="center"
          cols="0"
          sm="2"
        >
          <v-btn block>
            导入
            <v-menu activator="parent">
              <v-list>
                <div v-if="props.converter && !convertedUrl.showOriginal">
                  <v-list-item :href="createImportScheme('clash', convertedUrl.url.toString(), props.name)">
                    Clash
                  </v-list-item>
                  <v-list-item :href="createImportScheme('surge', convertedUrl.url.toString(), props.name)">
                    Surge
                  </v-list-item>
                  <v-list-item :href="createImportScheme('singbox', convertedUrl.url.toString(), props.name)">
                    sing-box
                  </v-list-item>
                  <v-list-item :href="createImportScheme('quantumultx', convertedUrl.url.toString(), props.name)">
                    Quantumult X
                  </v-list-item>
                </div>
                <v-list-item @click="copy(convertedUrl.url.toString() || '')">
                  剪切板
                </v-list-item>
                <v-list-item @click="qrCodeDialog = true">
                  二维码
                </v-list-item>
              </v-list>
            </v-menu>
          </v-btn>
        </v-col>
      </v-row>
      <div v-if="props.converter">
        <v-expansion-panels class="mt-4 mt-sm-0">
          <v-expansion-panel title="自定义">
            <v-expansion-panel-text>
              <v-switch
                v-model="convertedUrl.showOriginal"
                color="primary"
                label="显示原始订阅链接"
                @change="switchOriginal(convertedUrl.showOriginal)"
              />

              <v-alert
                v-if="alertServerConverterOption()"
                class="mb-8"
                type="warning"
                :text="`服务器已为该订阅链接强制设置如下参数：${alertServerConverterOption()}`"
              />

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
                          v-model="convertedUrl.converterOption[key as keyof ConverterOptions]"
                          :label="config.label"
                          variant="outlined"
                          @change="updateConverterOption(key as keyof ConverterOptions, convertedUrl.converterOption[key as keyof ConverterOptions])"
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
                          v-model="convertedUrl.converterOption[key as keyof ConverterOptions]"
                          :label="config.label"
                          color="primary"
                          @change="updateConverterOption(key as keyof ConverterOptions, convertedUrl.converterOption[key as keyof ConverterOptions])"
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
                          v-model="convertedUrl.converterOption[key as keyof ConverterOptions]"
                          :label="config.label"
                          variant="outlined"
                          @change="updateConverterOption(key as keyof ConverterOptions, convertedUrl.converterOption[key as keyof ConverterOptions])"
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
                          v-model="convertedUrl.converterOption.target"
                          :items="['auto', 'clash', 'clashr', 'quan', 'quanx', 'loon', 'mellow', 'ss', 'sssub', 'ssd', 'ssr', 'surfboard', 'surge', 'trojan', 'v2ray', 'singbox', 'mixed']"
                          :label="config.label"
                          no-data-text="暂无数据"
                          variant="outlined"
                          @update:model-value="updateConverterOption(key as keyof ConverterOptions, convertedUrl.converterOption[key as keyof ConverterOptions])"
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
      </div>
    </v-container>
  </v-card>

  <v-dialog
    v-model="qrCodeDialog"
    max-width="335"
  >
    <v-card
      prepend-icon="mdi-qrcode"
      title="二维码"
    >
      <v-container class="bg-white">
        <qrcode-vue
          class="d-flex align-center justify-center"
          :value="convertedUrl.url"
          :size="300"
          level="H"
        />
      </v-container>
      <template #actions>
        <v-btn
          text="返回"
          @click="qrCodeDialog = false"
        />
      </template>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import axios, { AxiosError } from "axios"
import QrcodeVue from 'qrcode.vue'
import { useNotifyerStore } from "@/stores/notifyer"
import { useConvertedUrlsStore } from "@/stores/convertedUrls"
import { defaultConverterOptions, converterForm } from "@/plugins/converter"
import type { ConverterOptions, GroupSubscribes, ReturnMessage, ReturnResult, UserToken } from "@/interfaces"

/**
 * 传入的参数
 */
type Props = GroupSubscribes

/**
 * 经过转换的 URL
 */
interface ConvertedUrl {
  url: string
  showOriginal: boolean
  converterOption: ConverterOptions
}

const notifyerStore = useNotifyerStore()
const convertedUrlsStore = useConvertedUrlsStore()
const props = defineProps<Props>()
const convertedUrl = ref<ConvertedUrl>({
  url: props.url,
  showOriginal: false,
  converterOption: defaultConverterOptions
})
const userToken: Ref<UserToken> = ref({
  token: "",
  uid: "",
  sid: ""
})
const userTokenRefresh: Ref<number> = ref(0)
let userTokenRefreshTimeout: ReturnType<typeof setTimeout> | null = null
const qrCodeDialog: Ref<boolean> = ref(false)

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    notifyerStore.message = "复制成功"
    notifyerStore.open = true
  } catch (error) {
    notifyerStore.message = "复制过程中发生错误：" + error
    notifyerStore.open = true
  }
}

function createImportScheme(
  type: "clash" | "surfboard" | "surge" | "singbox" | "quantumultx",
  url: string | undefined,
  name: string | undefined
) {
  if (!url || !name)
    return ""

  switch (type) {
    case "clash":
      return "clash://install-config?url=" + encodeURIComponent(url) + "&name=" + encodeURIComponent(name)
    case "surfboard":
      return "surfboard:///install-config?url=" + encodeURIComponent(url)
    case "surge":
      return "surge:///install-config?url=" + encodeURIComponent(url)
    case "singbox":
      return "sing-box://import-remote-profile?url=" + encodeURIComponent(url) + "#" + encodeURIComponent(name)
    case "quantumultx":
      return "quantumult-x:///update-configuration?remote-resource={%22server_remote%22:[%22" + encodeURIComponent(url) + ",tag=" + encodeURIComponent(name) + "]}"
    default:
      return ""
  }
}

function generateUrl(): URL {
  const url = new URL(`${window.location.protocol}//${window.location.host}`)
  url.pathname = '/api/subscribe'
  url.searchParams.set('token', userToken.value.token)

  Object.keys(defaultConverterOptions).forEach(key => {
    url.searchParams.delete(`c_${key}`)
  })

  for (const key in convertedUrl.value.converterOption) {
    if (
      // 假如说参数存在且不为默认值
      convertedUrl.value.converterOption[key as keyof ConverterOptions] !== null &&
      defaultConverterOptions[key as keyof ConverterOptions] !== convertedUrl.value.converterOption[key as keyof ConverterOptions]
    ) { url.searchParams.set(`c_${key}`, convertedUrl.value.converterOption[key as keyof ConverterOptions]?.toString() || '') }
  }

  return url
}

function switchOriginal(open: boolean) {
  console.log(`显示原始订阅链接${open}`)
  switch (open) {
    case true:
      convertedUrl.value.url = props.url
      break
    case false:
      convertedUrl.value.url = generateUrl().toString()
      break
    default:
      console.error("显示原始订阅链接函数被传入了个不支持的参数。")
      break
  }
}

function updateConverterOption<Key extends keyof ConverterOptions>(
  key: Key,
  value: ConverterOptions[Key]
) {
  // 更新 store 中的值
  convertedUrlsStore.$state[props.sid][key] = value
  convertedUrl.value.converterOption[key] = value
  convertedUrl.value.url = generateUrl().toString()
}

function alertServerConverterOption(): string {
  const entries = Object.entries(props.converter_options)
  if (entries.length === 0) {
    return ""
  }
  return entries
    .map(([key, value]) => `${key}=${value}`)
    .join(", ")
}

async function refreshToken() {
  if (userTokenRefreshTimeout) {
    clearTimeout(userTokenRefreshTimeout)
  }

  // 启动一个新的 30 秒定时器
  userTokenRefreshTimeout = setTimeout(() => {
    userTokenRefresh.value = 0
  }, 30000)

  userTokenRefresh.value += 1
  switch (userTokenRefresh.value) {
    case 1:
      notifyerStore.message = "真的要刷新该订阅链接的令牌吗？刷新后需要重新导入订阅才能更新。再按一次本图标来刷新该订阅链接的令牌。"
      notifyerStore.open = true
      break
    case 2:
      try {
        const response = await axios.get<ReturnResult<UserToken>>(`/api/v2/user/token/refresh?gid=${props.gid}&sid=${props.sid}`)
        if (response.data.status === 200) {
          userToken.value = response.data.result[0]
          convertedUrl.value.url = generateUrl().toString()
        }
      } catch (error) {
        const axiosError = error as AxiosError<ReturnMessage>
        if (axiosError.response && axiosError.response.data.message) {
          notifyerStore.message = `刷新用户令牌时发生错误。${axiosError.response.data.message}`
        } else {
          notifyerStore.message = "刷新用户令牌时发生错误。详情请查看开发者日志。"
          console.error(error)
        }
        notifyerStore.open = true
      }

      userTokenRefresh.value = 0
      clearTimeout(userTokenRefreshTimeout)
      break
    default:
      userTokenRefresh.value = 0
      clearTimeout(userTokenRefreshTimeout)
      userTokenRefreshTimeout = null
      break
  }
}

if (props.converter) {
  if (!convertedUrlsStore.$state[props.sid])
    convertedUrlsStore.$state[props.sid] = defaultConverterOptions
  convertedUrl.value.converterOption = convertedUrlsStore.$state[props.sid]
  convertedUrl.value.url = generateUrl().toString()
}

onMounted(async () => {
  if (props.converter) {
    try {
      const response = await axios.get<ReturnResult<UserToken>>(`/api/v2/user/token?gid=${props.gid}&sid=${props.sid}`)
      if (response.data.status === 200) {
        userToken.value = response.data.result[0]
        convertedUrl.value.url = generateUrl().toString()
      }
    } catch (error) {
      const axiosError = error as AxiosError<ReturnMessage>
      if (axiosError.response && axiosError.response.data.message) {
        notifyerStore.message = `获取用户令牌时发生错误。${axiosError.response.data.message}`
      } else {
        notifyerStore.message = "获取用户令牌时发生错误。详情请查看开发者日志。"
        console.error(error)
      }
      notifyerStore.open = true
    }
  }
})
</script>
