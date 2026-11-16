import { ApiError, ok, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { daysView } from "@/server/days";
import { dayRows, doctorLineFor, historyFrom, progressCounter } from "@/server/overview";
import { addDays, diffDays, isDate } from "@/lib/time";
import { historyExtras } from "@/server/history";

// History list (free) with the doctor line. The interactive window is at most 92 days.
export const GET = route({ feature: "history_list" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const url = new URL(ctx.req.url);
  const to = url.searchParams.get("to") ?? u.today;
  const from = url.searchParams.get("from") ?? historyFrom(u, 30);
  if (!isDate(from) || !isDate(to) || from > to) throw new ApiError(422, "VALIDATION", "That date range is not valid.");
  if (diffDays(to, from) > 91) throw new ApiError(422, "RANGE_TOO_LONG", "History shows up to 92 days at a time. Download your data for more.");
  const view = await daysView(ctx.db, ctx.userId, u, from, to > u.today ? u.today : to, ctx.now);
  // The doctor line always looks at the last 30 days, whatever range is on screen.
  const recent = await daysView(ctx.db, ctx.userId, u, addDays(u.today, -29), u.today, ctx.now);
  const line = await doctorLineFor(ctx.db, ctx.userId, u, recent);
  const all = await daysView(ctx.db, ctx.userId, u, historyFrom(u), u.today, ctx.now);
  return ok({
    from, to, plan: ctx.plan, today: u.today, date_format: u.profile.date_format,
    days: dayRows(u, view).reverse(),
    doctor_line: line.show ? line : null,
    progress: progressCounter(u, all),
    pro: ctx.plan === "pro" ? await historyExtras(ctx, u, all) : null,
  });
});
