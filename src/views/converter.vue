<template>
  <div class="page-container">
    <header class="mb-6 flex items-start gap-2 sm:gap-3">
      <RouterLink
        to="/"
        aria-label="返回"
        class="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
      >
        <i class="pi pi-arrow-left text-sm"></i>
      </RouterLink>

      <div class="min-w-0">
        <h1 class="page-title">融合订阅</h1>
        <p class="page-subtitle mt-1">把多个令牌合并成一个订阅链接。</p>
      </div>
    </header>

    <div class="space-y-4">
      <!-- 令牌 -->
      <section class="surface-card p-4 sm:p-5">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="section-title">令牌</h2>
          <Button
            icon="pi pi-plus"
            severity="secondary"
            variant="text"
            rounded
            aria-label="添加令牌"
            @click="converterStore.addToken('')"
          />
        </div>

        <Message
          v-if="converterStore.tokens.length < 1"
          severity="warn"
          variant="simple"
          icon="pi pi-exclamation-circle"
        >
          请添加令牌。可前去订阅中手动导入订阅令牌到此处！
        </Message>

        <TransitionGroup
          name="converter-token-list"
          tag="div"
          enter-active-class="transition-[clip-path,opacity] duration-200 ease-out"
          leave-active-class="transition-[clip-path,opacity] duration-200 ease-in"
          enter-from-class="opacity-0 [clip-path:inset(0_0_100%_0)]"
          enter-to-class="opacity-100 [clip-path:inset(0_0_0_0)]"
          leave-from-class="opacity-100 [clip-path:inset(0_0_0_0)]"
          leave-to-class="opacity-0 [clip-path:inset(0_0_100%_0)]"
          move-class="transition-transform duration-200"
        >
          <div
            v-for="(_, index) in converterStore.tokens"
            :key="index"
            class="mb-2 flex gap-2 last:mb-0"
          >
            <InputText
              :id="`converter-token-${index}`"
              v-model="converterStore.tokens[index]"
              type="text"
              class="font-mono text-xs"
              placeholder="粘贴 UUID 令牌"
              fluid
            />

            <Button
              icon="pi pi-minus"
              variant="text"
              severity="danger"
              aria-label="删除令牌"
              @click="converterStore.removeToken(index)"
            />
          </div>
        </TransitionGroup>
      </section>

      <!-- 自定义配置 -->
      <section class="surface-card p-4 sm:p-5">
        <h2 class="section-title mb-3">自定义配置</h2>
        <Tabs value="simplify">
          <TabList>
            <Tab value="simplify">简单配置</Tab>
            <Tab value="full">详细配置</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="simplify">
              <ConverterForm
                :simplify="true"
                :initialValues="initialValues"
                :onSubmit="onOptionsSave"
              />
            </TabPanel>
            <TabPanel value="full">
              <ConverterForm :initialValues="initialValues" :onSubmit="onOptionsSave" />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </section>

      <!-- 生成结果 -->
      <section class="surface-card p-4 sm:p-5">
        <h2 class="section-title mb-3">生成结果</h2>

        <div class="flex items-center gap-2">
          <InputText
            id="converter-generated"
            :value="converterStore.generated"
            type="text"
            placeholder="请先输入 UUID 令牌…"
            class="min-w-0 flex-1 font-mono text-xs"
            readonly
            fluid
          />

          <Button
            label="导入到…"
            severity="secondary"
            outlined
            aria-haspopup="true"
            aria-controls="converter-import-menu"
            @click="toggleGsImportMenu"
          />
          <TieredMenu
            ref="gsImportMenuMethods"
            id="converter-import-menu"
            :model="gsImportMenuItems"
            popup
          />
        </div>
      </section>
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
  </div>
</template>

<script setup lang="ts">
import { type Ref, ref, watch } from 'vue'

import type { FormSubmitEvent } from '@primevue/forms/form'
import { type TieredMenuMethods, useToast } from 'primevue'
import type { MenuItem } from 'primevue/menuitem'

import { convertFromApiOptions, convertToApiOptions } from '@/converter'
import type { ConverterOptions } from '@/interfaces'
import { useConverterStore } from '@/stores/converter'
import { createImportScheme, getQrCodeURL } from '@/subscribes'

defineOptions({
  name: 'CustomConverterPage',
})

const toast = useToast()
const converterStore = useConverterStore()

const initialValues: Ref<ConverterOptions> = ref({
  ...convertFromApiOptions(converterStore.options),
})

// 导入菜单
const gsImportMenuMethods: Ref<TieredMenuMethods | null> = ref(null) // 导入菜单方法
const gsImportMenuItems: Ref<MenuItem[]> = ref([
  // 导入菜单内容
  {
    label: 'Clash',
    command: () => {
      window.location.href = createImportScheme('clash', converterStore.generated, '融合订阅')
    },
  },
  {
    label: 'Surge',
    command: () => {
      window.location.href = createImportScheme('surge', converterStore.generated, '融合订阅')
    },
  },
  {
    label: 'Surfboard',
    command: () => {
      window.location.href = createImportScheme('surfboard', converterStore.generated, '融合订阅')
    },
  },
  {
    label: 'sing-box',
    command: () => {
      window.location.href = createImportScheme('singbox', converterStore.generated, '融合订阅')
    },
  },
  {
    label: 'Quantumult X',
    command: () => {
      window.location.href = createImportScheme('quantumultx', converterStore.generated, '融合订阅')
    },
  },
  {
    label: '二维码',
    command: () => {
      qrCodeDialogOpen.value = true
    },
  },
  {
    label: '剪切板',
    command: async () => {
      try {
        await navigator.clipboard.writeText(converterStore.generated)
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
])

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

/**
 * 保存转换选项
 * @param event 事件
 */
const onOptionsSave = (event: FormSubmitEvent) => {
  if (event.valid) {
    converterStore.options = { ...convertToApiOptions(event.values as ConverterOptions) }
  }
}

/**
 * 切换导入菜单
 * @param event 事件
 */
const toggleGsImportMenu = (event: Event) => {
  if (!converterStore.generated) {
    toast.add({
      severity: 'error',
      summary: '令牌为空',
      detail: '请先输入UUID令牌！',
      life: 3000,
    })
    return
  }

  if (gsImportMenuMethods.value) gsImportMenuMethods.value.toggle(event)
}

// 二维码生成器：对话框打开、客户端类型变化或生成链接变化时重新生成
let qrCodeRequestId = 0
watch(
  [qrCodeDialogOpen, qrCodeDialogSelected, () => converterStore.generated],
  async () => {
    // 对话框未打开或令牌为空时不生成
    if (!qrCodeDialogOpen.value || !converterStore.generated) return

    const requestId = ++qrCodeRequestId
    const imageURL = await getQrCodeURL(
      qrCodeDialogSelected.value.code,
      converterStore.generated,
      '融合订阅',
    )

    // 只应用最后一次请求的结果，避免异步竞态
    if (requestId === qrCodeRequestId) {
      qrCodeDialogImageURL.value = imageURL
    }
  },
  { immediate: true },
)
</script>
