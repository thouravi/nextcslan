const STORAGE_KEY = 'nextcslan.profile'
const SKIP_KEY = 'nextcslan.skip'

export type Profile = {
  ign: string
  countryCode: string
}

export function readProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Profile>
    if (!parsed.ign?.trim() || !parsed.countryCode) return null
    return { ign: parsed.ign.trim(), countryCode: parsed.countryCode }
  } catch {
    return null
  }
}

export function writeProfile(profile: Profile): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ign: profile.ign.trim(), countryCode: profile.countryCode }),
  )
}

export function readSkipped(): boolean {
  try {
    return localStorage.getItem(SKIP_KEY) === '1'
  } catch {
    return false
  }
}

export function writeSkipped(): void {
  localStorage.setItem(SKIP_KEY, '1')
}
