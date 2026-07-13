"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession } from "@/contexts/SessionContext";
import type { GeocodeResult } from "@/lib/types";

const LeafletCanvas = dynamic(() => import("@/components/LeafletCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[280px] w-full items-center justify-center rounded-2xl bg-coffee-100 dark:bg-coffee-900">
      <Loader2 size={28} className="animate-spin text-coffee-400" />
    </div>
  ),
});

// Phnom Penh — sensible default center until a pin/search/geolocation is set.
const DEFAULT_CENTER = { lat: 11.5564, lng: 104.9282 };

export interface PickedLocation {
  address: string;
  /** Null when the address was typed via the manual-entry fallback rather
   *  than picked on the map — (0,0) would be a real, misleading coordinate. */
  latitude: number | null;
  longitude: number | null;
}

/**
 * 📍 Interactive delivery-address picker — a modal (createPortal-ed to
 * document.body, since checkout lives inside the (site) layout whose sticky
 * backdrop-blur header traps position:fixed). Click-to-drop-pin on a real
 * Leaflet/OpenStreetMap map, free-text search, "use my location", and an
 * optional "type manually" fallback so a map/geocoding hiccup never blocks
 * checkout. Logged-in users can optionally save the confirmed location with
 * a custom label.
 */
export default function AddressMapPicker({
  initial,
  onClose,
  onConfirm,
}: {
  initial: PickedLocation | null;
  onClose: () => void;
  onConfirm: (location: PickedLocation) => void;
}) {
  const { t } = useLanguage();
  const { user } = useSession();

  const [manualMode, setManualMode] = useState(
    () => initial !== null && (initial.latitude === null || initial.longitude === null)
  );
  const [manualAddress, setManualAddress] = useState(initial?.address ?? "");

  const initialPin =
    initial && initial.latitude !== null && initial.longitude !== null
      ? { lat: initial.latitude, lng: initial.longitude }
      : null;
  const [center, setCenter] = useState(initialPin ?? DEFAULT_CENTER);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(initialPin);
  const [addressLabel, setAddressLabel] = useState(initial?.address ?? "");
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const [saveLabel, setSaveLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const reverseGeocodeSeq = useRef(0);

  // 🔍 Debounced address search — clearing on a too-short query happens in
  // the input's onChange (an event handler), not here, so this effect only
  // ever fires the actual fetch.
  useEffect(() => {
    if (query.trim().length < 3) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- inherent to the debounce-then-fetch pattern
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`);
        setResults(res.ok ? await res.json() : []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [query]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length < 3) setResults([]);
  }

  async function handlePinChange(lat: number, lng: number) {
    setPin({ lat, lng });
    setIsResolvingAddress(true);
    const seq = ++reverseGeocodeSeq.current;
    try {
      const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      // Ignore stale responses if the pin moved again before this resolved.
      if (seq === reverseGeocodeSeq.current) {
        setAddressLabel(data.label ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch {
      if (seq === reverseGeocodeSeq.current) {
        setAddressLabel(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } finally {
      if (seq === reverseGeocodeSeq.current) setIsResolvingAddress(false);
    }
  }

  function selectSearchResult(result: GeocodeResult) {
    setCenter({ lat: result.lat, lng: result.lng });
    setPin({ lat: result.lat, lng: result.lng });
    setAddressLabel(result.label);
    setResults([]);
    setQuery("");
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocateError(t("map.locationError"));
      return;
    }
    setIsLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCenter({ lat: latitude, lng: longitude });
        handlePinChange(latitude, longitude);
        setIsLocating(false);
      },
      () => {
        setLocateError(t("map.locationError"));
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  }

  function handleConfirm() {
    if (manualMode) {
      if (!manualAddress.trim()) return;
      onConfirm({ address: manualAddress.trim(), latitude: null, longitude: null });
      return;
    }
    if (!pin) return;
    onConfirm({ address: addressLabel, latitude: pin.lat, longitude: pin.lng });
  }

  async function handleSaveAddress() {
    if (!pin || !saveLabel.trim()) return;
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/saved-addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: saveLabel.trim(),
          address: addressLabel,
          latitude: pin.lat,
          longitude: pin.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveMsg(data.error ?? "Couldn't save this address.");
        return;
      }
      setSaveMsg(t("map.saveSuccess"));
      setSaveLabel("");
    } catch {
      setSaveMsg("Network error — please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-coffee-900/70 p-4 backdrop-blur-sm">
      <div className="khmer-card relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-cream-50 dark:bg-coffee-800">
        <div className="flex items-center justify-between border-b border-coffee-100 px-5 py-4 dark:border-coffee-700">
          <h2 className="font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
            {t("map.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("map.close")}
            className="text-coffee-400 hover:text-coffee-700 dark:text-cream-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {manualMode ? (
            <div className="space-y-3">
              <textarea
                autoFocus
                required
                rows={3}
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder={t("checkout.addressPlaceholder")}
                className="w-full rounded-xl border border-coffee-300 bg-cream-50 px-4 py-2.5 text-coffee-900 outline-none focus:border-gold-500 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
              />
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className="text-xs font-semibold text-clay-600 underline decoration-dotted dark:text-clay-400"
              >
                {t("map.backToMap")}
              </button>
            </div>
          ) : (
            <>
              {/* 🔍 Search */}
              <div className="relative mb-3">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400"
                />
                <input
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder={t("map.searchPlaceholder")}
                  className="w-full rounded-xl border border-coffee-300 bg-cream-50 py-2.5 pl-9 pr-4 text-sm text-coffee-900 outline-none focus:border-gold-500 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                />
                {isSearching && (
                  <Loader2
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-coffee-400"
                  />
                )}
                {results.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-coffee-200 bg-white shadow-lg dark:border-coffee-600 dark:bg-coffee-900">
                    {results.map((r, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => selectSearchResult(r)}
                          className="block w-full truncate px-3 py-2 text-left text-xs text-coffee-700 hover:bg-clay-50 dark:text-cream-200 dark:hover:bg-coffee-800"
                        >
                          {r.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {!isSearching && query.trim().length >= 3 && results.length === 0 && (
                  <p className="mt-1 text-[11px] text-coffee-400 dark:text-cream-400">
                    {t("map.noResults")}
                  </p>
                )}
              </div>

              {/* 🗺️ Map */}
              <div className="h-64 w-full overflow-hidden rounded-2xl border border-coffee-200 dark:border-coffee-600">
                <LeafletCanvas center={center} pin={pin} onPinChange={handlePinChange} />
              </div>
              <p className="mt-1.5 text-[11px] text-coffee-400 dark:text-cream-400">
                {t("map.dropPinHint")}
              </p>

              <button
                type="button"
                onClick={useMyLocation}
                disabled={isLocating}
                className="mt-3 flex items-center gap-1.5 rounded-full border border-clay-400 bg-clay-50 px-3 py-1.5 text-xs font-bold text-clay-700 transition-transform hover:scale-105 active:scale-95 disabled:opacity-60 dark:bg-coffee-900 dark:text-clay-300"
              >
                {isLocating ? <Loader2 size={13} className="animate-spin" /> : <MapPin size={13} />}
                {isLocating ? t("map.locating") : t("map.useMyLocation")}
              </button>
              {locateError && (
                <p className="mt-1.5 text-[11px] text-crimson-500">{locateError}</p>
              )}

              {/* 📍 Resolved address preview */}
              <div className="mt-3 rounded-xl bg-cream-100 px-3 py-2.5 text-sm dark:bg-coffee-900">
                {isResolvingAddress ? (
                  <span className="flex items-center gap-1.5 text-coffee-400 dark:text-cream-400">
                    <Loader2 size={13} className="animate-spin" /> {t("map.locating")}
                  </span>
                ) : (
                  <span className="text-coffee-800 dark:text-cream-100">
                    {addressLabel || t("map.noPinYet")}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setManualMode(true)}
                className="mt-2 text-xs font-semibold text-clay-600 underline decoration-dotted dark:text-clay-400"
              >
                {t("map.typeManually")}
              </button>

              {/* 💾 Optional save-for-later (logged in only) */}
              {user && pin && (
                <div className="mt-4 rounded-xl border-2 border-dashed border-gold-500/50 bg-gold-50/60 px-3 py-3 dark:bg-coffee-900/40">
                  <p className="mb-2 text-xs font-bold text-coffee-700 dark:text-cream-200">
                    {t("map.saveThisAddress")}
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={saveLabel}
                      onChange={(e) => setSaveLabel(e.target.value)}
                      placeholder={t("map.labelPlaceholder")}
                      maxLength={40}
                      className="min-w-0 flex-1 rounded-lg border border-coffee-300 bg-cream-50 px-3 py-1.5 text-xs text-coffee-900 outline-none focus:border-gold-500 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                    />
                    <button
                      type="button"
                      disabled={isSaving || !saveLabel.trim()}
                      onClick={handleSaveAddress}
                      className="shrink-0 rounded-lg bg-gradient-to-r from-clay-400 to-crimson-400 px-3 py-1.5 text-xs font-bold text-white shadow-sm disabled:opacity-60"
                    >
                      {isSaving ? "…" : t("map.saveButton")}
                    </button>
                  </div>
                  {saveMsg && (
                    <p className="mt-1.5 text-[11px] font-semibold text-matcha-600">{saveMsg}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-coffee-100 px-5 py-4 dark:border-coffee-700">
          <button
            type="button"
            disabled={manualMode ? !manualAddress.trim() : !pin}
            onClick={handleConfirm}
            className="w-full rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-3 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("map.confirmLocation")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
