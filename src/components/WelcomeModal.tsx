import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Profile } from '../lib/profile'
import { CountryField } from './CountryField'

type WelcomeModalProps = {
  initial: Profile | null
  onSave: (profile: Profile) => void
  onCancel?: () => void
  onSkip?: () => void
}

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)'

export function WelcomeModal({ initial, onSave, onCancel, onSkip }: WelcomeModalProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  )
  const [ign, setIgn] = useState(initial?.ign ?? '')
  const [countryCode, setCountryCode] = useState(initial?.countryCode ?? '')
  const editing = Boolean(initial)

  useEffect(() => {
    const target = restoreFocus.current
    return () => target?.focus()
  }, [])

  useEffect(() => {
    const node = formRef.current
    if (!node) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel?.()
        return
      }
      if (event.key !== 'Tab' || !node) return
      const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    node.addEventListener('keydown', onKeyDown)
    return () => node.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const name = ign.trim()
    if (!name || !countryCode) return
    onSave({ ign: name, countryCode })
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel?.()
      }}
    >
      <form
        ref={formRef}
        className="welcome-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        aria-describedby="welcome-copy"
        onSubmit={handleSubmit}
      >
        <p className="welcome-kicker">{editing ? 'Your profile' : 'Welcome to NextCSLan'}</p>
        <h2 id="welcome-title">{editing ? 'Update your details' : 'Where are you playing from?'}</h2>
        <p id="welcome-copy" className="welcome-copy">
          {editing
            ? 'Your name and country stay on this device. We use them to place you on the map and find the closest LAN.'
            : 'Add your in-game name and country to place yourself on the map and highlight the closest LAN. This stays on this device.'}
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
            onChange={(event) => setIgn(event.target.value)}
            required
          />
        </label>

        <CountryField value={countryCode} onChange={setCountryCode} />

        <div className="welcome-actions">
          {onCancel && (
            <button type="button" className="text-btn" onClick={onCancel}>
              Cancel
            </button>
          )}
          {!onCancel && onSkip && (
            <button type="button" className="text-btn" onClick={onSkip}>
              Browse events
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
