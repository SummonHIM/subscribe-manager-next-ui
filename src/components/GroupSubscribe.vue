<template>
  <Card v-bind="$attrs">
    <template #title>
      {{ props.subscribe.name }}
    </template>

    <template #content>
      <div class="grid grid-cols-6 items-center gap-4 mb-6">
        <FloatLabel variant="on" class="col-span-6 md:col-span-5">
          <InputText
            :id="`gs-manage-url-${props.subscribe.id}`"
            type="text"
            fluid
            :value="displayUrl"
            readonly
            :placeholder="displayUrl.toString()"
          />
          <label :for="`gs-manage-url-${props.subscribe.id}`">订阅链接</label>
        </FloatLabel>

        <div class="col-span-6 md:col-span-1">
          <Button
            label="导入到…"
            aria-haspopup="true"
            :aria-controls="`group-subscribe-import-menu-${props.subscribe.id}`"
            severity="secondary"
            text
            fluid
            raised
            @click="toggleGsImportMenu"
          />
          <TieredMenu
            ref="gsImportMenuMethods"
            :id="`group-subscribe-import-menu-${props.subscribe.id}`"
            :model="gsImportMenuItems"
            popup
          />
        </div>
      </div>

      <template v-if="props.subscribe.converter">
        <Card>
          <template #title><p class="text-base">其他选项</p></template>
          <template #content>
            <Message
              v-if="alertServerConverterBackend() || alertServerConverterOption()"
              severity="warn"
              icon="pi pi-exclamation-circle"
            >
              <template v-if="alertServerConverterBackend()">
                服务器已为该订阅链接设置了自定义转换后端链接：
                {{ props.subscribe.converter_options?.backend }}
                。
              </template>
              <template v-if="alertServerConverterBackend() && alertServerConverterOption()">
                <br />
              </template>
              <template v-if="alertServerConverterOption()">
                服务器已为该订阅链接设置如下自定义转换选项：
                {{ alertServerConverterOption() }}
                。
              </template>
            </Message>
            <div class="sm:flex items-center gap-4">
              <div class="flex gap-2 mb-2 sm:mb-0">
                <ToggleSwitch v-model="displayUrlOpenConverter" />
                <p>使用订阅转换</p>
              </div>
              <div class="flex gap-2 mb-2 sm:mb-0">
                <ToggleSwitch v-model="displayOriginUrl" />
                <p>显示原始订阅</p>
              </div>
              <Button
                label="刷新令牌"
                severity="secondary"
                variant="text"
                icon="pi pi-refresh"
                @click="genConvertedURL(true)"
              />
              <!-- <p class="font-thin">更多选项可导入到订阅转换器中继续编辑！</p> -->
            </div>
          </template>
        </Card>
      </template>
    </template>
  </Card>

  <Dialog v-model:visible="qrCodeDialogOpen" modal header="二维码">
    <Select
      class="mb-2"
      v-model="qrCodeDialogSelected"
      :options="qrCodeDialogSelecter"
      optionLabel="name"
      fluid
    />
    <Image :src="qrCodeDialogImageURL" />
  </Dialog>
</template>

<script setup lang="ts">
import axios, { AxiosError } from 'axios'
import QRCode from 'qrcode'
import { ref, watch, type Ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import type { MenuItem } from 'primevue/menuitem'
import type { TieredMenuMethods } from 'primevue'

import { useApplicationStore } from '@/stores/application'
import { useConverterStore } from '@/stores/converter'
import type { APIBasicError, APIGroupSubscribes, APIUserSubscribeTokens } from '@/interfaces'

interface GroupSubscribesProps {
  subscribe: APIGroupSubscribes
}

const toast = useToast()
const applicationStore = useApplicationStore()
const converterStore = useConverterStore()
const props = defineProps<GroupSubscribesProps>()

// 实际显示的订阅链接
let tokenCache: string | null = null
const displayUrl: Ref<URL> = ref(new URL(props.subscribe.url))
const displayOriginUrl: Ref<boolean> = ref(false)
const displayUrlOpenConverter: Ref<boolean> = ref(props.subscribe.converter)

// 导入菜单
const gsImportMenuMethods: Ref<TieredMenuMethods | null> = ref(null)
const gsImportMenuItems: MenuItem[] = [
  {
    label: '剪切板',
    command: async () => {
      try {
        await navigator.clipboard.writeText(displayUrl.value.toString())
        toast.add({
          severity: 'success',
          summary: '复制成功！',
          life: 2000,
        })
      } catch (error) {
        console.error(error)
        toast.add({
          severity: 'error',
          summary: '错误',
          detail: '复制文本时发生错误！',
          life: 2000,
        })
      }
    },
  },
]
if (props.subscribe.converter) {
  gsImportMenuItems.push(
    ...[
      {
        label: 'Clash',
        command: () => {
          window.location.href = createImportScheme(
            'clash',
            displayUrl.value.toString(),
            props.subscribe.name,
          )
        },
      },
      {
        label: 'Surge',
        command: () => {
          window.location.href = createImportScheme(
            'surge',
            displayUrl.value.toString(),
            props.subscribe.name,
          )
        },
      },
      {
        label: 'Surfboard',
        command: () => {
          window.location.href = createImportScheme(
            'surfboard',
            displayUrl.value.toString(),
            props.subscribe.name,
          )
        },
      },
      {
        label: 'sing-box',
        command: () => {
          window.location.href = createImportScheme(
            'singbox',
            displayUrl.value.toString(),
            props.subscribe.name,
          )
        },
      },
      {
        label: 'Quantumult X',
        command: () => {
          window.location.href = createImportScheme(
            'quantumultx',
            displayUrl.value.toString(),
            props.subscribe.name,
          )
        },
      },
      {
        label: '二维码',
        command: () => {
          qrCodeDialogOpen.value = true
        },
      },
      {
        label: '订阅转换器',
        command: () => {
          if (tokenCache) {
            converterStore.addToken(tokenCache)
            toast.add({
              severity: 'success',
              summary: '添加成功',
              detail: '已成功添加令牌到订阅转换器中',
              life: 2000,
            })
          }
        },
      },
    ],
  )
}

// 导入二维码对话框
const qrCodeDialogOpen = ref(false)
const qrCodeDialogSelected = ref({ name: 'Clash', code: 'clash' })
const qrCodeDialogSelecter = [
  { name: 'Clash', code: 'clash' },
  { name: 'Surge', code: 'surge' },
  { name: 'Surfboard', code: 'surfboard' },
  { name: 'sing-box', code: 'singbox' },
  { name: 'Quantumult X', code: 'quantumultx' },
]
const qrCodeDialogImageURL = ref('')

/** 生成二维码链接 */
const getQrCodeURL = async () => {
  return await QRCode.toDataURL(
    createImportScheme(
      qrCodeDialogSelected.value.code,
      displayUrl.value.toString(),
      props.subscribe.name,
    ),
    {
      width: 260,
      margin: 2,
    },
  )
}

/**
 * 切换导入菜单
 * @param event 事件
 */
const toggleGsImportMenu = (event: Event) => {
  if (gsImportMenuMethods.value) gsImportMenuMethods.value.toggle(event)
}

/**
 * 生成导入URL Scheme
 * @param type 类型
 * @param url 链接
 * @param name 名称
 */
function createImportScheme(type: string, url: string | undefined, name: string | undefined) {
  if (!url || !name) return ''

  switch (type) {
    case 'clash':
      return (
        'clash://install-config?url=' +
        encodeURIComponent(url) +
        '&name=' +
        encodeURIComponent(name)
      )
    case 'surge':
      return 'surge:///install-config?url=' + encodeURIComponent(url)
    case 'surfboard':
      return 'surfboard:///install-config?url=' + encodeURIComponent(url)
    case 'singbox':
      return (
        'sing-box://import-remote-profile?url=' +
        encodeURIComponent(url) +
        '#' +
        encodeURIComponent(name)
      )
    case 'quantumultx':
      return (
        'quantumult-x:///update-configuration?remote-resource={%22server_remote%22:[%22' +
        encodeURIComponent(url) +
        ',tag=' +
        encodeURIComponent(name) +
        ']}'
      )
    default:
      return ''
  }
}

/**
 * 生成订阅转换链接
 * @param refresh 刷新令牌
 */
const genConvertedURL = async (refresh: boolean = false) => {
  if (props.subscribe.converter && !displayOriginUrl.value) {
    try {
      if (refresh) {
        const response = await axios.put<APIUserSubscribeTokens>(
          `/api/v3/token/${props.subscribe.id}/`,
          {},
          { headers: { 'X-CSRFToken': applicationStore.csrfToken } },
        )
        tokenCache = response.data.token
      } else if (!tokenCache) {
        const response = await axios.get<APIUserSubscribeTokens>(
          `/api/v3/token/${props.subscribe.id}/`,
        )
        tokenCache = response.data.token
      }

      displayUrl.value = new URL('/api/subscribe', window.location.origin)
      displayUrl.value.searchParams.set('token', tokenCache)
      if (!displayUrlOpenConverter.value) displayUrl.value.searchParams.set('converter', 'false')
    } catch (error) {
      const axiosError = error as AxiosError<APIBasicError>
      if (axiosError.response?.data.detail)
        toast.add({
          severity: 'error',
          summary: '获取订阅令牌时发生错误',
          detail: axiosError.response.data.detail,
          life: 5000,
        })
      else
        toast.add({
          severity: 'error',
          summary: '获取订阅令牌时发生错误',
          life: 5000,
        })
      console.error(error)
    }
  }
}

/** 生成服务器强制转换选项的消息 */
function alertServerConverterOption(): string | null {
  const options = props.subscribe.converter_options
  if (!options) return null
  const entries = Object.entries(options).filter(
    ([key, value]) => value !== null && value !== undefined && key !== 'backend',
  )
  if (entries.length === 0) return null
  return entries.map(([key, value]) => `${key}=${value}`).join(', ')
}

/** 生成服务器强制指定后端的消息 */
function alertServerConverterBackend(): boolean {
  if (props.subscribe.converter_options?.backend) {
    return (
      props.subscribe.converter_options.backend !==
      import.meta.env.VITE_CONVERTER_DEFAULT_BACKEND_HOST
    )
  } else {
    return false
  }
}

// 显示原始订阅监听器
watch(
  displayOriginUrl,
  () => {
    if (displayOriginUrl.value) displayUrl.value = new URL(props.subscribe.url)
    else genConvertedURL()
  },
  { immediate: true },
)

// 使用订阅转换监听器
watch(displayUrlOpenConverter, () => {
  genConvertedURL()
})

// 二维码对话框客户端类型监听器
watch(
  qrCodeDialogSelected,
  async () => {
    qrCodeDialogImageURL.value = await getQrCodeURL()
  },
  { immediate: true },
)
</script>
