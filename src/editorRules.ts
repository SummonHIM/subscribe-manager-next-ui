import { validate as isUUID } from 'uuid'

/** 分组表单规则 */
export const groupRules = {
  gid: [
    (value: string) => {
      if (value.length === 0) {
        return "分组 ID 不得为空。"
      }
      if (!isUUID(value)) {
        return "分组 ID 格式必须为 UUID。"
      }
      return true
    }
  ],
  name: [
    (value: string) => {
      if (value.length === 0) {
        return "分组名称不得为空。"
      }
      if (value.length > 25) {
        return "分组名称的长度不得超过 25。"
      }
      return true
    }
  ]
}

/** 用户表单规则 */
export const userRules = {
  uid: [
    (value: string) => {
      if (value.length === 0) {
        return "用户 ID 不得为空。"
      }
      if (!isUUID(value)) {
        return "用户 ID 格式必须为 UUID。"
      }
      return true
    }
  ],
  username: [
    (value: string) => {
      if (value.length === 0) {
        return "用户名不得为空。"
      }
      if (value.length > 25) {
        return "用户名的长度不得超过 25。"
      }
      return true
    }
  ]
}

/** 分组订阅表单规则 */
export const subscribeRules = {
  sid: [
    (value: string) => {
      if (value.length === 0) {
        return "分组订阅 ID 不得为空。"
      }
      if (!isUUID(value)) {
        return "分组订阅 ID 格式必须为 UUID。"
      }
      return true
    }
  ],
  gid: [
    (value: string) => {
      if (value.length === 0) {
        return "分组 ID 不得为空。"
      }
      if (!isUUID(value)) {
        return "分组 ID 格式必须为 UUID。"
      }
      return true
    }
  ],
  order: [
    (value: number) => {
      if (value < 0 || value > 255) {
        return "分组订阅的排序需为小于等于 255 以内的无符号正整数。"
      }
      return true
    }
  ],
  name: [
    (value: string) => {
      if (value.length === 0) {
        return "分组订阅名称不得为空。"
      }
      if (value.length > 25) {
        return "分组订阅名称的字符长度不能超过 25。"
      }
      return true
    }
  ],
  url: [
    (value: string) => {
      if (value.length === 0) {
        return "分组订阅链接不得为空。"
      }
      if (value.length > 255) {
        return "分组订阅链接的字符长度不能超过 255。"
      }

      try { new URL(value) }
      catch { return "分组订阅链接不是一个合法的链接。" }

      return true
    }
  ]
}

/** 分组共享账号表单规则 */
export const shareRules = {
  gsid: [
    (value: string) => {
      if (value.length === 0) {
        return "分组共享账号 ID 不得为空。"
      }
      if (!isUUID(value)) {
        return "分组共享账号 ID 格式必须为 UUID。"
      }
      return true
    }
  ],
  gid: [
    (value: string) => {
      if (value.length === 0) {
        return "分组 ID 不得为空。"
      }
      if (!isUUID(value)) {
        return "分组 ID 格式必须为 UUID。"
      }
      return true
    }
  ],
  name: [
    (value: string) => {
      if (value.length === 0) {
        return "共享账号名称不得为空。"
      }
      if (value.length > 255) {
        return "共享账号名称的字符长度不能超过 255。"
      }
      return true
    }
  ],
  account: [
    (value: string) => {
      if (value.length === 0) {
        return "共享账号不得为空。"
      }
      if (value.length > 255) {
        return "共享账号的字符长度不能超过 255。"
      }
      return true
    }
  ],
  password: [
    (value: string) => {
      if (value.length === 0) {
        return "共享账号的密码不得为空。"
      }
      if (value.length > 255) {
        return "共享账号的密码字符长度不能超过 255。"
      }
      return true
    }
  ],
  manage: [
    (value: string) => {
      if (value.length === 0) {
        return "共享账号的官网不得为空。"
      }
      if (value.length > 255) {
        return "共享账号的官网字符长度不能超过 255。"
      }
      try { new URL(value) }
      catch { return "分组订阅链接不是一个合法的链接。" }
      return true
    }
  ],
  aff: [
    (value: string) => {
      if (value.length > 255) {
        return "共享账号的邀请码字符长度不能超过 255。"
      }
      return true
    }
  ]
}

/** 用户分组表单规则 */
export const userGroupRules = {
  ugid: [
    (value: string) => {
      if (value.length === 0) {
        return "用户分组 ID 不得为空。"
      }
      if (!isUUID(value)) {
        return "用户分组 ID 格式必须为 UUID。"
      }
      return true
    }
  ],
  uid: [
    (value: string | null) => {
      if (value === null) {
        return "用户 ID 不得为空。"
      }
      if (value.length === 0) {
        return "用户 ID 不得为空。"
      }
      if (!isUUID(value)) {
        return "用户 ID 格式必须为 UUID。"
      }
      return true
    }
  ],
  gid: [
    (value: string | null) => {
      if (value === null) {
        return "分组 ID 不得为空。"
      }
      if (value.length === 0) {
        return "分组 ID 不得为空。"
      }
      if (!isUUID(value)) {
        return "分组 ID 格式必须为 UUID。"
      }
      return true
    }
  ]
}

/** 用户令牌表单规则 */
export const userTokenRules = {
  token: [
    (value: string) => {
      if (value.length === 0) {
        return "用户令牌不得为空。"
      }
      if (!isUUID(value)) {
        return "用户令牌格式必须为 UUID。"
      }
      return true
    }
  ],
  uid: [
    (value: string) => {
      if (value.length === 0) {
        return "用户 ID 不得为空。"
      }
      if (!isUUID(value)) {
        return "用户 ID 格式必须为 UUID。"
      }
      return true
    }
  ],
  sid: [
    (value: string | null) => {
      if (value === null) {
        return "分组订阅 ID 不得为空。"
      }
      if (value.length === 0) {
        return "分组订阅 ID 不得为空。"
      }
      if (!isUUID(value)) {
        return "分组订阅 ID 格式必须为 UUID。"
      }
      return true
    }
  ]
}