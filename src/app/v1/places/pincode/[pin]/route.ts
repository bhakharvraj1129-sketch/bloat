import { ApiError, ok, route } from "@/server/http";
import { lookupPincode } from "@/server/places";

// India PIN code to state and city, for filling in the state in setup and in You. Signed-in only;
// the PIN code is not stored or logged.
export const GET = route({}, async (ctx) => {
  const pin = ctx.params.pin ?? "";
  if (!/^[1-9]\d{5}$/.test(pin)) throw new ApiError(422, "VALIDATION", "A PIN code has 6 digits and doesn't start with 0.");
  const place = lookupPincode(pin);
  if (!place) throw new ApiError(404, "NOT_FOUND", "We couldn't find that PIN code. Choose your state from the list instead.");
  return ok({ state: place.state, city: place.city });
});
