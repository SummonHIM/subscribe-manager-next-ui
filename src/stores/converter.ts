import { type Ref, computed, ref } from 'vue'

import { defineStore } from 'pinia'
import { validate as validateUUID } from 'uuid'

import type { APIConverterOptions, ConverterOptions } from '@/interfaces'

/** 转换器储存 */
export const useConverterStore = defineStore(
  'converter',
  () => {
    const tokens: Ref<string[]> = ref([])
    const options: Ref<APIConverterOptions> = ref({
      backend: null,
      target: null,
      ver: null,
      group: null,
      upload_path: null,
      include: null,
      exclude: null,
      config: null,
      dev_id: null,
      filename: null,
      interval: null,
      rename: null,
      filter_script: null,
      strict: null,
      upload: null,
      emoji: null,
      add_emoji: null,
      remove_emoji: null,
      append_type: null,
      tfo: null,
      udp: null,
      list: null,
      sort: null,
      sort_script: null,
      script: null,
      insert: null,
      scv: null,
      fdn: null,
      expand: null,
      append_info: null,
      prepend: null,
      classic: null,
      tls13: null,
      new_name: null,
      ua: null,
    })

    /**
     * 添加令牌
     * @param token 令牌
     */
    const addToken = (token: string) => {
      tokens.value.push(token)
    }

    /**
     * 删除令牌
     * @param index 第几个
     */
    const removeToken = (index: number) => {
      tokens.value.splice(index, 1)
    }

    /** 生成转换后的链接 */
    const generated = computed(() => {
      const host = window.location.origin
      const params = new URLSearchParams()

      // 令牌为空，返回为空
      if (tokens.value.length <= 0) {
        return ''
      }

      // 令牌不为空，则以|分隔
      if (tokens.value.length) {
        const filteredTokens = tokens.value.filter((token) => token && validateUUID(token)) // 检测是否为合法的UUID
        if (filteredTokens.length) {
          params.set('token', filteredTokens.join('|'))
        } else {
          return ''
        }
      }

      // 遍历 options，把与默认值不一样的加上 c_<key>=<value>
      for (const key in options.value) {
        const value = options.value[key as keyof ConverterOptions]

        // 判断是否为空
        if (value !== null) {
          // 对 boolean 类型直接用 true/false
          let val: string
          if (typeof value === 'boolean') val = value ? 'true' : 'false'
          else if (value !== null && value !== undefined) val = String(value)
          else continue

          params.set(`c_${key}`, val)
        }
      }

      return `${host}/api/subscribe/?${params.toString()}`
    })

    return {
      tokens,
      options,
      generated,
      addToken,
      removeToken,
    }
  },
  { persist: true },
)
