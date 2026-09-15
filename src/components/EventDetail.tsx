import type { CsEvent } from '../types'
import { formatDateRange, statusLabel, eventStatus } from '../lib/dates'
import { cx } from '../lib/cx'
import {
  Fact,
  IconArena,
  IconCalendar,
  IconClock,
  IconClose,
  IconPin,
  IconPlane,
  IconTicket,
  IconUsers,
} from './Icons'

type EventDetailProps = {
  event: CsEvent
  onClose: () => void
}

export function EventDetail({ event, onClose }: EventDetailProps) {
  const status = eventStatus(event)

  return (
    <article className="detail-card" aria-label={event.name}>
      <div className="detail-main">
        <div className="detail-kicker">
          <span className={cx('when', status === 'live' && 'is-live')}>
            <IconClock />
            {statusLabel(event)}
          </span>
        </div>
        <h2>{event.name}</h2>
        <div className="facts">
          <Fact icon={<IconArena />}>{event.venue}</Fact>
          <Fact icon={<IconPin />}>
            {event.city}, {event.country}
          </Fact>
          <Fact icon={<IconCalendar />}>
            {formatDateRange(event.startDate, event.endDate)}
          </Fact>
          <Fact icon={<IconUsers />}>{event.teamCount} teams</Fact>
          <Fact icon={<IconPlane />}>
            {event.airport.name} ({event.airport.code}) · {event.airport.distanceKm} km
          </Fact>
        </div>
      </div>

      <div className="detail-actions">
        {event.ticketUrl && (
          <a
            className="btn-primary"
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconTicket />
            Get tickets
          </a>
        )}
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
          <IconClose />
        </button>
      </div>
    </article>
  )
}
