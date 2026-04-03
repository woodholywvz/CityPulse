"use client";

import { divIcon } from "leaflet";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from "react-leaflet";

import { DEFAULT_MAP_CENTER } from "@/features/issues/lib/presenters";

const TILE_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

type LocationPickerMapClientProps = Readonly<{
  latitude: number | null;
  longitude: number | null;
  onSelectLocation: (coordinates: { latitude: number; longitude: number }) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}>;

function SelectionHandler({
  onSelectLocation,
}: Pick<LocationPickerMapClientProps, "onSelectLocation">) {
  useMapEvents({
    click(event) {
      onSelectLocation({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

function buildSelectionIcon() {
  return divIcon({
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: '<span style="display:block;height:24px;width:24px;border-radius:9999px;background:rgba(249,115,22,1);border:3px solid rgba(255,255,255,0.96);box-shadow:0 10px 24px rgba(15,23,42,0.25)"></span>',
  });
}

export function LocationPickerMapClient({
  latitude,
  longitude,
  onSelectLocation,
  userLocation,
}: LocationPickerMapClientProps) {
  const center: [number, number] =
    typeof latitude === "number" && typeof longitude === "number"
      ? [latitude, longitude]
      : userLocation
        ? [userLocation.latitude, userLocation.longitude]
        : [DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude];

  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom className="h-[360px]">
      <TileLayer url={TILE_LAYER_URL} />
      <SelectionHandler onSelectLocation={onSelectLocation} />
      {userLocation ? (
        <Circle
          center={[userLocation.latitude, userLocation.longitude]}
          radius={120}
          pathOptions={{ color: "#0f172a", fillColor: "#38bdf8", fillOpacity: 0.14 }}
        />
      ) : null}
      {typeof latitude === "number" && typeof longitude === "number" ? (
        <Marker position={[latitude, longitude]} icon={buildSelectionIcon()} />
      ) : null}
    </MapContainer>
  );
}
