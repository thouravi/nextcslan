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
  if (!origin) {
    return upcoming.reduce((soonest, event) =>
      event.startDate < soonest.startDate ? event : soonest,
    )
  }

  let best = upcoming[0]
  let bestKm = distanceKm(origin, best)
  for (const event of upcoming.slice(1)) {
    const km = distanceKm(origin, event)
    const closer = km < bestKm - 0.5
    const tieSooner = Math.abs(km - bestKm) <= 0.5 && event.startDate < best.startDate
    if (closer || tieSooner) {
      best = event
      bestKm = km
    }
  }
  return best
}
