export type ClosestAirport = {
  name: string
  code: string
  distanceKm: number
}

export type CsEvent = {
  id: string
  name: string
  city: string
  country: string
  countryCode: string
  venue: string
  lat: number
  lng: number
  startDate: string
  endDate: string
  teamCount: number
  airport: ClosestAirport
  ticketUrl?: string
}

export type EventStatus = 'upcoming' | 'live' | 'past'
