import React from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { divIcon } from 'leaflet';

const pin = divIcon({
  className: 'terreta-map-pin',
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#C0573E;border:2px solid white;"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export const EventPlaceMap: React.FC<{ latitude: number; longitude: number }> = ({ latitude, longitude }) => (
  <div className="mt-3 h-40 overflow-hidden rounded-shell border border-terreta-border">
    <MapContainer
      center={{ lat: latitude, lng: longitude }}
      zoom={14}
      className="h-40 w-full"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={{ lat: latitude, lng: longitude }} icon={pin} />
    </MapContainer>
  </div>
);
