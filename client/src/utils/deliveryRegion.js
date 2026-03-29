/**
 * Greater Accra region names/cities helper for delivery logic.
 * Region names as returned by geocoding (e.g. Nominatim) may vary.
 */
const GREATER_ACCRA_REGION_NAMES = [
  "greater accra",
  "greater accra region",
  "accra",
];

const GREATER_ACCRA_CITIES = [
  "accra",
  "tema",
  "achiaman",
  "adenta",
  "madina",
  "dodowa",
  "weija",
  "gbawe",
];

/**
 * Returns true if the given address (region/city) is in Greater Accra.
 * @param {{ region?: string, city?: string }} address - shipping address with optional region and city
 * @returns {boolean}
 */
export function isGreaterAccra(address) {
  if (!address) return false;
  const region = (address.region || "").toLowerCase().trim();
  const city = (address.city || "").toLowerCase().trim();

  if (
    region &&
    GREATER_ACCRA_REGION_NAMES.some((name) => region.includes(name))
  )
    return true;
  if (
    city &&
    GREATER_ACCRA_CITIES.some((c) => city.includes(c) || c.includes(city))
  )
    return true;

  return false;
}
