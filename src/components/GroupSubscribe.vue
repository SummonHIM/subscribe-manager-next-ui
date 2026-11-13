<template>
  <div
    v-bind="$attrs"
    class="rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-sm sm:p-5 dark:border-neutral-800 dark:bg-neutral-900"
  >
    <!-- 标题行 -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-center gap-2">
        <h3 class="truncate text-[15px] font-medium text-neutral-900 dark:text-neutral-100">
          {{ props.subscribe.name }}
        </h3>
        <Tag
          v-if="props.subscribe.converter"
          severity="info"
          value="转换"
          class="shrink-0 !px-1.5 !py-0 !text-[11px]"
        />
      </div>

      <Button
        label="导入"
        icon="pi pi-download"
        size="small"
        severity="secondary"
        outlined
        class="shrink-0"
        aria-haspopup="true"
        :aria-controls="`group-subscribe-import-menu-${props.subscribe.id}`"
        @click="toggleGsImportMenu"
      />
      <TieredMenu
        ref="gsImportMenuMethods"
        :id="`group-subscribe-import-menu-${props.subscribe.id}`"
        :model="gsImportMenuItems"
        popup
      />
    </div>

    <!-- 订阅链接 -->
    <div
      class="mt-3 flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 py-1.5 pr-1 pl-3 dark:border-neutral-700 dark:bg-neutral-950/60"
    >
      <span
        class="min-w-0 flex-1 truncate font-mono text-xs text-neutral-600 dark:text-neutral-300"
        :title="displayUrlString"
      >
        {{ displayUrlString }}
      </span>
      <Button
        icon="pi pi-copy"
        text
        rounded
        size="small"
        severity="secondary"
        aria-label="复制订阅链接"
        @click="copyDisplayUrl"
      />
      <Button
        icon="pi pi-ellipsis-h"
        text
        rounded
        size="small"
        severity="secondary"
        aria-label="更多操作"
        aria-haspopup="true"
        :aria-controls="`group-subscribe-import-menu-${props.subscribe.id}`"
        @click="toggleGsImportMenu"
      />
    </div>

    <!-- 用量与到期 -->
    <div
      v-if="displayUsageMeter !== null || displayUsage.expire"
      class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-neutral-500 dark:text-neutral-400"
    >
      <template v-if="displayUsageMeter !== null">
        <ProgressBar
          :value="displayUsageMeter"
          :show-value="false"
          class="w-36"
          :pt="{
            root: { style: 'height: 4px' },
            value: {
              class: displayUsageMeter >= 90 ? '!bg-amber-500' : '',
              style: 'border-radius: 9999px',
            },
          }"
        />
        <span class="tabular-nums">
          {{ formatBytes((displayUsage.download ?? 0) + (displayUsage.upload ?? 0)) }}
          /
          {{ formatBytes(displayUsage.total) }}
        </span>
      </template>
      <span v-if="displayUsage.expire" class="tabular-nums">
        {{ new Date(displayUsage.expire * 1000).toLocaleString() }} 到期
      </span>
    </div>

    <!-- 服务器强制选项提示 -->
    <p
      v-if="serverNotice"
      class="mt-2 flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-500"
    >
      <i class="pi pi-info-circle mt-px text-[11px]"></i>
      <span>{{ serverNotice }}</span>
    </p>

    <!-- 选项 -->
    <div
      class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-600 dark:text-neutral-300"
    >
      <label v-if="props.subscribe.converter" class="flex cursor-pointer items-center gap-2">
        <ToggleSwitch v-model="displayUrlOpenConverter" />
        <span>使用订阅转换</span>
      </label>
      <label class="flex cursor-pointer items-center gap-2">
        <ToggleSwitch v-model="displayOriginUrl" />
        <span>显示原始订阅</span>
      </label>
      <Button
        v-if="!displayOriginUrl"
        label="刷新令牌"
        icon="pi pi-refresh"
        text
        size="small"
        severity="secondary"
        @click="refreshTokenDialogOpen = true"
      />
    </div>
  </div>

  <Dialog v-model:visible="qrCodeDialogOpen" modal header="二维码" :style="{ width: '22rem' }">
    <Select
      v-model="qrCodeDialogSelected"
      :options="qrCodeDialogSelecter"
      optionLabel="name"
      fluid
      class="mb-4"
    />
    <div class="flex justify-center rounded-lg bg-white p-3">
      <Image :src="qrCodeDialogImageURL" width="260" alt="订阅二维码" />
    </div>
  </Dialog>

  <Dialog
    v-model:visible="refreshTokenDialogOpen"
    modal
    :style="{ width: '30rem' }"
    header="刷新令牌确认"
  >
    <p>确定要刷新该订阅链接的令牌吗？</p>
    <p class="mt-2">刷新后，需要重新导入该订阅链接，才能正常更新！</p>

    <template #footer>
      <Button label="取消" icon="pi pi-times" text @click="refreshTokenDialogOpen = false" />
      <Button label="确定" icon="pi pi-check" @click="genSubscribeURL(true)" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { type Ref, computed, onMounted, ref, watch } from 'vue'

import axios from 'axios'
import type { TieredMenuMethods } from 'primevue'
import type { MenuItem } from 'primevue/menuitem'
import { useToast } from 'primevue/usetoast'

import { parseAPIError } from '@/exceptions'
import { fetchGroupSubscribesUsage } from '@/groups'
import type {
  APIGroup,
  APIGroupSubscribes,
  APIGroupSubscribesUsage,
  APIUserSubscribeTokens,
} from '@/interfaces'
import { useApplicationStore } from '@/stores/application'
import { useConverterStore } from '@/stores/converter'
import { calcUsagePercent, createImportScheme, formatBytes, getQrCodeURL } from '@/subscribes'

interface GroupSubscribesProps {
  groupId: APIGroup['id']
  subscribe: APIGroupSubscribes
}

const toast = useToast()
const applicationStore = useApplicationStore()
const converterStore = useConverterStore()
const props = defineProps<GroupSubscribesProps>()

// 实际显示的订阅链接
let tokenCache: string | null = null // 令牌缓存
const displayUrl: Ref<URL> = ref(new URL(props.subscribe.url)) // 显示在输入框中的订阅链接
const displayUrlString = computed(() => displayUrl.value.toString())
const displayOriginUrl: Ref<boolean> = ref(false) // 是否显示原始订阅按钮
const displayUrlOpenConverter: Ref<boolean> = ref(props.subscribe.converter) // 是否使用订阅转换按钮
const displayUsage: Ref<APIGroupSubscribesUsage> = ref({
  id: props.subscribe.id,
  upload: null,
  download: null,
  total: null,
  expire: null,
})
const displayUsageMeter: Ref<number | null> = ref(null)

// 导入菜单
const gsImportMenuMethods: Ref<TieredMenuMethods | null> = ref(null) // 导入菜单方法
const menuItemsOriginal: MenuItem[] = [
  // 无转换时的菜单
  {
    label: '剪切板',
    command: () => {
      copyDisplayUrl()
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
  { name: '纯链接', code: 'pure_url' },
]
const qrCodeDialogImageURL = ref('') // 生成的二维码图片

// 刷新令牌对话框
const refreshTokenDialogOpen = ref(false)

// 服务器强制转换选项提示
const serverNotice = computed(() => {
  if (!props.subscribe.converter) return ''

  const parts: string[] = []
  if (alertServerConverterBackend()) {
    parts.push(`转换后端：${props.subscribe.converter_options?.backend}`)
  }
  const option = alertServerConverterOption()
  if (option) {
    parts.push(`转换选项：${option}`)
  }

  return parts.length ? `服务器已强制设置${parts.join('；')}。` : ''
})

/**
 * 切换导入菜单
 * @param event 事件
 */
const toggleGsImportMenu = (event: Event) => {
  if (gsImportMenuMethods.value) gsImportMenuMethods.value.toggle(event)
}

/**
 * 复制当前显示的订阅链接
 */
const copyDisplayUrl = async () => {
  try {
    await navigator.clipboard.writeText(displayUrl.value.toString())
    toast.add({
      severity: 'success',
      summary: '已复制订阅链接',
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

// 二维码生成器：对话框打开、客户端类型变化或订阅链接变化时重新生成
let qrCodeRequestId = 0
watch(
  [qrCodeDialogOpen, qrCodeDialogSelected, displayUrl],
  async () => {
    // 对话框未打开时不生成
    if (!qrCodeDialogOpen.value) return

    const requestId = ++qrCodeRequestId
    const imageURL = await getQrCodeURL(
      qrCodeDialogSelected.value.code,
      displayUrl.value.toString(),
      props.subscribe.name,
    )

    // 只应用最后一次请求的结果，避免异步竞态
    if (requestId === qrCodeRequestId) {
      qrCodeDialogImageURL.value = imageURL
    }
  },
  { immediate: true },
)

onMounted(async () => {
  displayUsage.value = await fetchGroupSubscribesUsage(props.groupId, props.subscribe.id)
  displayUsageMeter.value = calcUsagePercent(displayUsage.value)
  console.log(displayUsageMeter.value)
})
</script>
