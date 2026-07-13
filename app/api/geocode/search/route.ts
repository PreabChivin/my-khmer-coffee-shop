import { NextRequest, NextResponse } from "next/server";
import { nominatimFetch } from "@/lib/geocode";
import type { GeocodeResult } from "@/lib/types";

interface NominatimSearchHit {
  display_name: string;
  lat: string;
  lon: string;
}

// 🔍 Forward geocoding for the map picker's search box — free-text query
// (e.g. "Street 240, Phnom Penh") → a short list of candidate pins. A
// lookup failure never blocks checkout; it just returns an empty list so
// the map picker's "type manually" fallback stays available.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json([]);
  }

  try {
    const res = await nominatimFetch(
      `/search?format=jsonv2&countrycodes=kh&limit=5&q=${encodeURIComponent(q)}`
    );
    if (!res.ok) return NextResponse.json([]);

    const hits = (await res.json()) as NominatimSearchHit[];
    const results: GeocodeResult[] = hits.map((h) => ({
      label: h.display_name,
      lat: parseFloat(h.lat),
      lng: parseFloat(h.lon),
    }));
    return NextResponse.json(results);
  } catch {
    // Timeout, network hiccup, or Nominatim outage — degrade gracefully.
    return NextResponse.json([]);
  }
}
