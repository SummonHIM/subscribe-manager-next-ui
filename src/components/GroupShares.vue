<template>
  <Card>
    <template #title>
      {{ props.share.name }}
    </template>

    <template #content>
      <template v-for="(info, index) in displayInfos" :key="index">
        <div v-if="info.value" class="mb-4 grid grid-cols-6 items-center gap-4">
          <FloatLabel variant="on" class="col-span-4 sm:col-span-5">
            <InputText
              :id="`ga-display-${props.share.id}-${index}`"
              :type="
                info.type === 'password'
                  ? isPasswordVisible(index)
                    ? 'text'
                    : 'password'
                  : inputTypeGenerator(info.type)
              "
              fluid
              :value="info.value"
              :placeholder="info.value"
              readonly
            />
            <label :for="`ga-display-${props.share.id}-${index}`">{{ info.label }}</label>
          </FloatLabel>

          <div class="col-span-2 sm:col-span-1 flex justify-center gap-4">
            <Button
              v-if="info.type === 'link'"
              icon="pi pi-external-link"
              severity="secondary"
              text
              fluid
              raised
              @click="openExternalLink(info.value)"
            />
            <Button
              v-if="info.type === 'password'"
              :icon="isPasswordVisible(index) ? 'pi pi-eye-slash' : 'pi pi-eye'"
              severity="secondary"
              text
              fluid
              raised
              @click="togglePassword(index)"
            />
            <Button
              icon="pi pi-clipboard"
              severity="secondary"
              text
              fluid
              raised
              @click="copyText(info.value)"
            />
          </div>
        </div>
      </template>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, type Ref } from 'vue'
import { useToast } from 'primevue/usetoast'

import type { APIGroupShares } from '@/interfaces'

interface GroupSubscribesProps {
  share: APIGroupShares
}

interface DisplayInfos {
  label: string
  type: 'link' | 'password' | 'text' | string
  value: string | null
}

const toast = useToast()
const props = defineProps<GroupSubscribesProps>()

const displayInfos: DisplayInfos[] = [
  {
    label: '官网',
    type: 'link',
    value: props.share.manage_url,
  },
  {
    label: '账号',
    type: 'text',
    value: props.share.account,
  },
  {
    label: '密码',
    type: 'password',
    value: props.share.password,
  },
  {
    label: '邀请码',
    type: 'link',
    value: props.share.manage_aff,
  },
]
const visibleInfoPasswords: Ref<number[]> = ref([])

/**
 * 在新建窗口中打开链接
 * @param url 链接
 */
const openExternalLink = (url: string | null) => {
  if (url) {
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url
    }
    window.open(url, '_blank')
  }
}

/**
 * 复制文本
 * @param text 文本
 */
const copyText = async (text: string | null) => {
  if (text) {
    try {
      await navigator.clipboard.writeText(text)
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
  }
}

/**
 * 是否已经显示密码
 * @param index 第几行
 */
const isPasswordVisible = (index: number) => {
  return visibleInfoPasswords.value.includes(index)
}

/**
 * 切换显示密码
 * @param index 第几行
 */
const togglePassword = (index: number) => {
  const arr = visibleInfoPasswords.value
  const idx = arr.indexOf(index)

  if (idx >= 0) {
    // 已经显示了 → 移除
    arr.splice(idx, 1)
  } else {
    // 不在数组里 → 加入
    arr.push(index)
  }
}

/**
 * 输入类型生成器
 * @param type 类型
 */
const inputTypeGenerator = (type: 'link' | 'password' | 'text' | string): string => {
  switch (type) {
    case 'link':
      return 'text'
    case 'text':
      return 'text'
    default:
      return 'text'
  }
}
</script>
