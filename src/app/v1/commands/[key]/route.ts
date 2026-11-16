import { ok, route } from "@/server/http";

// "Check save status": did a request with this save key reach the server? Never shows an unconfirmed save.
export const GET = route({}, async (ctx) => {
  const { data } = await ctx.db.from("command_log").select("route,http_status,response,created_at").eq("user_id", ctx.userId).eq("key", ctx.params.key!).limit(1);
  const row = data?.[0];
  return ok(row ? { saved: (row.http_status as number) < 400, status: row.http_status, response: row.response, at: row.created_at } : { saved: false });
});
