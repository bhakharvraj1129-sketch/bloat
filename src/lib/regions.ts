// States, provinces and time zones for the three countries Bloat Buddy is offered in, with the names
// people know. Stored values stay as before: the region is saved as its name, the time zone as its
// standard ID (for example "America/New_York"), which people never have to type or read.

export type Country = "US" | "CA" | "IN";

export const REGIONS: Record<Country, { label: string; plural: string; names: string[] }> = {
  US: {
    label: "State",
    plural: "states",
    names: [
      "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "District of Columbia",
      "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
      "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
      "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
      "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia",
      "Washington", "West Virginia", "Wisconsin", "Wyoming",
      "American Samoa", "Guam", "Northern Mariana Islands", "Puerto Rico", "U.S. Virgin Islands",
    ],
  },
  CA: {
    label: "Province or territory",
    plural: "provinces and territories",
    names: [
      "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Northwest Territories",
      "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon",
    ],
  },
  IN: {
    label: "State or union territory",
    plural: "states and union territories",
    names: [
      "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
      "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
      "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
      "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
      "Uttar Pradesh", "Uttarakhand", "West Bengal",
    ],
  },
};

/** The region name as listed, if it is one (ignoring case and spaces), else null. */
export function regionName(country: Country, value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  return REGIONS[country].names.find((n) => n.toLowerCase() === v) ?? null;
}

// The main time zones offered for each country, in the order people expect (east to west).
export const MAIN_ZONES: Record<Country, string[]> = {
  US: ["America/New_York", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu", "America/Puerto_Rico", "Pacific/Guam"],
  CA: ["America/St_Johns", "America/Halifax", "America/Toronto", "America/Winnipeg", "America/Regina", "America/Edmonton", "America/Vancouver", "America/Whitehorse"],
  IN: ["Asia/Kolkata"],
};

// Names for the zones people in these countries are likely to have. Any other zone gets its city and area.
const ZONE_NAMES: Record<string, string> = {
  "America/New_York": "Eastern time (New York)",
  "America/Detroit": "Eastern time (Detroit)",
  "America/Indiana/Indianapolis": "Eastern time (Indianapolis)",
  "America/Kentucky/Louisville": "Eastern time (Louisville)",
  "America/Toronto": "Eastern time (Toronto)",
  "America/Iqaluit": "Eastern time (Iqaluit)",
  "America/Chicago": "Central time (Chicago)",
  "America/Menominee": "Central time (Menominee)",
  "America/Winnipeg": "Central time (Winnipeg)",
  "America/Rankin_Inlet": "Central time (Rankin Inlet)",
  "America/Regina": "Central time, no daylight saving (Saskatchewan)",
  "America/Swift_Current": "Central time, no daylight saving (Swift Current)",
  "America/Denver": "Mountain time (Denver)",
  "America/Boise": "Mountain time (Boise)",
  "America/Edmonton": "Mountain time (Edmonton)",
  "America/Cambridge_Bay": "Mountain time (Cambridge Bay)",
  "America/Inuvik": "Mountain time (Inuvik)",
  "America/Phoenix": "Mountain time, no daylight saving (Arizona)",
  "America/Creston": "Mountain time, no daylight saving (Creston)",
  "America/Dawson_Creek": "Mountain time, no daylight saving (Dawson Creek)",
  "America/Fort_Nelson": "Mountain time, no daylight saving (Fort Nelson)",
  "America/Los_Angeles": "Pacific time (Los Angeles)",
  "America/Vancouver": "Pacific time (Vancouver)",
  "America/Whitehorse": "Yukon time (Whitehorse)",
  "America/Dawson": "Yukon time (Dawson)",
  "America/Anchorage": "Alaska time (Anchorage)",
  "America/Juneau": "Alaska time (Juneau)",
  "America/Sitka": "Alaska time (Sitka)",
  "America/Nome": "Alaska time (Nome)",
  "America/Adak": "Hawaii-Aleutian time (Adak)",
  "Pacific/Honolulu": "Hawaii time (Honolulu)",
  "America/St_Johns": "Newfoundland time (St. John's)",
  "America/Halifax": "Atlantic time (Halifax)",
  "America/Moncton": "Atlantic time (Moncton)",
  "America/Glace_Bay": "Atlantic time (Glace Bay)",
  "America/Goose_Bay": "Atlantic time (Goose Bay)",
  "America/Puerto_Rico": "Atlantic time (Puerto Rico)",
  "America/St_Thomas": "Atlantic time (U.S. Virgin Islands)",
  "Pacific/Guam": "Chamorro time (Guam)",
  "Pacific/Saipan": "Chamorro time (Saipan)",
  "Pacific/Pago_Pago": "Samoa time (Pago Pago)",
  "Asia/Kolkata": "India time (Kolkata)",
  "Asia/Calcutta": "India time (Kolkata)",
  "UTC": "Coordinated Universal Time (UTC)",
};

/** A time zone as people say it, for example "Eastern time (New York)". Never shows only the ID. */
export function zoneLabel(zone: string | null | undefined): string {
  if (!zone) return "Not set";
  const known = ZONE_NAMES[zone];
  if (known) return known;
  const parts = zone.split("/");
  const city = (parts[parts.length - 1] ?? zone).replace(/_/g, " ");
  return parts.length > 1 ? `${city} (${parts[0]!.replace(/_/g, " ")})` : city;
}

/** The zones offered for a country, plus the current or device zone first if it is not one of them. */
export function zoneChoices(country: Country, ...extra: Array<string | null | undefined>): string[] {
  const main = MAIN_ZONES[country];
  const add = extra.filter((z): z is string => !!z && !main.includes(z));
  return [...new Set([...add, ...main])];
}

/** Every time zone this browser knows, sorted by its label (for "My time zone isn't listed"). */
export function allZones(): string[] {
  try {
    const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
    return [...list].sort((a, b) => zoneLabel(a).localeCompare(zoneLabel(b)));
  } catch {
    return [];
  }
}
