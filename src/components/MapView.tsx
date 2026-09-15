import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { CsEvent } from '../types'
import { cx } from '../lib/cx'
import { circleFlagUrl } from '../lib/flags'
import { distanceKm } from '../lib/geo'

export type YouAreHere = {
  ign: string
  lat: number
  lng: number
}

type MapViewProps = {
  events: CsEvent[]
  selected: CsEvent | null
  you: YouAreHere | null
  onSelect: (id: string | null) => void
  focusTick: number
}

const WORLD_CENTER: [number, number] = [28, 12]
const WORLD_ZOOM = 2.4
const CITY_ZOOM = 11

export function MapView({ events, selected, you, onSelect, focusTick }: MapViewProps) {
  return (
    <MapContainer
      className="map"
      center={selected ? [selected.lat, selected.lng] : WORLD_CENTER}
      zoom={selected ? 5 : WORLD_ZOOM}
      minZoom={2}
      maxZoom={16}
      worldCopyJump
      scrollWheelZoom
    >
      <TileLayer
        attribution='Tiles &copy; Esri'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
      />
      <MapBehavior selected={selected} you={you} onSelect={onSelect} focusTick={focusTick} />
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
}: {
  selected: CsEvent | null
  you: YouAreHere | null
  onSelect: (id: string | null) => void
  focusTick: number
}) {
  const map = useMap()

  useEffect(() => {
    map.invalidateSize()
    if (selected && you && distanceKm(you, selected) > 180) {
      map.flyToBounds(
        [
          [you.lat, you.lng],
          [selected.lat, selected.lng],
        ],
        {
          paddingTopLeft: [48, 48],
          paddingBottomRight: [48, 200],
          maxZoom: 6,
          duration: 0.9,
        },
      )
    } else if (selected) {
      map.flyTo([selected.lat, selected.lng], CITY_ZOOM, { duration: 0.85 })
    } else {
      map.flyTo(WORLD_CENTER, WORLD_ZOOM, { duration: 0.7 })
    }
  }, [map, selected, you, focusTick])

  useMapEvents({
    click: (event) => {
      const target = event.originalEvent.target
      if (target instanceof Element && target.closest('.map-pin, .you-dot')) return
      onSelect(null)
    },
  })

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
    <Marker
      position={[you.lat, you.lng]}
      icon={icon}
      zIndexOffset={800}
      interactive={false}
    >
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
        html: `<span class="map-pin-core"><img src="${circleFlagUrl(event.countryCode)}" alt="${event.country} flag" width="40" height="40" /></span>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      }),
    [event.country, event.countryCode, selected],
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
      <Tooltip
        permanent={selected}
        direction="top"
        offset={[0, -20]}
        opacity={1}
      >
        {event.name}
      </Tooltip>
    </Marker>
  )
}
