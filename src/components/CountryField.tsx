import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { countries, countryByCode, type Country } from '../lib/countries'
import { cx } from '../lib/cx'

type CountryFieldProps = {
  value: string
  onChange: (code: string) => void
}

export function CountryField({ value, onChange }: CountryFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState(() => countryByCode(value)?.name ?? '')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return countries
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(needle) ||
        country.code.toLowerCase() === needle,
    )
  }, [query])

  const safeIndex = matches.length === 0 ? 0 : Math.min(activeIndex, matches.length - 1)
  const active = matches[safeIndex]

  useEffect(() => {
    if (!open || !active) return
    document.getElementById(`country-opt-${active.code}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  function choose(country: Country) {
    onChange(country.code)
    setQuery(country.name)
    setOpen(false)
  }

  function restoreQuery() {
    setQuery(countryByCode(value)?.name ?? '')
  }

  function openList() {
    setOpen(true)
    const index = matches.findIndex((country) => country.code === value)
    setActiveIndex(index >= 0 ? index : 0)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) openList()
      else setActiveIndex((index) => Math.min(index + 1, Math.max(matches.length - 1, 0)))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.max(index - 1, 0))
      return
    }
    if (event.key === 'Home' && open) {
      event.preventDefault()
      setActiveIndex(0)
      return
    }
    if (event.key === 'End' && open) {
      event.preventDefault()
      setActiveIndex(Math.max(matches.length - 1, 0))
      return
    }
    if (event.key === 'Enter' && open && active) {
      event.preventDefault()
      choose(active)
      return
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      restoreQuery()
    }
  }

  return (
    <div className="field">
      <span id="country-label">Country</span>
      <div className="country-field" ref={rootRef}>
        <input
          type="text"
          role="combobox"
          name="country"
          aria-labelledby="country-label"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="country-listbox"
          aria-activedescendant={open && active ? `country-opt-${active.code}` : undefined}
          aria-required="true"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search countries"
          value={query}
          onChange={(event) => {
            const next = event.target.value
            setQuery(next)
            setOpen(true)
            setActiveIndex(0)
            const exact = countries.find(
              (country) => country.name.toLowerCase() === next.trim().toLowerCase(),
            )
            onChange(exact?.code ?? '')
          }}
          onFocus={openList}
          onBlur={(event) => {
            const next = event.relatedTarget
            if (next instanceof Node && rootRef.current?.contains(next)) return
            setOpen(false)
            restoreQuery()
          }}
          onKeyDown={handleKeyDown}
        />
        {open && (
          <ul
            id="country-listbox"
            className="country-menu"
            role="listbox"
            aria-labelledby="country-label"
          >
            {matches.length === 0 ? (
              <li className="country-empty">No matching country</li>
            ) : (
              matches.map((country, index) => (
                <li
                  key={country.code}
                  id={`country-opt-${country.code}`}
                  role="option"
                  aria-selected={country.code === value}
                  className={cx('country-option', index === safeIndex && 'is-active')}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(country)}
                >
                  {country.name}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
