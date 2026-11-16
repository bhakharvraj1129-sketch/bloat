import "server-only";
import { anonClient } from "./supabase";
import { env } from "./env";

export type Op =
  | { op: "insert"; table: string; row: Record<string, unknown> }
  | { op: "upsert"; table: string; row: Record<string, unknown>; conflict: string[] }
  | { op: "update"; table: string; match: Record<string, unknown>; set: Record<string, unknown>; require?: boolean }
  | { op: "delete"; table: string; match: Record<string, unknown>; require?: boolean };

export class DbError extends Error {
  constructor(public code: string, message: string, public details: string | null) {
    super(message);
  }
  get isUnique() { return this.code === "23505"; }
  get isOverlap() { return this.code === "23P01"; }
  get isNoMatch() { return this.code === "P0003"; }
  get isCheck() { return this.code === "23514" || this.code === "23503" || this.code === "22P02" || this.code === "23502"; }
  get isUserGone() { return this.code === "P0002"; }
  mentions(name: string) { return this.message.includes(name) || (this.details ?? "").includes(name); }
}

export type TxResult = Array<{ n: number; row: Record<string, unknown> | null }>;

/** Run write operations for one user in a single database transaction. */
export async function tx(userId: string, ops: Op[]): Promise<TxResult> {
  if (ops.length === 0) return [];
  const { data, error } = await anonClient().rpc("srv_tx", { p_secret: env.serverSecret, p_user: userId, p_ops: ops });
  if (error) throw new DbError(error.code ?? "XX000", error.message, error.details ?? null);
  return data as TxResult;
}

export async function srv<T = unknown>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await anonClient().rpc(fn, { p_secret: env.serverSecret, ...args });
  if (error) throw new DbError(error.code ?? "XX000", error.message, error.details ?? null);
  return data as T;
}
