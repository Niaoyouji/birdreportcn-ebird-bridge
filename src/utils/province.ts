import { PROVINCE_CODES } from '../data.js'

export function getProvinceCode(provinceName: string | undefined | null): string {
  if (!provinceName) return ''
  return PROVINCE_CODES[provinceName] || ''
}
