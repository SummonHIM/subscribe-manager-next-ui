<template>
  <div class="mx-auto pt-8 pb-8 max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[70%]">
    <GlobalToolbar v-model="menuSelected" :buttons="menuItems" class="mb-2" />

    <Card class="mt-9">
      <template #title>
        <div class="flex justify-between items-center gap-2 mb-2">
          <p>令牌</p>
          <Button icon="pi pi-plus" variant="text" @click="converterStore.addToken('')" />
        </div>
      </template>
      <template #content>
        <template v-if="converterStore.tokens.length < 1">
          <Message severity="warn" icon="pi pi-exclamation-circle">
            请添加令牌。<br />可前去订阅中手动导入订阅令牌到此处！
          </Message>
        </template>

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
          <div v-for="(_, index) in converterStore.tokens" :key="index" class="flex gap-2 mb-2">
            <FloatLabel variant="on">
              <InputText
                :id="`converter-token-${index}`"
                v-model="converterStore.tokens[index]"
                type="text"
                fluid
              />
              <label :for="`converter-token-${index}`">令牌 {{ index + 1 }}</label>
            </FloatLabel>

            <Button
              icon="pi pi-minus"
              variant="text"
              severity="danger"
              @click="converterStore.removeToken(index)"
            />
          </div>
        </TransitionGroup>
      </template>
    </Card>

    <Card class="mt-2">
      <template #title>自定义配置</template>
      <template #content>
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
      </template>
    </Card>

    <Card class="mt-2">
      <template #title>生成结果</template>
      <template #content>
        <div class="grid grid-cols-6 items-center gap-4 mb-6">
          <InputText
            :value="converterStore.generated"
            class="col-span-6 md:col-span-5"
            id="converter-generated"
            type="text"
            placeholder="请先输入UUID令牌…"
            fluid
            readonly
          />

          <div class="col-span-6 md:col-span-1">
            <Button
              label="导入到…"
              aria-haspopup="true"
              :aria-controls="`converter-import-menu`"
              severity="secondary"
              text
              fluid
              raised
              @click="toggleGsImportMenu"
            />
            <TieredMenu
              ref="gsImportMenuMethods"
              :id="`converter-import-menu`"
              :model="gsImportMenuItems"
              popup
            />
          </div>
        </div>
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
  </div>
</template>

<script setup lang="ts">
import { type Ref, ref, watch } from 'vue'

import type { FormSubmitEvent } from '@primevue/forms/form'
import { type TieredMenuMethods, useToast } from 'primevue'
import type { MenuItem } from 'primevue/menuitem'

import ConverterForm from '@/components/ConverterForm.vue'
import GlobalToolbar, { type GlobalTabbarButtonProps } from '@/components/GlobalToolbar.vue'
import { convertFromApiOptions, convertToApiOptions } from '@/converter'
import type { ConverterOptions } from '@/interfaces'
import { useConverterStore } from '@/stores/converter'
import { createImportScheme, getQrCodeURL } from '@/subscribes'

defineOptions({
  name: 'CustomConverterPage',
})

const toast = useToast()
const converterStore = useConverterStore()
const menuItems: GlobalTabbarButtonProps[] = [
  {
    id: 'back',
    label: '返回',
    icon: 'pi pi-arrow-left',
    hidden: false,
    href: '/',
  },
  {
    id: 'back-hidden',
    label: '返回',
    icon: 'pi pi-arrow-left',
    hidden: true,
  },
]
const menuSelected = ref<GlobalTabbarButtonProps>(
  menuItems.find((item) => item.id === 'back-hidden')!,
)
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

// 二维码对话框客户端类型监听器
watch(
  qrCodeDialogSelected,
  async () => {
    qrCodeDialogImageURL.value = await getQrCodeURL(
      qrCodeDialogSelected.value.code,
      converterStore.generated,
      '融合订阅',
    )
  },
  { immediate: true },
)
</script>
