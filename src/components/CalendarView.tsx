import { useEffect, useMemo, useState } from 'react'
import type { CsEvent } from '../types'
import { cx } from '../lib/cx'
import {
  eventsOnDay,
  monthLabel,
  parseISODate,
  startOfToday,
  toISODate,
} from '../lib/dates'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type CalendarViewProps = {
  events: CsEvent[]
  selected: CsEvent | null
  onSelect: (id: string | null) => void
  focusTick: number
}

export function CalendarView({ events, selected, onSelect, focusTick }: CalendarViewProps) {
  const today = startOfToday()
  const [cursor, setCursor] = useState(() => {
    const seed = selected ? parseISODate(selected.startDate) : today
    return { year: seed.getFullYear(), month: seed.getMonth() }
  })

  useEffect(() => {
    if (!selected) return
    const date = parseISODate(selected.startDate)
    setCursor({ year: date.getFullYear(), month: date.getMonth() })
  }, [selected, focusTick])

  const cells = useMemo(
    () => buildMonthCells(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  )

  function shiftMonth(delta: number) {
    const date = new Date(cursor.year, cursor.month + delta, 1)
    setCursor({ year: date.getFullYear(), month: date.getMonth() })
  }

  function jumpToday() {
    setCursor({ year: today.getFullYear(), month: today.getMonth() })
  }

  return (
    <div className="calendar">
      <div className="calendar-toolbar">
        <h2>{monthLabel(cursor.year, cursor.month)}</h2>
        <div className="calendar-nav">
          <button type="button" className="text-btn" onClick={jumpToday}>
            Today
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="cal-weekdays">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((cell) => {
          const iso = toISODate(cell.date)
          const dayEvents = eventsOnDay(events, iso)
          const isToday = iso === toISODate(today)
          const isSelectedDay = selected
            ? selected.startDate <= iso && selected.endDate >= iso
            : false
          const inMonth = cell.date.getMonth() === cursor.month

          return (
            <button
              key={iso}
              type="button"
              className={cx(
                'cal-day',
                !inMonth && 'is-outside',
                isToday && 'is-today',
                dayEvents.length > 0 && 'has-event',
                isSelectedDay && 'is-selected',
              )}
              disabled={dayEvents.length === 0}
              onClick={() => onSelect(dayEvents[0]?.id ?? null)}
              aria-label={
                dayEvents.length > 0
                  ? `${cell.date.getDate()} ${monthLabel(cursor.year, cursor.month)}, ${dayEvents[0].name}`
                  : `${cell.date.getDate()}`
              }
            >
              <span className="cal-num">{cell.date.getDate()}</span>
              {inMonth && dayEvents[0] && cell.date.getDate() === parseISODate(dayEvents[0].startDate).getDate() && (
                <span className="cal-event">{shortName(dayEvents[0].name)}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function shortName(name: string): string {
  return name
    .replace('ESL Pro League Season ', 'EPL S')
    .replace('Intel Extreme Masters ', 'IEM ')
    .replace('BLAST Rivals Fall', 'BLAST Fall')
    .replace('PGL Major ', 'PGL ')
    .replace(/ 20\d{2}$/, '')
}

function buildMonthCells(year: number, month: number) {
  const first = new Date(year, month, 1)
  const mondayIndex = (first.getDay() + 6) % 7
  const start = new Date(year, month, 1 - mondayIndex)
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    return { date }
  })
}
