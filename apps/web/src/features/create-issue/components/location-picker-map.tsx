import dynamic from "next/dynamic";

type LocationPickerMapProps = Readonly<{
  latitude: number | null;
  longitude: number | null;
  onSelectLocation: (coordinates: { latitude: number; longitude: number }) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}>;

const DynamicLocationPickerMapClient = dynamic(
  () =>
    import("@/features/create-issue/components/location-picker-map-client").then(
      (module) => module.LocationPickerMapClient,
    ),
  {
    ssr: false,
  },
);

export function LocationPickerMap(props: LocationPickerMapProps) {
  return <DynamicLocationPickerMapClient {...props} />;
}
