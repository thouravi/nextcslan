export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const earthKm = 6371
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * earthKm * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function formatDistanceFrom(km: number, place: string): string {
  const rounded = km < 100 ? Math.max(1, Math.round(km)) : Math.round(km / 10) * 10
  return `≈ ${rounded.toLocaleString('en-US')} km from ${place}`
}

export function distanceExplanation(place: string): string {
  return `Straight-line distance from the capital of ${place}. Your profile uses a country, not an exact city.`
}

export type FlightPath = {
  segments: [number, number][][]
  plane: { lat: number; lng: number; bearing: number } | null
}

const EARTH_KM = 6371

// Bow the great-circle route to the left of travel so it reads as a flight arc,
// then split it where it crosses the antimeridian so the line does not streak
// across the whole map.
export function flightPath(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): FlightPath {
  const distance = distanceKm(from, to)
  if (distance < 20) return { segments: [], plane: null }

  const delta = distance / EARTH_KM
  const steps = Math.round(Math.min(72, Math.max(28, distance / 120)))
  const bulgeKm = Math.min(1800, distance * (distance < 700 ? 0.34 : 0.22))
  const start = toVector(from.lat, from.lng)
  const end = toVector(to.lat, to.lng)
  const raw: { lat: number; lng: number }[] = []

  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps
    const point = slerp(start, end, t, delta)
    const ahead = slerp(start, end, Math.min(1, t + 1 / steps), delta)
    const lifted = liftLeft(point, ahead, (bulgeKm / EARTH_KM) * Math.sin(Math.PI * t))
    raw.push(fromVector(lifted))
  }

  const continuous = unwrapLongitudes(raw)
  const segments = splitAtDateline(continuous)
  const crest = continuous[Math.floor(continuous.length / 2)]
  const after = continuous[Math.min(continuous.length - 1, Math.floor(continuous.length / 2) + 1)]
  const before = continuous[Math.max(0, Math.floor(continuous.length / 2) - 1)]

  return {
    segments,
    plane: {
      lat: crest.lat,
      lng: wrap180(crest.lng),
      bearing: bearingDegrees(before, after),
    },
  }
}

function toVector(lat: number, lng: number) {
  const φ = (lat * Math.PI) / 180
  const λ = (lng * Math.PI) / 180
  return {
    x: Math.cos(φ) * Math.cos(λ),
    y: Math.cos(φ) * Math.sin(λ),
    z: Math.sin(φ),
  }
}

function fromVector(vector: { x: number; y: number; z: number }) {
  return {
    lat: (Math.atan2(vector.z, Math.hypot(vector.x, vector.y)) * 180) / Math.PI,
    lng: (Math.atan2(vector.y, vector.x) * 180) / Math.PI,
  }
}

function slerp(
  start: { x: number; y: number; z: number },
  end: { x: number; y: number; z: number },
  t: number,
  delta: number,
) {
  const sinDelta = Math.sin(delta)
  if (sinDelta < 1e-6) return start
  const a = Math.sin((1 - t) * delta) / sinDelta
  const b = Math.sin(t * delta) / sinDelta
  return {
    x: a * start.x + b * end.x,
    y: a * start.y + b * end.y,
    z: a * start.z + b * end.z,
  }
}

function liftLeft(
  point: { x: number; y: number; z: number },
  ahead: { x: number; y: number; z: number },
  lift: number,
) {
  let tx = ahead.x - point.x
  let ty = ahead.y - point.y
  let tz = ahead.z - point.z
  const radial = tx * point.x + ty * point.y + tz * point.z
  tx -= radial * point.x
  ty -= radial * point.y
  tz -= radial * point.z
  const lx = point.y * tz - point.z * ty
  const ly = point.z * tx - point.x * tz
  const lz = point.x * ty - point.y * tx
  const length = Math.hypot(lx, ly, lz) || 1
  const cosine = Math.cos(lift)
  const sine = Math.sin(lift)
  return {
    x: point.x * cosine + (lx / length) * sine,
    y: point.y * cosine + (ly / length) * sine,
    z: point.z * cosine + (lz / length) * sine,
  }
}

function unwrapLongitudes(points: { lat: number; lng: number }[]) {
  const unwrapped = [{ ...points[0] }]
  for (let index = 1; index < points.length; index += 1) {
    let lng = points[index].lng
    const previous = unwrapped[index - 1].lng
    while (lng - previous > 180) lng -= 360
    while (previous - lng > 180) lng += 360
    unwrapped.push({ lat: points[index].lat, lng })
  }
  return unwrapped
}

function splitAtDateline(points: { lat: number; lng: number }[]) {
  const segments: [number, number][][] = []
  let current: [number, number][] = [[points[0].lat, wrap180(points[0].lng)]]

  for (let index = 1; index < points.length; index += 1) {
    const wrapped = wrap180(points[index].lng)
    const previous = current[current.length - 1][1]
    if (Math.abs(wrapped - previous) > 180) {
      const edge = previous > 0 ? 180 : -180
      current.push([points[index].lat, edge])
      if (current.length >= 2) segments.push(current)
      current = [[points[index].lat, -edge], [points[index].lat, wrapped]]
      continue
    }
    current.push([points[index].lat, wrapped])
  }

  if (current.length >= 2) segments.push(current)
  return segments
}

function wrap180(lng: number) {
  return (((lng + 180) % 360) + 360) % 360 - 180
}

function bearingDegrees(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) {
  const φ1 = (from.lat * Math.PI) / 180
  const φ2 = (to.lat * Math.PI) / 180
  const Δλ = ((to.lng - from.lng) * Math.PI) / 180
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return (Math.atan2(y, x) * 180) / Math.PI
}
