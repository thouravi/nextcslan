import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Header, type MobileView, type StageView } from './components/Header'
import { EventList } from './components/EventList'
import { CalendarView } from './components/CalendarView'
import { EventDetail } from './components/EventDetail'
import { WelcomeModal } from './components/WelcomeModal'
import { events } from './data/events'
import { closestUpcomingEvent } from './lib/closest'
import { countryByCode } from './lib/countries'
import { cx } from './lib/cx'
import { parseISODate, startOfToday, statusLabel } from './lib/dates'
import { distanceKm } from './lib/geo'
import { shortEventName } from './lib/names'
import { readProfile, readSkipped, writeProfile, writeSkipped, type Profile } from './lib/profile'
import { readEventId, writeEventId } from './lib/url'
import { useMediaQuery } from './hooks/useMediaQuery'
import type { YouAreHere } from './components/MapView'

const MapView = lazy(() =>
  import('./components/MapView').then((module) => ({ default: module.MapView })),
)

function knownEvent(id: string): boolean {
  return events.some((event) => event.id === id)
}

function nextEventId(): string | null {
  const today = startOfToday()
  const sorted = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate))
  const upcoming = sorted.find((event) => parseISODate(event.endDate) >= today)
  return (upcoming ?? sorted[0])?.id ?? null
}

export default function App() {
  const isNarrow = useMediaQuery('(max-width: 860px)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [view, setView] = useState<StageView>('map')
  const [mobileView, setMobileView] = useState<MobileView>('list')
  const [profile, setProfile] = useState<Profile | null>(() => readProfile())
  const [skipped, setSkipped] = useState(() => readSkipped())
  const [editingProfile, setEditingProfile] = useState(
    () => readProfile() === null && !readSkipped(),
  )
  const [selectedId, setSelectedId] = useState<string | null>(
    () => readEventId(knownEvent) ?? nextEventId(),
  )
  const [focusTick, setFocusTick] = useState(0)
  const [mapReady, setMapReady] = useState(false)
  const [followClosest, setFollowClosest] = useState(() => readEventId(knownEvent) === null)

  const closest = useMemo(
    () => (profile ? closestUpcomingEvent(events, profile.countryCode) : null),
    [profile],
  )
  const you = useMemo<YouAreHere | null>(() => {
    if (!profile) return null
    const country = countryByCode(profile.countryCode)
    if (!country) return null
    return { ign: profile.ign, countryName: country.name, lat: country.lat, lng: country.lng }
  }, [profile])
  const distances = useMemo(() => {
    if (!you) return null
    const result = new Map<string, number>()
    for (const event of events) result.set(event.id, distanceKm(you, event))
    return result
  }, [you])

  const selected = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [selectedId],
  )
  const today = startOfToday()
  const nextUp =
    [...events]
      .filter((event) => parseISODate(event.endDate) >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null
  const stageView: MobileView = isNarrow ? mobileView : view

  if (followClosest && closest && selectedId !== closest.id) {
    setSelectedId(closest.id)
  }

  if (!mapReady && !editingProfile && stageView === 'map') {
    setMapReady(true)
  }

  useEffect(() => {
    writeEventId(selectedId)
    document.title = selected ? `${selected.name} · NextCSLan` : 'NextCSLan'
  }, [selected, selectedId])

  useEffect(() => {
    if (!editingProfile || isNarrow) return
    const id = window.setTimeout(() => {
      void import('./components/MapView')
    }, 300)
    return () => window.clearTimeout(id)
  }, [editingProfile, isNarrow])

  function select(id: string | null) {
    setFollowClosest(false)
    setSelectedId(id)
    setFocusTick((tick) => tick + 1)
    if (id && isNarrow && mobileView === 'list') {
      setView('map')
      setMobileView('map')
    }
  }

  function saveProfile(next: Profile) {
    writeProfile(next)
    setFollowClosest(true)
    setProfile(next)
    setEditingProfile(false)
  }

  function skipProfile() {
    writeSkipped()
    setSkipped(true)
    setEditingProfile(false)
  }

  const selectedDistance =
    selected && distances ? (distances.get(selected.id) ?? null) : null

  return (
    <div className="app">
      <a className="skip-link" href="#events">
        Skip to events
      </a>
      <Header
        view={view}
        mobileView={mobileView}
        isNarrow={isNarrow}
        profile={profile}
        nextUp={
          nextUp
            ? {
                label: `Next · ${shortEventName(nextUp.name)} · ${statusLabel(nextUp)}`,
                aria: `Show ${nextUp.name}`,
              }
            : null
        }
        onEditProfile={() => setEditingProfile(true)}
        onShowNext={() => {
          if (nextUp) select(nextUp.id)
        }}
        onViewChange={setView}
        onMobileViewChange={setMobileView}
      />

      <div className={cx('shell', isNarrow && `mobile-${mobileView}`)}>
        <EventList
          events={events}
          selectedId={selectedId}
          closestId={closest?.id ?? null}
          distances={distances}
          originName={you?.countryName ?? null}
          listVisible={!isNarrow || mobileView === 'list'}
          onSelect={select}
          onEditProfile={() => setEditingProfile(true)}
        />

        <main className="stage">
          {mapReady && (
            <div
              className={cx('map-pane', stageView !== 'map' && 'is-hidden')}
              inert={stageView !== 'map'}
            >
              <Suspense fallback={<div className="map-fallback" role="status">Loading map…</div>}>
                <MapView
                  events={events}
                  selected={selected}
                  you={you}
                  onSelect={select}
                  focusTick={focusTick}
                  visible={stageView === 'map'}
                  reducedMotion={reducedMotion}
                />
              </Suspense>
            </div>
          )}

          {stageView === 'calendar' && (
            <CalendarView
              events={events}
              selected={selected}
              onSelect={select}
              focusTick={focusTick}
            />
          )}

          {selected && stageView !== 'list' && !editingProfile && (
            <div className="detail-dock">
              <EventDetail
                event={selected}
                distanceKm={selectedDistance}
                originName={you?.countryName ?? null}
                onClose={() => select(null)}
              />
            </div>
          )}

          {!selected && stageView === 'map' && (
            <p className="map-hint">
              {you ? 'Blue dot is you. Choose a pin for details.' : 'Choose a pin or an event for details.'}
            </p>
          )}
        </main>
      </div>

      {editingProfile && (
        <WelcomeModal
          initial={profile}
          onSave={saveProfile}
          onCancel={profile || skipped ? () => setEditingProfile(false) : undefined}
          onSkip={profile ? undefined : skipProfile}
        />
      )}
    </div>
  )
}
