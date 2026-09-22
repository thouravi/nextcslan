import { cx } from '../lib/cx'
import { countryByCode } from '../lib/countries'
import type { Profile } from '../lib/profile'

export type StageView = 'map' | 'calendar'
export type MobileView = 'list' | StageView

type NextUp = {
  label: string
  aria: string
}

type HeaderProps = {
  view: StageView
  mobileView: MobileView
  isNarrow: boolean
  profile: Profile | null
  nextUp: NextUp | null
  onEditProfile: () => void
  onShowNext: () => void
  onViewChange: (view: StageView) => void
  onMobileViewChange: (view: MobileView) => void
}

export function Header({
  view,
  mobileView,
  isNarrow,
  profile,
  nextUp,
  onEditProfile,
  onShowNext,
  onViewChange,
  onMobileViewChange,
}: HeaderProps) {
  const country = profile ? countryByCode(profile.countryCode) : undefined

  return (
    <header className="header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          CS
        </span>
        <div className="brand-text">
          <strong>NextCSLan</strong>
          {nextUp ? (
            <button
              type="button"
              className="brand-next"
              onClick={onShowNext}
              aria-label={nextUp.aria}
            >
              {nextUp.label}
            </button>
          ) : (
            <span>When and where the next LANs are</span>
          )}
        </div>
      </div>

      <div className="header-right">
        {profile ? (
          <button
            type="button"
            className="profile-chip"
            onClick={onEditProfile}
            aria-label={`Edit profile, ${profile.ign}${country ? `, ${country.name}` : ''}`}
          >
            <span className="profile-ign">{profile.ign}</span>
            {country && <span className="profile-country">{country.name}</span>}
          </button>
        ) : (
          <button type="button" className="text-btn" onClick={onEditProfile}>
            Add location
          </button>
        )}
      </div>

      {isNarrow ? (
        <nav className="view-toggle" aria-label="Views">
          <ToggleButton
            active={mobileView === 'list'}
            onClick={() => onMobileViewChange('list')}
          >
            Events
          </ToggleButton>
          <ToggleButton
            active={mobileView === 'map'}
            onClick={() => {
              onMobileViewChange('map')
              onViewChange('map')
            }}
          >
            Map
          </ToggleButton>
          <ToggleButton
            active={mobileView === 'calendar'}
            onClick={() => {
              onMobileViewChange('calendar')
              onViewChange('calendar')
            }}
          >
            Calendar
          </ToggleButton>
        </nav>
      ) : (
        <nav className="view-toggle" aria-label="Views">
          <ToggleButton active={view === 'map'} onClick={() => onViewChange('map')}>
            Map
          </ToggleButton>
          <ToggleButton active={view === 'calendar'} onClick={() => onViewChange('calendar')}>
            Calendar
          </ToggleButton>
        </nav>
      )}
    </header>
  )
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      className={cx('toggle-btn', active && 'is-active')}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
