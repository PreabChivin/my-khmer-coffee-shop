"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 🧸 Cute divIcon pin, styled to match the app's pastel palette — sidesteps
// Leaflet's well-known default-marker-icon bundler path issue entirely (no
// PNG asset resolution needed).
const PIN_ICON = L.divIcon({
  className: "",
  html: `<div style="
    width: 34px; height: 34px; border-radius: 50% 50% 50% 0;
    background: linear-gradient(135deg, #f4638a, #e0567a);
    transform: rotate(-45deg);
    box-shadow: 0 3px 10px rgba(0,0,0,0.35);
    border: 2px solid white;
    display: flex; align-items: center; justify-content: center;
  "><span style="transform: rotate(45deg); font-size: 16px;">☕</span></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

const DEFAULT_ZOOM = 15;

/**
 * 🗺️ The actual Leaflet map instance — isolated in its own file so it can
 * be `next/dynamic`-imported with `ssr: false` (Leaflet touches `window`/
 * `document` and has no SSR support). Manages the map + a single draggable
 * pin imperatively via refs; the parent (AddressMapPicker) stays declarative.
 */
export default function LeafletCanvas({
  center,
  pin,
  onPinChange,
}: {
  center: { lat: number; lng: number };
  pin: { lat: number; lng: number } | null;
  onPinChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  // Keep the latest callback without re-binding Leaflet event listeners.
  // Written in an effect (not during render) so refs stay side-effect-free
  // at render time, per React's rules.
  const onPinChangeRef = useRef(onPinChange);
  useEffect(() => {
    onPinChangeRef.current = onPinChange;
  });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: DEFAULT_ZOOM,
      attributionControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    function placePin(lat: number, lng: number) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: PIN_ICON, draggable: true })
          .addTo(map)
          .on("dragend", () => {
            const pos = markerRef.current!.getLatLng();
            onPinChangeRef.current(pos.lat, pos.lng);
          });
      }
      onPinChangeRef.current(lat, lng);
    }

    map.on("click", (e: L.LeafletMouseEvent) => placePin(e.latlng.lat, e.latlng.lng));

    if (pin) placePin(pin.lat, pin.lng);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Map is created once; center/pin updates after mount are handled by the
    // effects below so this doesn't tear down and recreate the map instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter (without moving the pin) when the parent's `center` changes —
  // e.g. a search result was picked, or "use my location" resolved.
  useEffect(() => {
    mapRef.current?.setView([center.lat, center.lng], DEFAULT_ZOOM);
  }, [center]);

  // Sync an externally-set pin (e.g. picked from a search result) onto the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pin) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([pin.lat, pin.lng]);
    } else {
      markerRef.current = L.marker([pin.lat, pin.lng], { icon: PIN_ICON, draggable: true })
        .addTo(map)
        .on("dragend", () => {
          const pos = markerRef.current!.getLatLng();
          onPinChangeRef.current(pos.lat, pos.lng);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin?.lat, pin?.lng]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-2xl"
      style={{ minHeight: 280 }}
    />
  );
}
