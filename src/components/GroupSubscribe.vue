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

      <Card>
        <template #title><p class="text-base">其他选项</p></template>
        <template #content>
          <template v-if="props.subscribe.converter">
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
          </template>

          <div class="sm:flex items-center gap-4 mt-4">
            <template v-if="props.subscribe.converter">
              <div class="flex gap-2 mb-3 sm:mb-0">
                <ToggleSwitch v-model="displayUrlOpenConverter" />
                <p>使用订阅转换</p>
              </div>
            </template>

            <div class="flex gap-2 mb-2 sm:mb-0">
              <ToggleSwitch v-model="displayOriginUrl" />
              <p>显示原始订阅</p>
            </div>
            <Button
              v-if="!displayOriginUrl"
              label="刷新令牌"
              severity="secondary"
              variant="text"
              icon="pi pi-refresh"
              @click="refreshTokenDialogOpen = true"
            />
            <!-- <p class="font-thin">更多选项可导入到订阅转换器中继续编辑！</p> -->
          </div>
        </template>
      </Card>
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

  <Dialog
    v-model:visible="refreshTokenDialogOpen"
    modal
    :style="{ width: '30rem' }"
    header="刷新令牌确认"
  >
    <p>确定要刷新该订阅链接的令牌吗？</p>
    <p>刷新后，需要重新导入该订阅链接，才能正常更新！</p>

    <template #footer>
      <Button label="取消" icon="pi pi-times" text @click="refreshTokenDialogOpen = false" />
      <Button label="确定" icon="pi pi-check" @click="genSubscribeURL(true)" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { type Ref, ref, watch } from 'vue'

import axios from 'axios'
import type { TieredMenuMethods } from 'primevue'
import type { MenuItem } from 'primevue/menuitem'
import { useToast } from 'primevue/usetoast'

import { parseAPIError } from '@/exceptions'
import type { APIGroupSubscribes, APIUserSubscribeTokens } from '@/interfaces'
import { useApplicationStore } from '@/stores/application'
import { useConverterStore } from '@/stores/converter'
import { createImportScheme, getQrCodeURL } from '@/subscribes'

interface GroupSubscribesProps {
  subscribe: APIGroupSubscribes
}

const toast = useToast()
const applicationStore = useApplicationStore()
const converterStore = useConverterStore()
const props = defineProps<GroupSubscribesProps>()

// 实际显示的订阅链接
let tokenCache: string | null = null // 令牌缓存
const displayUrl: Ref<URL> = ref(new URL(props.subscribe.url)) // 显示在输入框中的订阅链接
const displayOriginUrl: Ref<boolean> = ref(false) // 是否显示原始订阅按钮
const displayUrlOpenConverter: Ref<boolean> = ref(props.subscribe.converter) // 是否使用订阅转换按钮

// 导入菜单
const gsImportMenuMethods: Ref<TieredMenuMethods | null> = ref(null) // 导入菜单方法
const menuItemsOriginal: MenuItem[] = [
  // 无转换时的菜单
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
const menuItemsConverter: MenuItem[] = [
  //有转换时的菜单
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
    label: '融合订阅转换器',
    command: () => {
      if (tokenCache) {
        converterStore.addToken(tokenCache)
        toast.add({
          severity: 'success',
          summary: '添加成功',
          detail: '已成功添加令牌到融合订阅转换器中',
          life: 2000,
        })
      }
    },
  },
  ...menuItemsOriginal,
]
const gsImportMenuItems: Ref<MenuItem[]> = ref(menuItemsOriginal) // 导入菜单内容

// 导入二维码对话框
const qrCodeDialogOpen = ref(false) // 是否打开
const qrCodeDialogSelected = ref({ name: 'Clash', code: 'clash' }) // 已选内容
const qrCodeDialogSelecter = [
  // 所有内容
  { name: 'Clash', code: 'clash' },
  { name: 'Surge', code: 'surge' },
  { name: 'Surfboard', code: 'surfboard' },
  { name: 'sing-box', code: 'singbox' },
  { name: 'Quantumult X', code: 'quantumultx' },
]
const qrCodeDialogImageURL = ref('') // 生成的二维码图片

// 刷新令牌对话框
const refreshTokenDialogOpen = ref(false)

/**
 * 切换导入菜单
 * @param event 事件
 */
const toggleGsImportMenu = (event: Event) => {
  if (gsImportMenuMethods.value) gsImportMenuMethods.value.toggle(event)
}

/**
 * 生成订阅转换链接
 * @param refresh 刷新令牌
 */
const genSubscribeURL = async (refresh: boolean = false) => {
  if (displayOriginUrl.value) {
    // 显示原始订阅，菜单为原始菜单
    gsImportMenuItems.value = menuItemsOriginal
    displayUrl.value = new URL(props.subscribe.url)
    return
  }

  try {
    // 从服务器获取令牌
    if (refresh) {
      // 刷新新令牌逻辑
      const response = await axios.put<APIUserSubscribeTokens>(
        `/api/v3/token/${props.subscribe.id}/`,
        {},
        { headers: { 'X-CSRFToken': applicationStore.csrfToken } },
      )
      tokenCache = response.data.token
    } else if (!tokenCache) {
      // 如果令牌缓存为空则重新获取
      const response = await axios.get<APIUserSubscribeTokens>(
        `/api/v3/token/${props.subscribe.id}/`,
      )
      tokenCache = response.data.token
    }

    // 构造URL结构
    displayUrl.value = new URL('/api/subscribe', window.location.origin)
    displayUrl.value.searchParams.set('token', tokenCache)

    // 检测是否关闭订阅转换
    if (props.subscribe.converter && !displayUrlOpenConverter.value) {
      // 关闭了，原始菜单
      gsImportMenuItems.value = menuItemsOriginal
      displayUrl.value.searchParams.set('converter', 'false')
    } else if (props.subscribe.converter && displayUrlOpenConverter.value) {
      // 没关闭则使用转换菜单
      gsImportMenuItems.value = menuItemsConverter
    }

    // 最后把刷新令牌的对话框关掉
    refreshTokenDialogOpen.value = false
  } catch (error) {
    const { messages } = parseAPIError<APIUserSubscribeTokens>(error)

    if (messages.length) {
      messages.forEach((msg) =>
        toast.add({
          severity: 'error',
          summary: '获取订阅令牌时发生错误',
          detail: msg,
          life: 5000,
        }),
      )
    } else {
      toast.add({
        severity: 'error',
        summary: '获取订阅令牌时发生错误',
        life: 5000,
      })
    }

    console.error(error)
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
    genSubscribeURL()
  },
  { immediate: true },
)

// 使用订阅转换监听器
watch(displayUrlOpenConverter, () => {
  genSubscribeURL()
})

// 二维码对话框客户端类型监听器
watch(
  qrCodeDialogSelected,
  async () => {
    qrCodeDialogImageURL.value = await getQrCodeURL(
      qrCodeDialogSelected.value.code,
      displayUrl.value.toString(),
      props.subscribe.name,
    )
  },
  { immediate: true },
)
</script>
