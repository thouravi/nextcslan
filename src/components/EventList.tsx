import type { CsEvent } from '../types'
import { cx } from '../lib/cx'
import { eventStatus, formatDateRange, statusLabel } from '../lib/dates'
import {
  Fact,
  IconCalendar,
  IconClock,
  IconPin,
  IconTicket,
} from './Icons'

type EventListProps = {
  events: CsEvent[]
  selectedId: string | null
  closestId: string | null
  onSelect: (id: string) => void
}

export function EventList({ events, selectedId, closestId, onSelect }: EventListProps) {
  const byDate = (a: CsEvent, b: CsEvent) => a.startDate.localeCompare(b.startDate)
  const upcoming = events
    .filter((event) => eventStatus(event) !== 'past')
    .sort((a, b) => {
      if (a.id === closestId) return -1
      if (b.id === closestId) return 1
      return byDate(a, b)
    })
  const past = events.filter((event) => eventStatus(event) === 'past').sort(byDate)

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <h2>Upcoming</h2>
        <span>{upcoming.length}</span>
      </div>

      {upcoming.length === 0 ? (
        <p className="empty">No upcoming events yet.</p>
      ) : (
        <ul className="event-list">
          {upcoming.map((event) => (
            <li key={event.id}>
              <EventCard
                event={event}
                selected={event.id === selectedId}
                closest={event.id === closestId}
                onSelect={onSelect}
              />
            </li>
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <>
          <div className="sidebar-head is-muted">
            <h2>Past</h2>
            <span>{past.length}</span>
          </div>
          <ul className="event-list">
            {past.map((event) => (
              <li key={event.id}>
                <EventCard
                  event={event}
                  selected={event.id === selectedId}
                  closest={false}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  )
}

function EventCard({
  event,
  selected,
  closest,
  onSelect,
}: {
  event: CsEvent
  selected: boolean
  closest: boolean
  onSelect: (id: string) => void
}) {
  const status = eventStatus(event)

  return (
    <div className={cx('event-card', selected && 'is-selected')}>
      <button
        type="button"
        className="event-card-main"
        onClick={() => onSelect(event.id)}
        aria-current={selected ? 'true' : undefined}
      >
        {closest && <span className="closest-badge">Closest to you</span>}
        <div className="event-card-top">
          <h3>{event.name}</h3>
          <span className={cx('when', status === 'live' && 'is-live')}>
            <IconClock />
            {statusLabel(event)}
          </span>
        </div>
        <div className="facts">
          <Fact icon={<IconPin />}>
            {event.city}, {event.country}
          </Fact>
          <Fact icon={<IconCalendar />}>
            {formatDateRange(event.startDate, event.endDate)}
          </Fact>
        </div>
      </button>
      {event.ticketUrl && (
        <a
          className="event-card-tickets"
          href={event.ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconTicket />
          Tickets
        </a>
      )}
    </div>
  )
}
