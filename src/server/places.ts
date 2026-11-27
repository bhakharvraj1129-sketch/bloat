import "server-only";
import { createRequire } from "node:module";
import type { IndiaPincode } from "india-pincode";
import { regionName } from "@/lib/regions";

// The package's ES-module build uses __dirname (undefined there), so load its CommonJS build.
const { getIndiaPincode } = createRequire(import.meta.url)("india-pincode") as typeof import("india-pincode");

// PIN code lookup (india-pincode, about 3.7 MB of post-office data, loaded once per server instance).
// Only the state and the district (shown as the city) are returned; nothing is stored or logged.
let instance: IndiaPincode | null = null;

const title = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());

export function lookupPincode(pin: string): { state: string; city: string } | null {
  instance ??= getIndiaPincode();
  const found = instance.getByPincode(pin);
  const first = found.success ? found.data?.data?.[0] : undefined;
  if (!first) return null;
  const state = regionName("IN", first.state.replace(/^THE /, ""));
  return state ? { state, city: title(first.district) } : null;
}
