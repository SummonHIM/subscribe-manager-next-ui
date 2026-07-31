import QRCode from 'qrcode'

import type { APIGroupSubscribesUsage } from './interfaces'

/**
 * 生成导入URL Scheme
 * @param type 类型
 * @param url 链接
 * @param name 名称
 */
export function createImportScheme(
  type: string,
  url: string | undefined,
  name: string | undefined,
) {
  if (!url) return ''
  if (!name) name = '订阅'

  switch (type) {
    case 'clash':
      return (
        'clash://install-config?url=' +
        encodeURIComponent(url) +
        '&name=' +
        encodeURIComponent(name)
      )
    case 'surge':
      return 'surge:///install-config?url=' + encodeURIComponent(url)
    case 'surfboard':
      return 'surfboard:///install-config?url=' + encodeURIComponent(url)
    case 'singbox':
      return (
        'sing-box://import-remote-profile?url=' +
        encodeURIComponent(url) +
        '#' +
        encodeURIComponent(name)
      )
    case 'quantumultx':
      return (
        'quantumult-x:///update-configuration?remote-resource={%22server_remote%22:[%22' +
        encodeURIComponent(url) +
        ',tag=' +
        encodeURIComponent(name) +
        ']}'
      )
    case 'pure_url':
    default:
      return url
  }
}

/**
 * 生成二维码图片
 * @param type 类型
 * @param url 链接
 * @param name 名称
 * @returns 二维码图片
 */
export async function getQrCodeURL(
  type: string,
  url: string | undefined,
  name: string | undefined,
) {
  return await QRCode.toDataURL(createImportScheme(type, url, name), {
    width: 260,
    margin: 2,
  })
}

/**
 * 计算订阅流量用量百分比
 * @param info 用量信息
 * @returns 用量百分比
 */
export function calcUsagePercent(info: APIGroupSubscribesUsage): number | null {
  const { upload, download, total } = info

  if (upload === null || download === null || total === null || total <= 0) {
    return null
  }

  const used = upload + download
  const percent = (used / total) * 100

  return Number(percent.toFixed(2))
}

/**
 * 将字节转换为二进制单位
 * @param bytes 字节
 * @returns 二进制吉字节
 */
export function formatBytes(bytes: number | null): string | null {
  if (bytes === null || bytes < 0) return null

  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`
}
