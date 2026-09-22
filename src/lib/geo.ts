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
