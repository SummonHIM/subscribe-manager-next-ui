import { isAxiosError } from 'axios'

/**
 * 生成错误信息
 * @param error 错误
 * @returns 字段错误信息，错误信息
 */
export function parseAPIError<T>(error: unknown): {
  fieldErrors: Partial<Record<keyof T, string>>
  messages: string[]
} {
  if (!isAxiosError(error)) {
    return {
      fieldErrors: {},
      messages: ['未知错误'],
    }
  }

  const data = error.response?.data
  if (!data || typeof data !== 'object') {
    return {
      fieldErrors: {},
      messages: ['请求失败，请稍后重试'],
    }
  }

  // detail
  if ('detail' in data && typeof data.detail === 'string') {
    return {
      fieldErrors: {},
      messages: [data.detail],
    }
  }

  const fieldErrors: Partial<Record<keyof T, string>> = {}
  const messages: string[] = []

  // non_field_errors
  if ('non_field_errors' in data && Array.isArray(data.non_field_errors)) {
    messages.push(...data.non_field_errors)
  }

  // 字段错误
  for (const key of Object.keys(data)) {
    if (key === 'non_field_errors') continue

    const value = (data as Record<string, unknown>)[key]
    if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
      fieldErrors[key as keyof T] = value.join('，')
      value.forEach((v) => messages.push(`${key}：${v}`))
    }
  }

  return { fieldErrors, messages }
}
