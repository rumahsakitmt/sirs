import type {
  ReportWithSchema,
  RoomForCurrentUser,
  TemplateActive,
} from "@/lib/trpc/types";

// --- Re-export domain type aliases ---
export type Report = ReportWithSchema;
export type Room = RoomForCurrentUser;
export type Template = TemplateActive;

export type ReportItem =
  | { type: "existing"; report: Report }
  | { type: "new"; room: Room; template: Template };

// --- Date helpers ---

export function isSameDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

export function formatTanggal(date: Date) {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatBulanTahun(year: number, month: number) {
  return new Date(year, month - 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

// --- Report key helper ---

export function makeReportKey(
  roomId: string,
  templateId: string,
  day: number | string,
) {
  return `${roomId}-${templateId}-${day}`;
}
