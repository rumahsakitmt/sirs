import "server-only";

import { createCallerFactory } from "./init";
import { appRouter } from "./router";
import { createTRPCContext } from "./init";
import { cache } from "react";

/**
 * Server-side tRPC caller for use in Server Components.
 *
 * Usage in a Server Component:
 * ```ts
 * import { api } from "@/lib/trpc/server";
 *
 * export default async function Page() {
 *   const rooms = await api.room.list();
 *   return <div>{rooms.map(r => r.name)}</div>;
 * }
 * ```
 */
const createCaller = createCallerFactory(appRouter);

export const api = cache(async () => {
  const ctx = await createTRPCContext();
  return createCaller(ctx);
})

// Helper that awaits the caller for convenience
export async function getApi() {
  return await api();
}
