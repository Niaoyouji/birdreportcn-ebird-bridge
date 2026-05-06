import type { BirdSession } from '../types.js'

export function buildLocationName(session: BirdSession): string {
  if (session.customLocationName) return session.customLocationName
  const city = session.city ? session.city.replace(/市$/, '') : ''
  if (city && session.specificLocation) return `${city}·${session.specificLocation}`
  if (session.specificLocation) return session.specificLocation
  if (city && session.district) {
    const district = session.district.replace(/区$/, '').replace(/县$/, '')
    return `${city}·${district}`
  }
  if (city) return city
  if (session.province) return session.province.replace(/省$/, '').replace(/市$/, '')
  return session.name || ''
}
