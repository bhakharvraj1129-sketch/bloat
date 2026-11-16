import { z } from "zod";
import { route } from "@/server/http";
import { HELP_PAGE_VERSION } from "@/lib/wording";

const body = z.strictObject({ viewed_at: z.iso.datetime(), page_version: z.literal(HELP_PAGE_VERSION) });

// HP-01: the "I've read this" acknowledgement, stored after sign-up with the page version.
export const POST = route({ body, mutation: true }, async (ctx) =>
  ctx.commit([{ op: "insert", table: "help_page_views", row: { page_version: ctx.body.page_version, viewed_at: ctx.body.viewed_at, acknowledged: true } }], 201, { acknowledged: true, page_version: ctx.body.page_version }));
