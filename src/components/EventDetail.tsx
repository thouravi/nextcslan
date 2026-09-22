import type { CsEvent } from '../types'
import { formatDateRange, statusLabel, eventStatus } from '../lib/dates'
import { distanceExplanation, formatDistanceFrom } from '../lib/geo'
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
  distanceKm: number | null
  originName: string | null
  onClose: () => void
}

export function EventDetail({ event, distanceKm, originName, onClose }: EventDetailProps) {
  const status = eventStatus(event)
  const distanceLabel =
    distanceKm != null && originName ? formatDistanceFrom(distanceKm, originName) : null
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.lat},${event.lng}`)}`

  return (
    <article className="detail-card" aria-label={event.name}>
      <div className="detail-main">
        <div className="detail-kicker">
          <span className={cx('when', status === 'live' && 'is-live')}>
            <IconClock />
            {statusLabel(event)}
          </span>
          {distanceLabel && (
            <span className="distance" title={distanceExplanation(originName ?? '')}>
              {distanceLabel}
            </span>
          )}
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
        <a className="text-btn" href={mapsUrl} target="_blank" rel="noopener noreferrer">
          Directions
        </a>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
          <IconClose />
        </button>
      </div>
    </article>
  )
}
