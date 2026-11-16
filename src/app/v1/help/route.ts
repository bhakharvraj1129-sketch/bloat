import { ok, route } from "@/server/http";
import { helpPage } from "@/lib/wording";
import { emergencyNumber, helpline } from "@/lib/registry";

// Public: works without login. Unknown countries get "your local emergency number", never a guess.
export const GET = route({ auth: false }, async (ctx) => {
  const code = new URL(ctx.req.url).searchParams.get("country");
  return ok({ ...helpPage(code), country: emergencyNumber(code) ? code : null, helpline: helpline(code), language_note: null });
});
