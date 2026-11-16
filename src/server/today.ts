import "server-only";
import type { Ctx } from "./http";
import type { UserCtx } from "./userdata";
import type { DaysView } from "./days";

/** Pro additions to Today (experiment card, daily card, next best log, phase). Filled in by later slices. */
export async function todayExtras(_ctx: Ctx<unknown>, _u: UserCtx, _view: DaysView, _answers: Record<string, unknown>) {
  return { pro: null as null | Record<string, unknown> };
}
