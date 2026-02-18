import type { inferRouterOutputs, inferRouterInputs } from "@trpc/server";
import type { AppRouter } from "./router";

/**
 * Inferred types from the tRPC router.
 * Use these instead of hand-written interfaces.
 */
export type RouterOutput = inferRouterOutputs<AppRouter>;
export type RouterInput = inferRouterInputs<AppRouter>;

// Report types
export type ReportWithSchema = RouterOutput["report"]["listWithSchema"][number];
export type ReportListItem = RouterOutput["report"]["list"][number];
export type ReportDetail = RouterOutput["report"]["getById"];
export type ReportForViewer = RouterOutput["report"]["getForViewer"][number];

// Room types
export type RoomListItem = RouterOutput["room"]["list"][number];
export type RoomForCurrentUser = RouterOutput["room"]["listForCurrentUser"][number];

// Template types
export type TemplateListItem = RouterOutput["template"]["list"][number];
export type TemplateActive = RouterOutput["template"]["listActive"][number];
export type TemplateDetail = RouterOutput["template"]["getById"];

// User types
export type UserListItem = RouterOutput["user"]["list"][number];
export type UserRoom = RouterOutput["user"]["getUserRooms"][number];
