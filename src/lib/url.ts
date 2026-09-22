const PARAM = 'event'

export function readEventId(isKnown: (id: string) => boolean): string | null {
  const id = new URLSearchParams(window.location.search).get(PARAM)
  if (!id || !isKnown(id)) return null
  return id
}

export function writeEventId(id: string | null): void {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set(PARAM, id)
  else url.searchParams.delete(PARAM)
  const next = `${url.pathname}${url.search}${url.hash}`
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (next !== current) window.history.replaceState(null, '', next)
}
