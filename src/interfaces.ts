export interface ReturnMessage {
  status: number
  code: null
  message: string
}

export interface ReturnResult<T> extends ReturnMessage {
  result: T[]
  count: number
}

export interface Users {
  uid: string
  username: string
  root: boolean
  create_date: Date
}

export interface UserGroups {
  ugid: string
  uid: string
  gid: string
  expire: Date
  admin: boolean
}

export interface UserToken {
  token: string
  uid: string
  sid: string
}

export interface Groups {
  gid: string
  name: string
  create_date: Date
}

export interface GroupSubscribes {
  sid: string
  gid: string
  order: number
  name: string
  url: string
  converter: boolean
  converter_options: ConverterOptions
}

export interface GroupShare {
  gsid: string
  gid: string
  name: string
  account: string
  password: string
  manage: string
  aff?: string
  create_date: Date
}

/**
 * 转换选项
 */
export interface ConverterOptions {
  target?: 'clash' | 'clashr' | 'quan' | 'quanx' | 'loon' | 'mellow' | 'ss' | 'sssub' |
  'ssd' | 'ssr' | 'surfboard' | 'surge' | 'trojan' | 'v2ray' | 'mixed' | 'auto'
  ver?: string
  group?: string
  upload_path?: string
  include?: string
  exclude?: string
  config?: string
  dev_id?: string
  filename?: string
  interval?: string
  rename?: string
  filter_script?: string
  strict?: boolean
  upload?: boolean
  emoji?: boolean
  add_emoji?: boolean
  remove_emoji?: boolean
  append_type?: boolean
  tfo?: boolean
  udp?: boolean
  list?: boolean
  sort?: boolean
  sort_script?: string
  script?: boolean
  insert?: boolean
  scv?: boolean
  fdn?: boolean
  expand?: boolean
  append_info?: boolean
  prepend?: boolean
  classic?: boolean
  tls13?: boolean
  new_name?: boolean
}

export type Sort = [string, "ASC" | "DESC"]

interface ConverterField {
  label: string
  type: string
  tooltip: string
  cols: number
}

export type ConverterForm = Record<string, Record<string, ConverterField>>