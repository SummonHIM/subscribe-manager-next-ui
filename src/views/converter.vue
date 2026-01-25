<template>
  <div class="mx-auto pt-8 pb-8 max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[70%]">
    <GlobalToolbar v-model="menuSelected" :buttons="menuItems" class="mb-2" />

    <Card class="mt-8">
      <template #title>生成结果</template>
      <template #content>
        <InputText
          :value="converterStore.generated"
          type="text"
          placeholder="请先输入令牌…"
          fluid
          readonly
        />
      </template>
    </Card>

    <Card class="mt-2">
      <template #title>令牌</template>
      <template #content>
        <div class="flex justify-end-safe gap-2 mb-2">
          <template v-if="converterStore.tokens.length < 1">
            <Message severity="warn" icon="pi pi-exclamation-circle">
              请添加令牌。<br />可前去订阅中手动导入订阅令牌到此处！
            </Message>
          </template>
          <Button icon="pi pi-plus" variant="text" @click="converterStore.addToken('')" />
        </div>

        <TransitionGroup
          name="converter-token-list"
          tag="div"
          enter-active-class="transition-[clip-path,opacity] duration-200 ease-out"
          leave-active-class="transition-[clip-path,opacity] duration-100 ease-in"
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
              <ConverterForm :simplify="true" :initialValues="initialValues" :onSubmit="onSave" />
            </TabPanel>
            <TabPanel value="full">
              <ConverterForm :initialValues="initialValues" :onSubmit="onSave" />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, type Ref } from 'vue'

import { useConverterStore } from '@/stores/converter'
import GlobalToolbar, { type GlobalTabbarButtonProps } from '@/components/GlobalToolbar.vue'
import ConverterForm from '@/components/ConverterForm.vue'
import { convertFromApiOptions, convertToApiOptions } from '@/converter'
import type { ConverterOptions } from '@/interfaces'
import type { FormSubmitEvent } from '@primevue/forms/form'

defineOptions({
  name: 'CustomConverterPage',
})

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

const onSave = (event: FormSubmitEvent) => {
  if (event.valid) {
    converterStore.options = { ...convertToApiOptions(event.values as ConverterOptions) }
  }
}
</script>
