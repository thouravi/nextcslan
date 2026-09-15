import type { CsEvent } from '../types'
import { countryByCode } from './countries'
import { eventStatus } from './dates'
import { distanceKm } from './geo'

export function closestUpcomingEvent(
  events: CsEvent[],
  countryCode: string,
): CsEvent | null {
  const origin = countryByCode(countryCode)
  const upcoming = events.filter((event) => eventStatus(event) !== 'past')
  if (upcoming.length === 0) return null
  if (!origin) return upcoming.slice().sort((a, b) => a.startDate.localeCompare(b.startDate))[0]

  return upcoming.reduce((best, event) =>
    distanceKm(origin, event) < distanceKm(origin, best) ? event : best,
  )
}
