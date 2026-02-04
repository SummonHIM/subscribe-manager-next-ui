import QRCode from 'qrcode'

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
    default:
      return ''
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
