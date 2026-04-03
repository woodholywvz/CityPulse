"use client";

import { useEffect } from "react";

import { divIcon, latLngBounds } from "leaflet";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import { DEFAULT_MAP_CENTER } from "@/features/issues/lib/presenters";
import type { PublicIssueMapMarker } from "@/lib/api/types";

const TILE_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

type IssueMapClientProps = Readonly<{
  markers: PublicIssueMapMarker[];
  selectedIssueId?: string | null;
  userLocation?: { latitude: number; longitude: number } | null;
  heightClassName?: string;
  onSelectIssue?: (issueId: string) => void;
}>;

function buildMarkerIcon(isSelected: boolean) {
  return divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<span style="display:block;height:22px;width:22px;border-radius:9999px;background:${
      isSelected ? "rgba(249,115,22,1)" : "rgba(15,23,42,0.92)"
    };border:3px solid rgba(255,255,255,0.96);box-shadow:0 10px 24px rgba(15,23,42,0.25)"></span>`,
  });
}

function MapViewport({
  markers,
  userLocation,
}: Pick<IssueMapClientProps, "markers" | "userLocation">) {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 1) {
      map.fitBounds(
        latLngBounds(
          markers.map((marker) => [marker.latitude, marker.longitude]),
        ),
        { padding: [40, 40] },
      );
      return;
    }

    if (markers.length === 1) {
      map.setView([markers[0].latitude, markers[0].longitude], 14);
      return;
    }

    if (userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 13);
      return;
    }

    map.setView([DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude], 4);
  }, [map, markers, userLocation]);

  return null;
}

export function IssueMapClient({
  markers,
  selectedIssueId,
  userLocation,
  heightClassName = "h-[420px]",
  onSelectIssue,
}: IssueMapClientProps) {
  const center: [number, number] = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : markers[0]
      ? [markers[0].latitude, markers[0].longitude]
      : [DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude];

  return (
    <MapContainer center={center} zoom={4} scrollWheelZoom className={heightClassName}>
      <TileLayer url={TILE_LAYER_URL} />
      <MapViewport markers={markers} userLocation={userLocation} />

      {userLocation ? (
        <Circle
          center={[userLocation.latitude, userLocation.longitude]}
          radius={120}
          pathOptions={{ color: "#0f172a", fillColor: "#f97316", fillOpacity: 0.18 }}
        />
      ) : null}

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.latitude, marker.longitude]}
          icon={buildMarkerIcon(marker.id === selectedIssueId)}
          eventHandlers={
            onSelectIssue
              ? {
                  click: () => onSelectIssue(marker.id),
                }
              : undefined
          }
        >
          <Popup>
            <div className="space-y-1">
              <p className="text-sm font-semibold">{marker.title}</p>
              <p className="text-xs text-slate-600">{marker.category.display_name}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
