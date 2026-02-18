import { useMemo } from "react";
import type { Report, Room, Template, ReportItem } from "@/lib/report-utils";
import { makeReportKey } from "@/lib/report-utils";

interface UseDashboardReportsInput {
  reports: Report[];
  rooms: Room[];
  templates: Template[];
  currentYear: number;
  currentMonth: number;
  currentDay: number;
}

interface UseDashboardReportsResult {
  draftReports: Report[];
  submittedReportsForDate: Report[];
  submittedReportKeys: Set<string>;
  neededReports: Array<{ room: Room; template: Template }>;
  allReportsToShow: ReportItem[];
}

export function useDashboardReports({
  reports,
  rooms,
  templates,
  currentYear,
  currentMonth,
  currentDay,
}: UseDashboardReportsInput): UseDashboardReportsResult {
  // Single-pass filtering of reports by status and period
  const { draftReports, submittedReportsForDate, submittedReportKeys } =
    useMemo(() => {
      const drafts: Report[] = [];
      const submitted: Report[] = [];
      const keys = new Set<string>();

      for (const r of reports) {
        if (r.periodYear !== currentYear || r.periodMonth !== currentMonth)
          continue;

        if (r.status === "submitted") {
          const dayKey = r.periodDay !== null ? r.periodDay : "monthly";
          keys.add(makeReportKey(r.roomId, r.templateId, dayKey));

          if (r.periodDay === null || r.periodDay === currentDay) {
            submitted.push(r);
          }
        } else if (r.status === "draft") {
          if (r.periodDay === null || r.periodDay === currentDay) {
            drafts.push(r);
          }
        }
      }

      return {
        draftReports: drafts,
        submittedReportsForDate: submitted,
        submittedReportKeys: keys,
      };
    }, [reports, currentYear, currentMonth, currentDay]);

  // Room/template combos that still need a report
  const neededReports = useMemo(() => {
    const needed: Array<{ room: Room; template: Template }> = [];

    for (const room of rooms) {
      for (const template of templates) {
        if (template.roomId !== null && template.roomId !== room.id) continue;

        const dayKey = template.periodType === "daily" ? currentDay : "monthly";
        if (
          !submittedReportKeys.has(
            makeReportKey(room.id, template.id, dayKey),
          )
        ) {
          needed.push({ room, template });
        }
      }
    }

    return needed;
  }, [rooms, templates, submittedReportKeys, currentDay]);

  // Merged list: drafts first, then submitted (read-only), then new slots
  const allReportsToShow = useMemo(() => {
    const items: ReportItem[] = [];
    const seenIds = new Set<string>();

    for (const report of draftReports) {
      items.push({ type: "existing", report });
      seenIds.add(report.id);
    }

    for (const report of submittedReportsForDate) {
      if (!seenIds.has(report.id)) {
        items.push({ type: "existing", report });
        seenIds.add(report.id);
      }
    }

    for (const { room, template } of neededReports) {
      const hasExisting = items.some(
        (item) =>
          item.type === "existing" &&
          item.report.roomId === room.id &&
          item.report.templateId === template.id,
      );
      if (!hasExisting) {
        items.push({ type: "new", room, template });
      }
    }

    return items;
  }, [draftReports, submittedReportsForDate, neededReports]);

  return {
    draftReports,
    submittedReportsForDate,
    submittedReportKeys,
    neededReports,
    allReportsToShow,
  };
}
