import type { FormResolverOptions } from '@primevue/forms/form'

import type { APIConverterOptions, ConverterOptions } from '@/interfaces'

export interface ConverterField {
  label: string
  type: string
  tooltip: string
  cols: number
}

export type ConverterForm = Record<
  string,
  Partial<Record<keyof APIConverterOptions, ConverterField>>
>

/** 默认转换选项 */
export const converterDefaultOptions: ConverterOptions = {
  backend: String(import.meta.env.VITE_CONVERTER_DEFAULT_BACKEND_HOST),
  target: 'auto',
  ver: -1,
  group: '',
  upload_path: '',
  include: '',
  exclude: '',
  config: '',
  dev_id: '',
  filename: '',
  interval: 86400,
  rename: '',
  filter_script: '',
  strict: false,
  upload: false,
  emoji: true,
  add_emoji: true,
  remove_emoji: true,
  append_type: false,
  tfo: false,
  udp: false,
  list: false,
  sort: false,
  sort_script: '',
  script: false,
  insert: true,
  scv: false,
  fdn: false,
  expand: true,
  append_info: true,
  prepend: true,
  classic: false,
  tls13: false,
  new_name: true,
  ua: '',
}

/**
 * 检查选项是否和默认值相同，相同则填null
 * @param values 转换选项
 * @returns 填null后的转换选项
 */
export function convertToApiOptions(values: ConverterOptions): APIConverterOptions {
  return Object.fromEntries(
    Object.entries(converterDefaultOptions).map(([key, defaultValue]) => {
      const k = key as keyof ConverterOptions
      const newValue = values[k]
      return [k, newValue === defaultValue ? null : newValue]
    }),
  ) as APIConverterOptions
}

/**
 * 将null的选项填为默认值
 * @param values 转换选项
 * @returns 填默认值的转换选项
 */
export function convertFromApiOptions(values: APIConverterOptions): ConverterOptions {
  return Object.fromEntries(
    Object.entries(converterDefaultOptions).map(([key, defaultValue]) => {
      const k = key as keyof ConverterOptions
      const valueFromApi = values[k as keyof APIConverterOptions]
      return [k, valueFromApi === null ? defaultValue : valueFromApi]
    }),
  ) as ConverterOptions
}

export const converterFormResolver = ({ values }: FormResolverOptions) => {
  const errors: Partial<Record<keyof APIConverterOptions, { message: string }[]>> = {}

  // ===== 后端配置 =====
  const backend = values.backend as string | undefined
  if (!backend || backend.trim().length === 0) {
    errors.backend = [{ message: '请填写后端地址' }]
  } else if (backend.length > 255) {
    errors.backend = [{ message: '后端地址长度不得大于 255' }]
  }

  // ===== 订阅配置 =====
  const config = values.config as string | undefined
  if (config && config.length > 255) {
    errors.config = [{ message: '外部配置长度不得大于 255' }]
  }

  const target = values.target as string | undefined
  if (target && target.length > 10) {
    errors.target = [{ message: '配置类型长度不得大于 10' }]
  }

  const ver = values.ver as number | undefined
  if (ver !== undefined && ver !== -1 && (ver < 2 || ver > 4)) {
    errors.ver = [{ message: '版本号不合法' }]
  }

  const dev_id = values.dev_id as string | undefined
  if (dev_id && dev_id.length > 255) {
    errors.dev_id = [{ message: '远程设备 ID 长度不得大于 255' }]
  }

  const filename = values.filename as string | undefined
  if (filename && filename.length > 255) {
    errors.filename = [{ message: '订阅文件名称长度不得大于 255' }]
  }

  const group = values.group as string | undefined
  if (group && group.length > 255) {
    errors.group = [{ message: '组名长度不得大于 255' }]
  }

  const interval = values.interval as number | undefined
  if (interval !== undefined && interval < 0) {
    errors.interval = [{ message: '更新间隔不能小于 0' }]
  }

  // ===== 节点配置 =====
  const include = values.include as string | undefined
  if (include && include.length > 255) {
    errors.include = [{ message: '保留节点长度不得大于 255' }]
  }

  const exclude = values.exclude as string | undefined
  if (exclude && exclude.length > 255) {
    errors.exclude = [{ message: '排除节点长度不得大于 255' }]
  }

  const rename = values.rename as string | undefined
  if (rename && rename.length > 255) {
    errors.rename = [{ message: '重命名长度不得大于 255' }]
  }

  const filter_script = values.filter_script as string | undefined
  if (filter_script && filter_script.length > 255) {
    errors.filter_script = [{ message: '自定义筛选代码长度不得大于 255' }]
  }

  const sort_script = values.sort_script as string | undefined
  if (sort_script && sort_script.length > 255) {
    errors.sort_script = [{ message: '自定义排序代码长度不得大于 255' }]
  }

  const ua = values.ua as string | undefined
  if (ua && ua.length > 255) {
    errors.ua = [{ message: 'User-Agent 长度不得大于 255' }]
  }

  // ===== 上传配置 =====
  const upload_path = values.upload_path as string | undefined
  if (upload_path && upload_path.length > 255) {
    errors.upload_path = [{ message: '上传名称长度不得大于 255' }]
  }

  return {
    values,
    errors,
  }
}

export const converterTargetSelector = [
  { name: '自动', code: 'auto' },
  { name: 'Clash', code: 'clash' },
  { name: 'ClashR', code: 'clashr' },
  { name: 'Quantumult', code: 'quan' },
  { name: 'Quantumult X', code: 'quanx' },
  { name: 'Loon', code: 'loon' },
  { name: 'Mellow', code: 'mellow' },
  { name: 'Shadowsocks (SIP002)', code: 'ss' },
  { name: 'Shadowsocks (软件订阅/SIP008)', code: 'sssub' },
  { name: 'ShadowsocksD', code: 'ssd' },
  { name: 'ShadowsocksR', code: 'ssr' },
  { name: 'Surfboard', code: 'surfboard' },
  { name: 'Surge', code: 'surge' },
  { name: 'Trojan', code: 'trojan' },
  { name: 'V2Ray', code: 'v2ray' },
  { name: 'Mixed', code: 'mixed' },
]

export const converterFormsFull = {
  后端配置: {
    backend: {
      label: '后端地址',
      type: 'text',
      tooltip: '订阅转换后端的地址。',
      cols: 12,
    },
  },
  订阅配置: {
    config: {
      label: '外部配置',
      type: 'text',
      tooltip:
        '指外部配置的地址（包含分组和规则部分），当此参数不存在时使用订阅转换器中的配置文件。',
      cols: 12,
    },
    target: {
      label: '配置类型',
      type: 'target-selector',
      tooltip: '想要生成的配置类型。',
      cols: 3,
    },
    ver: {
      label: '版本号',
      type: 'number',
      tooltip: '指定配置类型的版本号。目前只有 "surge" 有效。',
      cols: 3,
    },
    dev_id: {
      label: '远程设备 ID',
      type: 'text',
      tooltip: '用于设置 QuantumultX 的远程设备 ID, 以在某些版本上开启远程脚本。',
      cols: 3,
    },
    filename: {
      label: '订阅文件名称',
      type: 'text',
      tooltip: '指定所生成订阅的文件名，可以在 Clash For Windows 等支持文件名的软件中显示出来。',
      cols: 3,
    },
    group: {
      label: '组名',
      type: 'text',
      tooltip: '用于设置该订阅的组名，多用于 SSD/SSR。',
      cols: 3,
    },
    interval: {
      label: '更新间隔',
      type: 'number',
      tooltip: '用于设置托管配置更新间隔，确定配置将更新多长时间，单位为秒。',
      cols: 3,
    },
    append_info: {
      label: '输出额外信息',
      type: 'switch',
      tooltip: '用于输出包含流量或到期信息的节点，默认为 true，设置为 false 则取消输出。',
      cols: 3,
    },
    classic: {
      label: '生成传统规则',
      type: 'switch',
      tooltip: '用于设置是否生成 Clash classical rule-provider。',
      cols: 3,
    },
    expand: {
      label: '订阅全文置入',
      type: 'switch',
      tooltip:
        '用于在 API 端处理或转换 Surge, QuantumultX, Clash 的规则列表，即是否将规则全文置入订阅中，默认为 true，设置为 false 则不会将规则全文写进订阅。',
      cols: 3,
    },
    list: {
      label: '作为节点列表',
      type: 'switch',
      tooltip:
        '用于输出 Surge Node List 或者 Clash Proxy Provider 或者 Quantumult (X) 的节点订阅或者解码后的 SIP002。',
      cols: 3,
    },
    script: {
      label: '生成脚本',
      type: 'switch',
      tooltip: '用于生成Clash Script，默认为 false。',
      cols: 3,
    },
    new_name: {
      label: '新版规则',
      type: 'switch',
      tooltip: '如果设置为 true，则将启用 Clash 的新组名称 (proxies, proxy-groups, rules)。',
      cols: 3,
    },
    strict: {
      label: '强制更新',
      type: 'switch',
      tooltip: '如果设置为 true，则 Surge 将在上述间隔后要求强制更新。',
      cols: 3,
    },
    tfo: {
      label: 'TCP 快速连接',
      type: 'switch',
      tooltip: '用于开启该订阅链接的 TCP Fast Open，默认为 false。',
      cols: 3,
    },
    tls13: {
      label: 'TLS 1.3',
      type: 'switch',
      tooltip: '用于设置是否为节点增加 TLS 1.3 开启参数。',
      cols: 3,
    },
    scv: {
      label: '关闭证书检查',
      type: 'switch',
      tooltip: '用于关闭 TLS 节点的证书检查，默认为 false。',
      cols: 3,
    },
    udp: {
      label: 'UDP',
      type: 'switch',
      tooltip: '用于开启该订阅链接的 UDP，默认为 false。',
      cols: 3,
    },
    ua: {
      label: 'User-Agent',
      type: 'text',
      tooltip: '用于自定义 User-Agent 字符串。如果不指定，将使用默认的User-Agent。',
      cols: 9,
    },
  },
  节点配置: {
    emoji: {
      label: '表情符号',
      type: 'switch',
      tooltip: '用于设置节点名称是否包含 Emoji，默认为 true。',
      cols: 3,
    },
    add_emoji: {
      label: '添加表情符号',
      type: 'switch',
      tooltip: '用于在节点名称前加入 Emoji，默认为 true。',
      cols: 3,
    },
    remove_emoji: {
      label: '移除原有表情',
      type: 'switch',
      tooltip: '用于设置是否删除节点名称中原有的 Emoji，默认为 true。',
      cols: 3,
    },
    insert: {
      label: '插入额外链接',
      type: 'switch',
      tooltip: '用于设置是否将配置文件中的 insert_url 插入，默认为 true。',
      cols: 3,
    },
    append_type: {
      label: '插入节点类型',
      type: 'switch',
      tooltip: '用于在节点名称前插入节点类型，如 [SS],[SSR] 等。',
      cols: 6,
    },
    include: {
      label: '保留节点',
      type: 'text',
      tooltip: '指仅保留匹配到的节点，支持正则匹配，会覆盖配置文件里的设置。',
      cols: 6,
    },
    exclude: {
      label: '排除节点',
      type: 'text',
      tooltip: '指排除匹配到的节点，支持正则匹配，会覆盖配置文件里的设置。',
      cols: 6,
    },
    rename: {
      label: '重命名',
      type: 'text',
      tooltip: '用于自定义重命名，会覆盖配置文件里的设置。',
      cols: 6,
    },
    prepend: {
      label: '插入到节点前面',
      type: 'switch',
      tooltip: '用于设置插入 insert_url 时是否插入到所有节点前面，默认为 true。',
      cols: 4,
    },
    fdn: {
      label: '过滤不支持节点',
      type: 'switch',
      tooltip: '用于过滤目标类型不支持的节点，默认为 true。',
      cols: 4,
    },
    sort: {
      label: '按名称排序',
      type: 'switch',
      tooltip: '用于对输出的节点或策略组按节点名进行再次排序，默认为 false。',
      cols: 4,
    },
    filter_script: {
      label: '自定义筛选代码',
      type: 'textarea',
      tooltip:
        '用于自定义筛选节点的 JS 代码，会覆盖配置文件里的设置。出于安全考虑，链接需包含正确的 token 参数，才会应用该设置。',
      cols: 12,
    },
    sort_script: {
      label: '自定义排序代码',
      type: 'textarea',
      tooltip:
        '用于自定义排序的 JS 代码，会覆盖配置文件里的设置。出于安全考虑，链接需包含正确的 token 参数，才会应用该设置。',
      cols: 12,
    },
  },
  上传配置: {
    upload: {
      label: '上传配置',
      type: 'switch',
      tooltip: ' 用于将生成的订阅文件上传至 Gist，需要填写 gistconf.ini，默认为 false （即不上传）',
      cols: 2,
    },
    upload_path: {
      label: '上传名称',
      type: 'text',
      tooltip: '用于将生成的订阅文件上传至 Gist 后的名称。',
      cols: 10,
    },
  },
}

export const converterFormsSimplify = {
  null: {
    backend: {
      label: '后端地址',
      type: 'text',
      tooltip: '订阅转换后端的地址。',
      cols: 12,
    },
    config: {
      label: '外部配置',
      type: 'text',
      tooltip:
        '指外部配置的地址（包含分组和规则部分），当此参数不存在时使用订阅转换器中的配置文件。',
      cols: 12,
    },
    target: {
      label: '配置类型',
      type: 'target-selector',
      tooltip: '想要生成的配置类型。',
      cols: 3,
    },
    emoji: {
      label: '表情符号',
      type: 'switch',
      tooltip: '用于设置节点名称是否包含 Emoji，默认为 true。',
      cols: 3,
    },
    tfo: {
      label: 'TCP 快速连接',
      type: 'switch',
      tooltip: '用于开启该订阅链接的 TCP Fast Open，默认为 false。',
      cols: 3,
    },
    tls13: {
      label: 'TLS 1.3',
      type: 'switch',
      tooltip: '用于设置是否为节点增加 TLS 1.3 开启参数。',
      cols: 3,
    },
    scv: {
      label: '关闭证书检查',
      type: 'switch',
      tooltip: '用于关闭 TLS 节点的证书检查，默认为 false。',
      cols: 3,
    },
    udp: {
      label: 'UDP',
      type: 'switch',
      tooltip: '用于开启该订阅链接的 UDP，默认为 false。',
      cols: 3,
    },
    new_name: {
      label: '新版规则',
      type: 'switch',
      tooltip: '如果设置为 true，则将启用 Clash 的新组名称 (proxies, proxy-groups, rules)。',
      cols: 3,
    },
    classic: {
      label: '生成传统规则',
      type: 'switch',
      tooltip: '用于设置是否生成 Clash classical rule-provider。',
      cols: 3,
    },
    include: {
      label: '保留节点',
      type: 'text',
      tooltip: '指仅保留匹配到的节点，支持正则匹配，会覆盖配置文件里的设置。',
      cols: 6,
    },
    exclude: {
      label: '排除节点',
      type: 'text',
      tooltip: '指排除匹配到的节点，支持正则匹配，会覆盖配置文件里的设置。',
      cols: 6,
    },
  },
}
