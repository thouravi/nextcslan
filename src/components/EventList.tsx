import { useEffect, useMemo, useRef, useState } from 'react'
import type { CsEvent } from '../types'
import { cx } from '../lib/cx'
import { eventStatus, formatDateRange, statusLabel } from '../lib/dates'
import { distanceExplanation, formatDistanceFrom } from '../lib/geo'
import {
  Fact,
  IconCalendar,
  IconClock,
  IconClose,
  IconPin,
  IconSearch,
  IconTicket,
} from './Icons'

type EventListProps = {
  events: CsEvent[]
  selectedId: string | null
  closestId: string | null
  distances: Map<string, number> | null
  originName: string | null
  listVisible: boolean
  onSelect: (id: string) => void
  onEditProfile: () => void
}

export function EventList({
  events,
  selectedId,
  closestId,
  distances,
  originName,
  listVisible,
  onSelect,
  onEditProfile,
}: EventListProps) {
  const [query, setQuery] = useState('')
  const [pastOpen, setPastOpen] = useState(() => isPastSelection(events, selectedId))
  const [trackedSelection, setTrackedSelection] = useState(selectedId)
  const normalized = query.trim().toLowerCase()
  const filtering = normalized.length > 0

  if (selectedId !== trackedSelection) {
    setTrackedSelection(selectedId)
    if (isPastSelection(events, selectedId)) setPastOpen(true)
  }

  const filtered = useMemo(() => {
    if (!normalized) return events
    return events.filter((event) =>
      [event.name, event.city, event.country, event.venue, event.airport.code, event.airport.name]
        .join('\n')
        .toLowerCase()
        .includes(normalized),
    )
  }, [events, normalized])

  const byDate = (a: CsEvent, b: CsEvent) => a.startDate.localeCompare(b.startDate)
  const upcoming = filtered
    .filter((event) => eventStatus(event) !== 'past')
    .sort((a, b) => {
      if (a.id === closestId) return -1
      if (b.id === closestId) return 1
      return byDate(a, b)
    })
  const past = filtered.filter((event) => eventStatus(event) === 'past').sort(byDate)
  const showPast = filtering || pastOpen
  const nothing = filtering && upcoming.length === 0 && past.length === 0

  return (
    <aside id="events" className="sidebar" tabIndex={-1}>
      {!originName && (
        <button type="button" className="locate-prompt" onClick={onEditProfile}>
          Add your country to see which LAN is closest to you.
        </button>
      )}

      <div className="search">
        <IconSearch />
        <input
          type="search"
          aria-label="Search events"
          placeholder="Search city, event, venue"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && query) {
              event.preventDefault()
              setQuery('')
            }
          }}
        />
        {query && (
          <button
            type="button"
            className="search-clear"
            aria-label="Clear search"
            onClick={() => setQuery('')}
          >
            <IconClose width={14} height={14} />
          </button>
        )}
      </div>

      {nothing ? (
        <p className="empty">No events match "{query.trim()}".</p>
      ) : (
        <>
          <div className="sidebar-head">
            <h2>Upcoming</h2>
            <span>{upcoming.length}</span>
          </div>

          {upcoming.length === 0 ? (
            <p className="empty">
              {filtering ? 'No upcoming matches.' : 'No upcoming events yet.'}
            </p>
          ) : (
            <ul className="event-list">
              {upcoming.map((event) => (
                <li key={event.id}>
                  <EventCard
                    event={event}
                    selected={event.id === selectedId}
                    closest={event.id === closestId}
                    distanceKm={distances?.get(event.id) ?? null}
                    originName={originName}
                    listVisible={listVisible}
                    onSelect={onSelect}
                  />
                </li>
              ))}
            </ul>
          )}

          {past.length > 0 && !filtering && (
            <div className="sidebar-head is-muted">
              <h2>Past</h2>
              <button
                type="button"
                className="text-btn sidebar-past"
                aria-expanded={pastOpen}
                onClick={() => setPastOpen((open) => !open)}
              >
                {pastOpen ? 'Hide' : 'Show'} · {past.length}
              </button>
            </div>
          )}

          {past.length > 0 && filtering && (
            <div className="sidebar-head is-muted">
              <h2>Past</h2>
              <span>{past.length}</span>
            </div>
          )}

          {showPast && past.length > 0 && (
            <ul className="event-list">
              {past.map((event) => (
                <li key={event.id}>
                  <EventCard
                    event={event}
                    selected={event.id === selectedId}
                    closest={false}
                    distanceKm={distances?.get(event.id) ?? null}
                    originName={originName}
                    listVisible={listVisible}
                    onSelect={onSelect}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </aside>
  )
}

function isPastSelection(events: CsEvent[], selectedId: string | null): boolean {
  if (!selectedId) return false
  const selected = events.find((event) => event.id === selectedId)
  return selected ? eventStatus(selected) === 'past' : false
}

function EventCard({
  event,
  selected,
  closest,
  distanceKm,
  originName,
  listVisible,
  onSelect,
}: {
  event: CsEvent
  selected: boolean
  closest: boolean
  distanceKm: number | null
  originName: string | null
  listVisible: boolean
  onSelect: (id: string) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const status = eventStatus(event)
  const distanceLabel =
    distanceKm != null && originName ? formatDistanceFrom(distanceKm, originName) : null

  useEffect(() => {
    if (!selected || !listVisible) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    cardRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  }, [selected, listVisible])

  return (
    <div
      id={`event-${event.id}`}
      ref={cardRef}
      className={cx('event-card', selected && 'is-selected', status === 'live' && 'is-live')}
    >
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
          {distanceLabel && (
            <span className="distance" title={distanceExplanation(originName ?? '')}>
              {distanceLabel}
            </span>
          )}
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
