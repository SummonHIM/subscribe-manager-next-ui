import type { VDataTableServer } from "vuetify/components"

/** API Interfaces */

/** API 返回的消息 */
export interface ReturnMessage {
  status: number
  code: null
  message: string
}

/** API 返回的结果 */
export interface ReturnResult<T> extends ReturnMessage {
  result: T[]
  count: number
}

/** 数据库：用户 */
export interface Users {
  uid: string
  username: string
  root: boolean
  create_date?: Date
}

/** 数据库：用户分组 */
export interface UserGroups {
  ugid: string
  uid: string
  gid: string
  expire: Date | string
  admin: boolean
}

/** 数据库：用户令牌 */
export interface UserToken {
  token: string
  uid: string
  sid: string
}

/** 数据库：分组 */
export interface Groups {
  gid: string
  name: string
  create_date?: Date
}

/** 数据库：分组订阅 */
export interface GroupSubscribes {
  sid: string
  gid: string
  order: number
  name: string
  url: string
  converter: boolean
  converter_options: ConverterOptions
}

/** 数据库：分组共享账号 */
export interface GroupShare {
  gsid: string
  gid: string
  name: string
  account: string
  password: string
  manage: string
  aff?: string
  create_date?: Date
}

/** Subconverter */

/** Subconverter 转换选项 */
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

/** Subconverter 转换选项注释 */
interface ConverterField {
  label: string
  type: string
  tooltip: string
  cols: number
}

/** Subconverter 转换选项注释表单 */
export type ConverterForm = Record<string, Record<string, ConverterField>>

/** 表格 */

/** 表格排序 */
export interface TableSort {
  key: string,
  order: "asc" | "desc"
}

/** 表格内容 */
export interface TableItem<T> {
  table: T[]
  length: number
  headers: VDataTableServer['$props']['headers']
  mainValue: string
  selected: string[]
  sort: TableSort[]
  page: number
  itemsPerPage: number
}

/** 表格编辑对话框 */
export interface TableEditorDialog<T> {
  open: boolean
  submit: boolean
  isEditing: boolean
  error: boolean
  record: T
  whereRecord: T
  defaultRecord: T
}
