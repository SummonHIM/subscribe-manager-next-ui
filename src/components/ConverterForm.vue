<template>
  <Form
    v-slot="$form"
    :initialValues="initialValues"
    :resolver="converterFormResolver"
    @submit="onSubmit"
    @reset="onReset"
  >
    <div v-if="!simplify" class="flex justify-end gap-2 mt-4">
      <Button label="取消" icon="pi pi-times" text @click="onCancel" />
      <Button label="恢复" icon="pi pi-refresh" text @click="$form.reset()" />
      <Button label="保存" icon="pi pi-check" type="submit" />
    </div>

    <template v-for="(fields, category) in converterForm" :key="category">
      <p>
        {{ category }}
      </p>
      <Divider />

      <div class="grid grid-cols-12 items-center gap-3 mb-4">
        <template v-for="(item, key) in fields" :key="key">
          <div v-if="item" class="col-span-12 mt-1 mb-1" :class="colSpanMap[item.cols]">
            <template v-if="item.type === 'text'">
              <FloatLabel variant="on">
                <InputText
                  :name="key"
                  :id="`converter-${randomId}-text-${key}`"
                  type="text"
                  fluid
                  v-tooltip.bottom="item.tooltip"
                />
                <label :for="`converter-${randomId}-text-${key}`">{{ item.label }}</label>
              </FloatLabel>
              <Message v-if="$form[key]?.invalid" severity="error" size="small" variant="simple">
                {{ $form[key].error?.message }}
              </Message>
            </template>

            <template v-else-if="item.type === 'number'">
              <FloatLabel variant="on">
                <InputNumber
                  :useGrouping="false"
                  :name="key"
                  :labelId="`converter-${randomId}-number-${key}-label`"
                  :inputId="`converter-${randomId}-number-${key}`"
                  fluid
                  v-tooltip.bottom="item.tooltip"
                />
                <label :for="`converter-${randomId}-number-${key}`">{{ item.label }}</label>
              </FloatLabel>
              <Message v-if="$form[key]?.invalid" severity="error" size="small" variant="simple">
                {{ $form[key].error?.message }}
              </Message>
            </template>

            <template v-else-if="item.type === 'switch'">
              <div class="flex gap-2">
                <ToggleSwitch :name="key" v-tooltip.bottom="item.tooltip" />
                <p>{{ item.label }}</p>
              </div>
            </template>

            <template v-else-if="item.type === 'textarea'">
              <FloatLabel variant="on">
                <Textarea
                  :name="key"
                  :id="`converter-${randomId}-textarea-${key}`"
                  rows="6"
                  fluid
                  v-tooltip.bottom="item.tooltip"
                />
                <label :for="`converter-${randomId}-textarea-${key}`">{{ item.label }}</label>
              </FloatLabel>
              <Message v-if="$form[key]?.invalid" severity="error" size="small" variant="simple">
                {{ $form[key].error?.message }}
              </Message>
            </template>

            <template v-else-if="item.type === 'target-selector'">
              <FloatLabel variant="on">
                <Select
                  :name="key"
                  :options="targetSelecter"
                  :id="`converter-${randomId}-target-selector-${key}-label`"
                  :labelId="`converter-${randomId}-target-selector-${key}`"
                  optionLabel="name"
                  optionValue="code"
                  fluid
                  v-tooltip.bottom="item.tooltip"
                />
                <label :for="`converter-${randomId}-target-selector-${key}`">
                  {{ item.label }}
                </label>
              </FloatLabel>
            </template>

            <p v-else>发生错误！</p>
          </div>
        </template>
      </div>
    </template>

    <div class="flex justify-end gap-2 mt-4">
      <Button label="取消" icon="pi pi-times" text @click="onCancel" />
      <Button label="恢复" icon="pi pi-refresh" text @click="$form.reset()" />
      <Button label="保存" icon="pi pi-check" type="submit" />
    </div>
  </Form>
</template>

<script setup lang="ts">
import { ref, type Ref } from 'vue'
import type { FormResetEvent, FormSubmitEvent } from '@primevue/forms/form'
import {
  converterFormResolver,
  converterFormsFull,
  converterFormsSimplify,
  converterTargetSelector,
  converterDefaultOptions,
  type ConverterForm,
} from '@/converter'
import type { ConverterOptions } from '@/interfaces'

interface ConverterFieldProps {
  simplify?: boolean
  initialValues?: ConverterOptions
  onCancel?: () => void
  onSubmit?: (event: FormSubmitEvent) => void
  onReset?: (event: FormResetEvent) => void
}

const props = withDefaults(defineProps<ConverterFieldProps>(), {
  simplify: false,
})
const targetSelecter = [...converterTargetSelector]
const colSpanMap: Record<number, string> = {
  1: 'sm:col-span-1',
  2: 'sm:col-span-2',
  3: 'sm:col-span-3',
  4: 'sm:col-span-4',
  5: 'sm:col-span-5',
  6: 'sm:col-span-6',
  7: 'sm:col-span-7',
  8: 'sm:col-span-8',
  9: 'sm:col-span-9',
  10: 'sm:col-span-10',
  11: 'sm:col-span-11',
  12: 'sm:col-span-12',
}
const initialValues = props.initialValues ?? { ...converterDefaultOptions }
const converterForm: Ref<ConverterForm> = ref({ ...converterFormsFull })
const randomId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8)

// 简易模式
if (props.simplify) {
  converterForm.value = { ...converterFormsSimplify }
}
</script>
