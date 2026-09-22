import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { CsEvent } from '../types'
import { cx } from '../lib/cx'
import { circleFlagUrl, flagEmoji } from '../lib/flags'
import { distanceKm, flightPath } from '../lib/geo'

export type YouAreHere = {
  ign: string
  countryName: string
  lat: number
  lng: number
}

type MapViewProps = {
  events: CsEvent[]
  selected: CsEvent | null
  you: YouAreHere | null
  onSelect: (id: string | null) => void
  focusTick: number
  visible: boolean
  reducedMotion: boolean
}

const WORLD_CENTER: L.LatLngExpression = [28, 12]
const WORLD_ZOOM = 2.4
const CITY_ZOOM = 11

export function MapView({
  events,
  selected,
  you,
  onSelect,
  focusTick,
  visible,
  reducedMotion,
}: MapViewProps) {
  return (
    <MapContainer
      className="map"
      center={selected ? [selected.lat, selected.lng] : WORLD_CENTER}
      zoom={selected ? 5 : WORLD_ZOOM}
      minZoom={2}
      maxZoom={16}
      worldCopyJump
      scrollWheelZoom
      zoomAnimation={!reducedMotion}
      fadeAnimation={!reducedMotion}
      markerZoomAnimation={!reducedMotion}
    >
      <TileLayer
        attribution="Tiles &copy; Esri"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        updateWhenZooming={false}
        keepBuffer={2}
      />
      <MapBehavior
        selected={selected}
        you={you}
        onSelect={onSelect}
        focusTick={focusTick}
        visible={visible}
        reducedMotion={reducedMotion}
      />
      {you && selected && <FlightRoute from={you} to={selected} />}
      {you && <YouMarker you={you} />}
      {events.map((event) => (
        <EventMarker
          key={event.id}
          event={event}
          selected={selected?.id === event.id}
          onSelect={onSelect}
        />
      ))}
    </MapContainer>
  )
}

function MapBehavior({
  selected,
  you,
  onSelect,
  focusTick,
  visible,
  reducedMotion,
}: {
  selected: CsEvent | null
  you: YouAreHere | null
  onSelect: (id: string | null) => void
  focusTick: number
  visible: boolean
  reducedMotion: boolean
}) {
  const map = useMap()
  const lastFlight = useRef('')
  const flightKey = `${selected?.id ?? ''}:${focusTick}:${you?.lat ?? ''}:${you?.lng ?? ''}`

  useEffect(() => {
    map.attributionControl?.setPosition('topright')
  }, [map])

  useEffect(() => {
    if (!visible) return
    let inner = 0
    const outer = requestAnimationFrame(() => {
      map.invalidateSize()
      if (lastFlight.current === flightKey) return
      inner = requestAnimationFrame(() => {
        lastFlight.current = flightKey
        flyToSelection(map, selected, you, reducedMotion)
      })
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [map, selected, you, flightKey, visible, reducedMotion])

  useMapEvents({
    click: (event) => {
      const target = event.originalEvent.target
      if (target instanceof Element && target.closest('.map-pin, .you-dot, .flight-route')) return
      onSelect(null)
    },
  })

  return null
}

function flyToSelection(
  map: L.Map,
  selected: CsEvent | null,
  you: YouAreHere | null,
  reducedMotion: boolean,
) {
  if (selected && you && distanceKm(you, selected) >= 20) {
    const path = flightPath(you, selected)
    const km = distanceKm(you, selected)
    const padding = {
      paddingTopLeft: [56, 72] as L.PointExpression,
      paddingBottomRight: [56, 210] as L.PointExpression,
      maxZoom: km > 2500 ? 4 : km > 700 ? 5 : 8,
    }
    const route = path.segments.length === 1 ? path.segments[0] : null
    if (route) {
      const bounds = L.latLngBounds(route)
      if (reducedMotion) map.fitBounds(bounds, { ...padding, animate: false })
      else map.flyToBounds(bounds, { ...padding, duration: 0.9 })
      return
    }
    if (path.plane) {
      const zoom = Math.max(2, Math.min(padding.maxZoom, Math.log2(40000 / km)))
      const center: L.LatLngExpression = [path.plane.lat, path.plane.lng]
      if (reducedMotion) map.setView(center, zoom, { animate: false })
      else map.flyTo(center, zoom, { duration: 0.9 })
      return
    }
  }

  if (selected) {
    const center: L.LatLngExpression = [selected.lat, selected.lng]
    if (reducedMotion) map.setView(center, CITY_ZOOM, { animate: false })
    else map.flyTo(center, CITY_ZOOM, { duration: 0.85 })
    return
  }

  if (reducedMotion) map.setView(WORLD_CENTER, WORLD_ZOOM, { animate: false })
  else map.flyTo(WORLD_CENTER, WORLD_ZOOM, { duration: 0.7 })
}

function FlightRoute({
  from,
  to,
}: {
  from: { lat: number; lng: number }
  to: { lat: number; lng: number }
}) {
  const path = useMemo(() => flightPath(from, to), [from, to])
  const planeIcon = useMemo(() => {
    if (!path.plane) return null
    return L.divIcon({
      className: 'flight-plane',
      html: `<span style="transform: rotate(${path.plane.bearing}deg)"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#e8e4d9" d="M12 1.4c.35 0 .7.4.75.9l.85 6.3 7.1 2.15c.75.25 1.2.75 1.2 1.35s-.45 1.1-1.2 1.35l-7.1 2.15-.85 6.15c-.05.55-.4 1-.75 1s-.7-.45-.75-1l-.85-6.15-7.1-2.15C2.45 13.25 2 12.75 2 12.15s.45-1.1 1.2-1.35l7.1-2.15.85-6.3c.05-.5.4-.9.75-.9Z"/></svg></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    })
  }, [path.plane])

  if (path.segments.length === 0) return null

  return (
    <>
      {path.segments.map((positions, index) => (
        <Polyline
          key={`glow-${index}`}
          positions={positions}
          pathOptions={{
            className: 'flight-route-glow',
            color: '#e8e4d9',
            weight: 8,
            opacity: 0.22,
            lineCap: 'round',
            lineJoin: 'round',
          }}
          interactive={false}
        />
      ))}
      {path.segments.map((positions, index) => (
        <Polyline
          key={`arc-${index}`}
          positions={positions}
          pathOptions={{
            className: 'flight-route',
            color: '#e8e4d9',
            weight: 2.5,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          }}
          interactive={false}
        />
      ))}
      {path.plane && planeIcon && (
        <Marker
          position={[path.plane.lat, path.plane.lng]}
          icon={planeIcon}
          interactive={false}
          zIndexOffset={700}
        />
      )}
    </>
  )
}

function YouMarker({ you }: { you: YouAreHere }) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'you-dot',
        html: '<span class="you-dot-pulse"></span><span class="you-dot-core"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    [],
  )

  return (
    <Marker position={[you.lat, you.lng]} icon={icon} zIndexOffset={800} interactive={false}>
      <Tooltip permanent direction="top" offset={[0, -12]} opacity={1}>
        You · {you.ign}
      </Tooltip>
    </Marker>
  )
}

function EventMarker({
  event,
  selected,
  onSelect,
}: {
  event: CsEvent
  selected: boolean
  onSelect: (id: string | null) => void
}) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: cx('map-pin', selected && 'is-selected'),
        html: pinHtml(event),
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      }),
    [event, selected],
  )

  return (
    <Marker
      position={[event.lat, event.lng]}
      icon={icon}
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={{
        click: (leafletEvent) => {
          leafletEvent.originalEvent.stopPropagation()
          onSelect(event.id)
        },
      }}
    >
      <Tooltip permanent={selected} direction="top" offset={[0, -20]} opacity={1}>
        {event.name}
      </Tooltip>
    </Marker>
  )
}

function pinHtml(event: CsEvent): string {
  const emoji = flagEmoji(event.countryCode)
  return `<span class="map-pin-core"><span class="map-pin-emoji" aria-hidden="true">${emoji}</span><img src="${escapeAttr(circleFlagUrl(event.countryCode))}" alt="${escapeAttr(`${event.country} flag`)}" width="40" height="40" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()" /></span>`
}

function escapeAttr(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
