export type Place = {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
};

const EARTH_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** Straight line distance in km. Good enough for a town the size of Warri. */
export function distanceKm(a: Place, b: Place): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

/**
 * How far this errand pulls a runner off the trip they were already making.
 *
 *   detour = (origin -> pickup) + (pickup -> dropoff) + (dropoff -> destination)
 *            - (origin -> destination)
 *
 * A runner passing both ends gets a detour near zero. A runner who has to
 * cross town and come back gets a large one, and the price says so.
 */
export function detourKm(
  origin: Place,
  destination: Place,
  pickup: Place,
  dropoff: Place
): number {
  const viaErrand =
    distanceKm(origin, pickup) +
    distanceKm(pickup, dropoff) +
    distanceKm(dropoff, destination);
  const direct = distanceKm(origin, destination);
  return Math.max(0, viaErrand - direct);
}

export type Geometry = "route_aligned" | "partial_detour" | "dedicated_trip";

export function classifyGeometry(detour: number): Geometry {
  if (detour <= 1.5) return "route_aligned";
  if (detour <= 5) return "partial_detour";
  return "dedicated_trip";
}

export const GEOMETRY_LABEL: Record<Geometry, string> = {
  route_aligned: "On your route",
  partial_detour: "Small detour",
  dedicated_trip: "Off your route",
};
