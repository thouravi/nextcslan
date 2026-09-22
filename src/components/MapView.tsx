import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
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
const ROUTE_MS = 1250

const GLOW_OPTIONS = {
  className: 'flight-route-glow',
  color: '#e8e4d9',
  weight: 8,
  opacity: 0.22,
  lineCap: 'round' as const,
  lineJoin: 'round' as const,
  interactive: false,
}

const LINE_OPTIONS = {
  className: 'flight-route',
  color: '#e8e4d9',
  weight: 2.5,
  opacity: 0.95,
  lineCap: 'round' as const,
  lineJoin: 'round' as const,
  interactive: false,
}

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
        keepBuffer={4}
      />
      <MapBehavior
        selected={selected}
        you={you}
        onSelect={onSelect}
        focusTick={focusTick}
        visible={visible}
        reducedMotion={reducedMotion}
      />
      {you && selected && (
        <FlightRoute
          from={you}
          to={selected}
          visible={visible}
          reducedMotion={reducedMotion}
        />
      )}
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
      if (selected && you && distanceKm(you, selected) >= 20) return
      inner = requestAnimationFrame(() => {
        lastFlight.current = flightKey
        flyToSelection(map, selected, reducedMotion)
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

function flyToSelection(map: L.Map, selected: CsEvent | null, reducedMotion: boolean) {
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
  visible,
  reducedMotion,
}: {
  from: { lat: number; lng: number }
  to: { lat: number; lng: number }
  visible: boolean
  reducedMotion: boolean
}) {
  const map = useMap()
  const layers = useRef<RouteLayers>({ glows: [], lines: [], plane: null })
  const shownFrom = useRef({ lat: from.lat, lng: from.lng })
  const shownTo = useRef({ lat: to.lat, lng: to.lng })
  const frame = useRef(0)

  useEffect(() => {
    const layersNow = layers.current
    return () => {
      cancelAnimationFrame(frame.current)
      clearRoute(layersNow)
    }
  }, [map])

  useEffect(() => {
    const endFrom = { lat: from.lat, lng: from.lng }
    const endTo = { lat: to.lat, lng: to.lng }
    const startFrom = { ...shownFrom.current }
    const startTo = { ...shownTo.current }
    const paint = (origin: LatLng, destination: LatLng) => {
      shownFrom.current = origin
      shownTo.current = destination
      syncRoute(map, layers.current, flightPath(origin, destination))
    }

    const placeCamera = () => {
      if (!visible) return
      map.invalidateSize()
      const target = viewForRoute(map, flightPath(endFrom, endTo), distanceKm(endFrom, endTo))
      if (!target) return
      if (reducedMotion) map.setView(target.center, target.zoom, { animate: false })
      else map.flyTo(target.center, target.zoom, { duration: ROUTE_MS / 1000 })
    }

    placeCamera()

    if (
      reducedMotion ||
      !visible ||
      (samePoint(startFrom, endFrom) && samePoint(startTo, endTo))
    ) {
      paint(endFrom, endTo)
      return
    }

    const started = performance.now()
    const step = (now: number) => {
      const t = easeOut(Math.min(1, (now - started) / ROUTE_MS))
      paint(
        {
          lat: startFrom.lat + (endFrom.lat - startFrom.lat) * t,
          lng: lerpLng(startFrom.lng, endFrom.lng, t),
        },
        {
          lat: startTo.lat + (endTo.lat - startTo.lat) * t,
          lng: lerpLng(startTo.lng, endTo.lng, t),
        },
      )
      if (t < 1) frame.current = requestAnimationFrame(step)
    }

    frame.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame.current)
  }, [from, to, map, reducedMotion, visible])

  return null
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

type LatLng = { lat: number; lng: number }

type RouteLayers = {
  glows: L.Polyline[]
  lines: L.Polyline[]
  plane: L.Marker | null
}

function samePoint(a: LatLng, b: LatLng) {
  return Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lng - b.lng) < 1e-6
}

function lerpLng(from: number, to: number, t: number) {
  const delta = (((to - from) % 360) + 540) % 360 - 180
  return from + delta * t
}

function easeOut(t: number) {
  return 1 - (1 - t) ** 1.5
}

function syncRoute(map: L.Map, layers: RouteLayers, path: ReturnType<typeof flightPath>) {
  while (layers.glows.length < path.segments.length) {
    layers.glows.push(L.polyline([], GLOW_OPTIONS).addTo(map))
    layers.lines.push(L.polyline([], LINE_OPTIONS).addTo(map))
  }
  while (layers.glows.length > path.segments.length) {
    layers.glows.pop()?.remove()
    layers.lines.pop()?.remove()
  }

  path.segments.forEach((positions, index) => {
    layers.glows[index].setLatLngs(positions)
    layers.lines[index].setLatLngs(positions)
  })

  if (!path.plane) {
    layers.plane?.remove()
    layers.plane = null
    return
  }

  if (!layers.plane) {
    layers.plane = L.marker([path.plane.lat, path.plane.lng], {
      interactive: false,
      zIndexOffset: 700,
      icon: planeIcon(path.plane.bearing),
    }).addTo(map)
    return
  }

  layers.plane.setLatLng([path.plane.lat, path.plane.lng])
  const span = layers.plane.getElement()?.querySelector('span')
  if (span instanceof HTMLElement) span.style.transform = `rotate(${path.plane.bearing}deg)`
}

function clearRoute(layers: RouteLayers) {
  layers.glows.forEach((line) => line.remove())
  layers.lines.forEach((line) => line.remove())
  layers.plane?.remove()
  layers.glows = []
  layers.lines = []
  layers.plane = null
}

function viewForRoute(map: L.Map, path: ReturnType<typeof flightPath>, km: number) {
  const maxZoom = km > 2500 ? 4 : km > 700 ? 5 : 8
  const route = path.segments.length === 1 ? path.segments[0] : null
  if (!route) {
    if (!path.plane) return null
    return {
      center: L.latLng(path.plane.lat, path.plane.lng),
      zoom: Math.max(2, Math.min(maxZoom, Math.log2(40000 / Math.max(km, 1)))),
    }
  }

  const bounds = L.latLngBounds(route)
  const paddingTopLeft = L.point(56, 72)
  const paddingBottomRight = L.point(56, 210)
  let zoom = map.getBoundsZoom(bounds, false, paddingTopLeft.add(paddingBottomRight))
  if (!Number.isFinite(zoom)) zoom = map.getZoom()
  zoom = Math.min(maxZoom, zoom)
  const paddingOffset = paddingBottomRight.subtract(paddingTopLeft).divideBy(2)
  const southWest = map.project(bounds.getSouthWest(), zoom)
  const northEast = map.project(bounds.getNorthEast(), zoom)
  return {
    center: map.unproject(southWest.add(northEast).divideBy(2).add(paddingOffset), zoom),
    zoom,
  }
}

function planeIcon(bearing: number) {
  return L.divIcon({
    className: 'flight-plane',
    html: `<span style="transform: rotate(${bearing}deg)"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#e8e4d9" d="M12 1.4c.35 0 .7.4.75.9l.85 6.3 7.1 2.15c.75.25 1.2.75 1.2 1.35s-.45 1.1-1.2 1.35l-7.1 2.15-.85 6.15c-.05.55-.4 1-.75 1s-.7-.45-.75-1l-.85-6.15-7.1-2.15C2.45 13.25 2 12.75 2 12.15s.45-1.1 1.2-1.35l7.1-2.15.85-6.3c.05-.5.4-.9.75-.9Z"/></svg></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}
