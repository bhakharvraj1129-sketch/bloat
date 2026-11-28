import { z } from "zod";
import { ApiError, ok, route } from "@/server/http";
import { lookupPincode } from "@/server/places";

// India PIN code to state and city, for filling in the state in setup and in You. Signed-in only.
// The PIN code travels in the request body, not the address, so it stays out of request logs, and
// it is neither stored nor logged here (review of 28 Nov 2026). A lookup changes nothing.
export const POST = route({ body: z.strictObject({ pin: z.string() }) }, async (ctx) => {
  const pin = ctx.body.pin.trim();
  if (!/^[1-9]\d{5}$/.test(pin)) throw new ApiError(422, "VALIDATION", "A PIN code has 6 digits and doesn't start with 0.");
  const place = lookupPincode(pin);
  if (!place) throw new ApiError(404, "NOT_FOUND", "We couldn't find that PIN code. Choose your state from the list instead.");
  return ok({ state: place.state, city: place.city });
});
