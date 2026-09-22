import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { CsEvent } from '../types'
import { cx } from '../lib/cx'
import { circleFlagUrl, flagEmoji } from '../lib/flags'
import { distanceKm } from '../lib/geo'

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
      if (target instanceof Element && target.closest('.map-pin, .you-dot')) return
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
  if (selected && you && distanceKm(you, selected) > 180) {
    const bounds: L.LatLngBoundsExpression = [
      [you.lat, you.lng],
      [selected.lat, selected.lng],
    ]
    const padding = {
      paddingTopLeft: [48, 48] as L.PointExpression,
      paddingBottomRight: [48, 200] as L.PointExpression,
      maxZoom: 6,
    }
    if (reducedMotion) map.fitBounds(bounds, { ...padding, animate: false })
    else map.flyToBounds(bounds, { ...padding, duration: 0.9 })
    return
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
