import { useState, type FormEvent } from 'react'
import { countries } from '../lib/countries'
import type { Profile } from '../lib/profile'

type WelcomeModalProps = {
  initial: Profile | null
  onSave: (profile: Profile) => void
  onCancel?: () => void
}

export function WelcomeModal({ initial, onSave, onCancel }: WelcomeModalProps) {
  const [ign, setIgn] = useState(initial?.ign ?? '')
  const [countryCode, setCountryCode] = useState(initial?.countryCode ?? '')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const name = ign.trim()
    if (!name || !countryCode) return
    onSave({ ign: name, countryCode })
  }

  const editing = Boolean(initial)

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="welcome-card" onSubmit={handleSubmit}>
        <p className="welcome-kicker">{editing ? 'Your profile' : 'Welcome to NextCSLan'}</p>
        <h2>{editing ? 'Update your details' : 'Before we start'}</h2>
        <p className="welcome-copy">
          Tell us your in-game name and country so we can show the closest LAN to you.
        </p>

        <label className="field">
          <span>IGN</span>
          <input
            type="text"
            name="ign"
            autoComplete="nickname"
            autoFocus
            maxLength={32}
            placeholder="Your in-game name"
            value={ign}
            onChange={(e) => setIgn(e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Country</span>
          <select
            name="country"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            required
          >
            <option value="" disabled>
              Select your country
            </option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </label>

        <div className="welcome-actions">
          {editing && onCancel && (
            <button type="button" className="text-btn" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn-primary welcome-submit"
            disabled={!ign.trim() || !countryCode}
          >
            {editing ? 'Save' : 'Show closest LAN'}
          </button>
        </div>
      </form>
    </div>
  )
}
