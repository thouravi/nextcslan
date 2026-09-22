import { useMemo, useState } from 'react'
import type { CsEvent } from '../types'
import { cx } from '../lib/cx'
import {
  eventStatus,
  eventsOnDay,
  monthLabel,
  parseISODate,
  startOfToday,
  toISODate,
} from '../lib/dates'
import { shortEventName } from '../lib/names'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type CalendarViewProps = {
  events: CsEvent[]
  selected: CsEvent | null
  onSelect: (id: string | null) => void
  focusTick: number
}

export function CalendarView({ events, selected, onSelect, focusTick }: CalendarViewProps) {
  const today = startOfToday()
  const [cursor, setCursor] = useState(() => monthOf(selected, today))
  const selectedStamp = selected ? `${selected.id}:${focusTick}` : null
  const [trackedStamp, setTrackedStamp] = useState(selectedStamp)

  if (selected && selectedStamp !== trackedStamp) {
    setTrackedStamp(selectedStamp)
    setCursor(monthOf(selected, today))
  }

  const cells = useMemo(
    () => buildMonthCells(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  )
  const monthStartIso = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-01`
  const onThisMonth = cursor.year === today.getFullYear() && cursor.month === today.getMonth()

  function shiftMonth(delta: number) {
    const date = new Date(cursor.year, cursor.month + delta, 1)
    setCursor({ year: date.getFullYear(), month: date.getMonth() })
  }

  function jumpToday() {
    setCursor({ year: today.getFullYear(), month: today.getMonth() })
  }

  function chooseDay(dayEvents: CsEvent[]) {
    if (dayEvents.length === 0) return
    const current = dayEvents.findIndex((event) => event.id === selected?.id)
    const next = dayEvents[(current + 1) % dayEvents.length]
    onSelect(next.id)
  }

  return (
    <div className="calendar">
      <div className="calendar-toolbar">
        <h2 aria-live="polite">{monthLabel(cursor.year, cursor.month)}</h2>
        <div className="calendar-nav">
          <button
            type="button"
            className="text-btn"
            onClick={jumpToday}
            disabled={onThisMonth}
          >
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
          const inMonth = cell.date.getMonth() === cursor.month
          const pressed = selected ? dayEvents.some((event) => event.id === selected.id) : false
          const dateLabel = `${cell.date.getDate()} ${monthLabel(cell.date.getFullYear(), cell.date.getMonth())}`
          const marks = (
            <DayMarks
              events={dayEvents}
              iso={iso}
              inMonth={inMonth}
              monthStartIso={monthStartIso}
              selectedId={selected?.id ?? null}
            />
          )
          const className = cx(
            'cal-day',
            !inMonth && 'is-outside',
            isToday && 'is-today',
            dayEvents.length > 0 && 'has-event',
            pressed && 'is-selected',
          )

          if (dayEvents.length === 0) {
            return (
              <div key={iso} className={className}>
                <span className="cal-num">{cell.date.getDate()}</span>
              </div>
            )
          }

          return (
            <button
              key={iso}
              type="button"
              className={className}
              onClick={() => chooseDay(dayEvents)}
              aria-pressed={pressed}
              aria-label={
                dayEvents.length > 1
                  ? `${dateLabel}, ${dayEvents.map((event) => event.name).join(', ')}. Select next event on this day.`
                  : `${dateLabel}, ${dayEvents[0].name}`
              }
            >
              <span className="cal-num">{cell.date.getDate()}</span>
              {marks}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DayMarks({
  events,
  iso,
  inMonth,
  monthStartIso,
  selectedId,
}: {
  events: CsEvent[]
  iso: string
  inMonth: boolean
  monthStartIso: string
  selectedId: string | null
}) {
  const visible = events.slice(0, 2)
  const extra = events.length - visible.length

  return (
    <span className="cal-marks">
      {visible.map((event) => {
        const named = showsName(event, iso, inMonth, monthStartIso)
        const live = eventStatus(event) === 'live'
        const selected = event.id === selectedId
        if (!named) {
          return <span key={event.id} className={cx('cal-span', live && 'is-live', selected && 'is-selected')} />
        }
        return (
          <span
            key={event.id}
            className={cx('cal-event', live && 'is-live', selected && 'is-selected')}
          >
            {shortEventName(event.name)}
          </span>
        )
      })}
      {extra > 0 && <span className="cal-more">+{extra}</span>}
    </span>
  )
}

function showsName(event: CsEvent, iso: string, inMonth: boolean, monthStartIso: string): boolean {
  if (event.startDate === iso) return true
  if (!inMonth) return false
  return iso === monthStartIso && event.startDate < monthStartIso && event.endDate >= monthStartIso
}

function monthOf(selected: CsEvent | null, today: Date) {
  const seed = selected ? parseISODate(selected.startDate) : today
  return { year: seed.getFullYear(), month: seed.getMonth() }
}

function buildMonthCells(year: number, month: number) {
  const first = new Date(year, month, 1)
  const mondayIndex = (first.getDay() + 6) % 7
  const start = new Date(year, month, 1 - mondayIndex)
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return { date }
  })
}
