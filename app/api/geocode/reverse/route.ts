import { NextRequest, NextResponse } from "next/server";
import { nominatimFetch } from "@/lib/geocode";

interface NominatimReverseHit {
  display_name?: string;
}

// 📍 Reverse geocoding — a dropped/dragged pin's {lat, lng} → a readable
// address label shown under the map. Best-effort: on any failure we return
// a plain "lat, lng" fallback label rather than an error, since the pin
// itself (the thing that actually matters for delivery) is already known.
export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));

  const fallbackLabel = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "តម្រូវឲ្យមានទីតាំង (lat/lng)។" }, { status: 400 });
  }

  try {
    const res = await nominatimFetch(
      `/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    );
    if (!res.ok) return NextResponse.json({ label: fallbackLabel });

    const hit = (await res.json()) as NominatimReverseHit;
    return NextResponse.json({ label: hit.display_name ?? fallbackLabel });
  } catch {
    return NextResponse.json({ label: fallbackLabel });
  }
}
