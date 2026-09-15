import { useEffect, useMemo, useState } from 'react'
import { Header, type MobileView, type StageView } from './components/Header'
import { EventList } from './components/EventList'
import { MapView } from './components/MapView'
import { CalendarView } from './components/CalendarView'
import { EventDetail } from './components/EventDetail'
import { WelcomeModal } from './components/WelcomeModal'
import { events } from './data/events'
import { closestUpcomingEvent } from './lib/closest'
import { countryByCode } from './lib/countries'
import { parseISODate, startOfToday } from './lib/dates'
import { readProfile, writeProfile, type Profile } from './lib/profile'
import { useMediaQuery } from './hooks/useMediaQuery'
import { cx } from './lib/cx'

function nextEventId(): string | null {
  const today = startOfToday()
  const sorted = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate))
  const upcoming = sorted.find((event) => parseISODate(event.endDate) >= today)
  return (upcoming ?? sorted[0])?.id ?? null
}

export default function App() {
  const isNarrow = useMediaQuery('(max-width: 860px)')
  const [view, setView] = useState<StageView>('map')
  const [mobileView, setMobileView] = useState<MobileView>('list')
  const [profile, setProfile] = useState<Profile | null>(() => readProfile())
  const [editingProfile, setEditingProfile] = useState(() => readProfile() === null)
  const [selectedId, setSelectedId] = useState<string | null>(nextEventId)
  const [focusTick, setFocusTick] = useState(0)

  const closest = useMemo(
    () => (profile ? closestUpcomingEvent(events, profile.countryCode) : null),
    [profile],
  )
  const you = useMemo(() => {
    if (!profile) return null
    const country = countryByCode(profile.countryCode)
    if (!country) return null
    return { ign: profile.ign, lat: country.lat, lng: country.lng }
  }, [profile])

  useEffect(() => {
    if (!closest) return
    setSelectedId(closest.id)
    setFocusTick((tick) => tick + 1)
  }, [closest])

  const selected = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [selectedId],
  )
  const stageView: MobileView = isNarrow ? mobileView : view

  function select(id: string | null) {
    setSelectedId(id)
    setFocusTick((tick) => tick + 1)
    if (id && isNarrow && mobileView === 'list') {
      setView('map')
      setMobileView('map')
    }
  }

  function saveProfile(next: Profile) {
    writeProfile(next)
    setProfile(next)
    setEditingProfile(false)
  }

  return (
    <div className="app">
      <Header
        view={view}
        mobileView={mobileView}
        isNarrow={isNarrow}
        profile={profile}
        onEditProfile={() => setEditingProfile(true)}
        onViewChange={setView}
        onMobileViewChange={setMobileView}
      />

      <div
        className={cx(
          'shell',
          isNarrow && `mobile-${mobileView}`,
        )}
      >
        <EventList
          events={events}
          selectedId={selectedId}
          closestId={closest?.id ?? null}
          onSelect={select}
        />

        <main className="stage">
          {stageView === 'map' && (
            <MapView
              events={events}
              selected={selected}
              you={you}
              onSelect={select}
              focusTick={focusTick}
            />
          )}
          {stageView === 'calendar' && (
            <CalendarView
              events={events}
              selected={selected}
              onSelect={select}
              focusTick={focusTick}
            />
          )}

          {selected && stageView !== 'list' && (
            <div className="detail-dock">
              <EventDetail event={selected} onClose={() => setSelectedId(null)} />
            </div>
          )}

          {!selected && stageView === 'map' && (
            <p className="map-hint">Click a pin or an event to see details</p>
          )}
        </main>
      </div>

      {editingProfile && (
        <WelcomeModal
          initial={profile}
          onSave={saveProfile}
          onCancel={profile ? () => setEditingProfile(false) : undefined}
        />
      )}
    </div>
  )
}
