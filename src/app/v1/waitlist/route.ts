import { z } from "zod";
import { route } from "@/server/http";
import { srv } from "@/server/db";

// Other countries: an optional email and the country only. No health question is asked or stored.
export const POST = route({ auth: false, body: z.strictObject({ email: z.email().max(254), country: z.string().trim().min(2).max(60) }) }, async (ctx) => {
  await srv("srv_waitlist_add", { p_email: ctx.body.email, p_country: ctx.body.country });
  return { status: 201, data: { joined: true } };
});
