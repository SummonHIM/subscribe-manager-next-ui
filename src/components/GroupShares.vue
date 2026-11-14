<template>
  <div
    v-bind="$attrs"
    class="rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-sm sm:p-5 dark:border-neutral-800 dark:bg-neutral-900"
  >
    <h3 class="text-[15px] font-medium text-neutral-900 dark:text-neutral-100">
      {{ props.share.name }}
    </h3>

    <dl class="mt-2 space-y-1">
      <div
        v-for="(info, index) in displayInfos"
        v-show="info.value"
        :key="index"
        class="flex min-w-0 items-center gap-2"
      >
        <dt class="w-12 shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
          {{ info.label }}
        </dt>
        <dd class="flex min-w-0 flex-1 items-center gap-0.5">
          <span
            class="min-w-0 flex-1 truncate font-mono text-xs text-neutral-700 dark:text-neutral-200"
            :title="info.type === 'password' && !isPasswordVisible(index) ? '' : (info.value ?? '')"
          >
            {{ valueText(info, index) }}
          </span>
          <Button
            v-if="info.type === 'link' && isValidUrl(info.value)"
            icon="pi pi-external-link"
            text
            rounded
            size="small"
            severity="secondary"
            aria-label="打开链接"
            @click="openExternalLink(info.value)"
          />
          <Button
            v-if="info.type === 'password'"
            :icon="isPasswordVisible(index) ? 'pi pi-eye-slash' : 'pi pi-eye'"
            text
            rounded
            size="small"
            severity="secondary"
            :aria-label="isPasswordVisible(index) ? '隐藏密码' : '显示密码'"
            @click="togglePassword(index)"
          />
          <Button
            icon="pi pi-copy"
            text
            rounded
            size="small"
            severity="secondary"
            aria-label="复制"
            @click="copyText(info.value)"
          />
        </dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import { type Ref, ref } from 'vue'

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

// 准备显示的信息
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
// 显示密码内容的具体循环下标
const visibleInfoPasswords: Ref<number[]> = ref([])

/**
 * 判断是否是合法 URL
 * @param url 待验证的字符串
 */
const isValidUrl = (url: string | null): boolean => {
  if (!url) return false
  try {
    // 如果 new URL(url) 不报错，就是合法 URL
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 生成要显示的文本（密码未显示时以掩码代替）
 * @param info 信息
 * @param index 第几行
 */
const valueText = (info: DisplayInfos, index: number): string => {
  if (info.type === 'password' && !isPasswordVisible(index)) {
    return '••••••••'
  }
  return info.value ?? ''
}

/**
 * 在新建窗口中打开链接
 * @param url 链接
 */
const openExternalLink = (url: string | null) => {
  if (url) {
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
</script>
