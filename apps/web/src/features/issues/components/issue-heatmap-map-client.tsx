"use client";

import { useEffect } from "react";

import { latLngBounds } from "leaflet";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import { DEFAULT_MAP_CENTER } from "@/features/issues/lib/presenters";

const TILE_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export type HeatPointLike = {
  area_key: string;
  label: string;
  latitude: number;
  longitude: number;
  intensity: number;
  issue_count: number;
  top_category_slug?: string | null;
  average_impact_score?: number | null;
};

type IssueHeatmapMapClientProps = Readonly<{
  points: HeatPointLike[];
  selectedAreaKey?: string | null;
  heightClassName?: string;
  issueCountLabel: string;
  secondaryLine?: (point: HeatPointLike) => string | null;
  onSelectPoint?: (areaKey: string) => void;
}>;

function HeatmapViewport({
  points,
}: Pick<IssueHeatmapMapClientProps, "points">) {
  const map = useMap();

  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(
        latLngBounds(points.map((point) => [point.latitude, point.longitude])),
        { padding: [48, 48] },
      );
      return;
    }

    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 13);
      return;
    }

    map.setView([DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude], 4);
  }, [map, points]);

  return null;
}

export function IssueHeatmapMapClient({
  points,
  selectedAreaKey,
  heightClassName = "h-[520px]",
  issueCountLabel,
  secondaryLine,
  onSelectPoint,
}: IssueHeatmapMapClientProps) {
  const center: [number, number] = points[0]
    ? [points[0].latitude, points[0].longitude]
    : [DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude];

  return (
    <MapContainer center={center} zoom={4} scrollWheelZoom className={heightClassName}>
      <TileLayer url={TILE_LAYER_URL} />
      <HeatmapViewport points={points} />

      {points.map((point) => {
        const isSelected = point.area_key === selectedAreaKey;
        const radius = 120 + point.intensity * 360;
        const fillOpacity = isSelected ? 0.26 : 0.14 + point.intensity * 0.18;

        return (
          <Circle
            key={`${point.area_key}-halo`}
            center={[point.latitude, point.longitude]}
            radius={radius}
            pathOptions={{
              color: isSelected ? "#22d3ee" : "#38bdf8",
              fillColor: isSelected ? "#34d399" : "#22d3ee",
              fillOpacity,
              weight: 1,
            }}
            eventHandlers={
              onSelectPoint
                ? {
                    click: () => onSelectPoint(point.area_key),
                  }
                : undefined
            }
          />
        );
      })}

      {points.map((point) => {
        const isSelected = point.area_key === selectedAreaKey;
        const secondary = secondaryLine?.(point);

        return (
          <CircleMarker
            key={point.area_key}
            center={[point.latitude, point.longitude]}
            radius={8 + point.intensity * 12}
            pathOptions={{
              color: "#f8fafc",
              fillColor: isSelected ? "#22d3ee" : "#0f172a",
              fillOpacity: 0.96,
              weight: 2,
            }}
            eventHandlers={
              onSelectPoint
                ? {
                    click: () => onSelectPoint(point.area_key),
                  }
                : undefined
            }
          >
            <Popup>
              <div className="space-y-1">
                <p className="text-sm font-semibold">{point.label}</p>
                <p className="text-xs text-slate-600">
                  {point.issue_count} {issueCountLabel}
                </p>
                {secondary ? <p className="text-xs text-slate-600">{secondary}</p> : null}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
