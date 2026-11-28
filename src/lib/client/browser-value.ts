"use client";
import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

/**
 * A value that only the browser knows (reduce motion, screen size, today's date), read without an
 * extra render: the server and the first paint use `server`, the browser then uses `read()`.
 * `read` must return the same value each time while nothing changes (a string, number or boolean).
 */
export function useBrowserValue<T extends string | number | boolean>(read: () => T, server: T): T {
  return useSyncExternalStore(noSubscribe, read, () => server);
}
