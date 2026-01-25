export interface APIBasicList<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface APIBasicError {
  detail: string
}

interface APIGroupMyself {
  expire: string
  admin: boolean
}

export interface APIGroup {
  id: number
  name: string
  subscribes: number[]
  shares: number[]
  myself: APIGroupMyself
}

export interface ConverterOptions {
  backend: string
  target: string
  ver: number
  group: string
  upload_path: string
  include: string
  exclude: string
  config: string
  dev_id: string
  filename: string
  interval: number
  rename: string
  filter_script: string
  strict: boolean
  upload: boolean
  emoji: boolean
  add_emoji: boolean
  remove_emoji: boolean
  append_type: boolean
  tfo: boolean
  udp: boolean
  list: boolean
  sort: boolean
  sort_script: string
  script: boolean
  insert: boolean
  scv: boolean
  fdn: boolean
  expand: boolean
  append_info: boolean
  prepend: boolean
  classic: boolean
  tls13: boolean
  new_name: boolean
  ua: string
}

export type APIConverterOptions = {
  [K in keyof ConverterOptions]: ConverterOptions[K] | null
}

export interface APIGroupSubscribes {
  id: number
  name: string
  url: string
  converter: boolean
  group: number
  order: number
  date_created: string
  converter_options: APIConverterOptions | null
}

export type APIGroupSubscribesEdit = Omit<APIGroupSubscribes, 'id'>

export interface APIGroupShares {
  id: number
  name: string
  account: string
  password: string
  manage_url: string
  manage_aff: string | null
  group: number
  order: number
  date_created: string
}

export type APIGroupSharesEdit = Omit<APIGroupShares, 'id'>

export interface APIGroupUsers {
  id: number
  user: number
  group: number
  expire: string
  admin: boolean
  username: string
}

export interface APIGroupUsersEdit {
  expire: string
}

export interface APIUser {
  id: number
  last_login: string
  is_superuser: boolean
  username: string
  first_name: string
  last_name: string
  email: string
  is_staff: boolean
  is_active: boolean
  date_joined: string
}

export interface APIUserSubscribeTokens {
  subscribe_id: number
  token: string
}

export interface APICsrf {
  csrf_token: string
}
