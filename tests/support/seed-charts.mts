// Local screenshot seed (synthetic data only): a Pro account in New York with five weeks of made-up days,
// so every chart has something to draw. Run against the LOCAL stack only:
//   pnpm exec tsx tests/support/seed-charts.mts   → prints the account's email (password: synthetic-password-1)
import { addDays, at, call, exact, logDay, NY, proUser } from "../api/helpers";

const nyToday = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
const u = await proUser("US", { followed: ["ACT-01", "ACT-02"] });
const N = 35;
for (let i = 0; i < N; i++) {
  const date = addDays(nyToday, -N + i);
  if (i === 4 || i === 17) continue; // nothing logged: unknown days
  const fast = i % 2 === 1;
  const score = fast ? 6 + (i % 3 === 0 ? 1 : 0) : 2 + (i % 3 === 0 ? 1 : 0);
  const startH = 12 + (i % 5);
  const isLast = i === N - 1;
  const late = i === 10 || i === 23;
  if (i === 28) { // provisional: logged but never reviewed
    const p = await call(u, "POST", "/v1/episodes", { strength: 5, started: exact(date, "15:00") }, { now: at(date, "23:30", NY) });
    await call(u, "POST", `/v1/episodes/${p.body.episode.id}/end`, { ended: exact(date, "16:20") }, { now: at(date, "23:30", NY) });
    continue;
  }
  await logDay(u, date, {
    score,
    episode: score > 0 ? { start: `${startH}:10`, end: `${startH + 1}:40`, strength: score } : undefined,
    meals: [{ time: "08:15", text: "Porridge with banana" }, { time: "13:00", text: fast ? "Burger and fries" : "Rice with dal" }],
    habits: { "ACT-01": fast ? "yes" : "no", "ACT-02": i % 3 === 0 ? "yes" : "no" },
    reviewAt: late ? at(addDays(date, 3), "09:00", NY) : isLast ? new Date().toISOString() : undefined,
  });
}
const y = addDays(nyToday, -1);
await call(u, "POST", "/v1/exercise", { type: "walking", started: exact(y, "18:30"), minutes: 35 }, { now: at(y, "23:30", NY) });
await call(u, "POST", "/v1/bowel", { occurred: exact(y, "07:40") }, { now: at(y, "23:30", NY) });
// Today: breakfast, and bloating that started earlier with two strength readings.
await call(u, "POST", "/v1/meals", { save_key: crypto.randomUUID(), dish_text: "Toast and tea", eaten: { mode: "now" } });
const ep = await call(u, "POST", "/v1/episodes", { strength: 3, started: { mode: "now" } });
if (ep.body?.episode?.id) await call(u, "POST", `/v1/episodes/${ep.body.episode.id}/samples`, { strength: 5 });
console.log(JSON.stringify({ email: u.email, today: nyToday }));
