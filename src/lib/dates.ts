import type { CsEvent, EventStatus } from '../types'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function diffDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

export function eventStatus(event: CsEvent, today = startOfToday()): EventStatus {
  const start = parseISODate(event.startDate)
  const end = parseISODate(event.endDate)
  if (today < start) return 'upcoming'
  if (today > end) return 'past'
  return 'live'
}

export function formatDateRange(startIso: string, endIso: string): string {
  const start = parseISODate(startIso)
  const end = parseISODate(endIso)
  const sameDay = startIso === endIso
  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  const sameYear = start.getFullYear() === end.getFullYear()

  if (sameDay) {
    return `${MONTHS[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`
  }
  if (sameMonth) {
    return `${MONTHS[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`
  }
  if (sameYear) {
    return `${MONTHS[start.getMonth()]} ${start.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`
  }
  return `${MONTHS[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()} – ${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`
}

export function statusLabel(event: CsEvent, today = startOfToday()): string {
  const status = eventStatus(event, today)
  if (status === 'live') return 'Live now'
  if (status === 'past') return 'Ended'
  const days = diffDays(today, parseISODate(event.startDate))
  if (days === 0) return 'Starts today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

export function monthLabel(year: number, month: number): string {
  return `${MONTHS[month]} ${year}`
}

export function eventsOnDay(eventList: CsEvent[], iso: string): CsEvent[] {
  return eventList.filter((event) => event.startDate <= iso && event.endDate >= iso)
}
