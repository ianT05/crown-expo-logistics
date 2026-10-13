import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function TrackingMap({ lat = -4.0435, long = 39.6682 }) {
  return (
    <div className="h-80 w-full rounded-xl overflow-hidden border border-slate-200">
      <MapContainer center={[lat, long]} zoom={4} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, long]}>
          <Popup>Active Vessel Location / Current Port Position</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}