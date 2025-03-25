<template>
  <v-card v-bind="$attrs">
    <v-container>
      <p class="mb-4">
        {{ display.name }}
      </p>
      <v-text-field
        v-model="display.manage"
        append-icon="mdi-content-copy"
        append-inner-icon="mdi-open-in-new"
        label="官网"
        readonly
        variant="outlined"
        @click:append="copy(display.manage)"
        @click:append-inner="openURLatBlank(display.manage)"
      />
      <v-text-field
        v-model="display.account"
        append-icon="mdi-content-copy"
        label="账号"
        readonly
        variant="outlined"
        @click:append="copy(display.account)"
      />
      <v-text-field
        v-model="display.password"
        append-icon="mdi-content-copy"
        :append-inner-icon="display.show_password ? 'mdi-eye' : 'mdi-eye-off'"
        label="密码"
        readonly
        :type="display.show_password ? 'text' : 'password'"
        variant="outlined"
        @click:append="copy(display.password)"
        @click:append-inner="display.show_password = !display.show_password"
      />
      <div v-if="display.aff">
        <v-text-field
          v-model="display.aff"
          append-icon="mdi-content-copy"
          append-inner-icon="mdi-open-in-new"
          label="邀请码"
          readonly
          variant="outlined"
          @click:append="copy(display.aff)"
          @click:append-inner="openURLatBlank(display.aff)"
        />
      </div>
    </v-container>
  </v-card>
</template>

<script lang="ts" setup>
import type { GroupShare } from '@/interfaces';
import { useNotifyerStore } from '@/stores/notifyer';

/** 传入的参数 */
type Props = GroupShare

/** 实际显示的内容 */
interface Display extends GroupShare {
  show_password: boolean
}

const notifyerStore = useNotifyerStore()
const props = defineProps<Props>()
/** 实际显示的内容 */
const display: Ref<Display> = ref({
  ...props,
  show_password: false
})

/**
 * 复制文本
 * @param text 文本
 */
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

/** 新建标签页打开 */
function openURLatBlank (url: string) {
  // 检查 URL 是否以 http:// 或 https:// 开头
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url // 如果没有，则添加 https://
  }
  window.open(url, '_blank') // 在新标签页中打开链接
}
</script>
