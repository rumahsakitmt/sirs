"use client";

import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PeriodType } from "@/lib/template-types";

interface Report {
  id: string;
  roomId: string;
  periodYear: number;
  periodMonth: number;
  periodDay: number | null;
  status: string;
}

interface ReportHeatmapProps {
  reports: Report[];
  year?: number;
  month?: number;
  periodType?: PeriodType;
  onDayClick?: (date: Date) => void;
  selectedDate?: Date;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function ReportHeatmap({
  reports,
  year,
  month,
  periodType = "daily",
  onDayClick,
  selectedDate,
}: ReportHeatmapProps) {
  const currentDate = new Date();
  const targetYear = year ?? currentDate.getFullYear();
  const targetMonth = month ?? currentDate.getMonth() + 1;

  // Get time units based on period type
  const timeUnits = useMemo(() => {
    if (periodType === "yearly") {
      // Show last 5 years
      const years: { label: string; value: number; date: Date }[] = [];
      for (let i = 4; i >= 0; i--) {
        const y = targetYear - i;
        years.push({
          label: String(y),
          value: y,
          date: new Date(y, 0, 1),
        });
      }
      return years;
    } else if (periodType === "monthly") {
      // Show all months in the target year
      const months: { label: string; value: number; date: Date }[] = [];
      for (let m = 1; m <= 12; m++) {
        months.push({
          label: MONTHS[m - 1],
          value: m,
          date: new Date(targetYear, m - 1, 1),
        });
      }
      return months;
    } else {
      // Daily - show days in target month
      const days: { label: string; value: number; date: Date }[] = [];
      const lastDay = new Date(targetYear, targetMonth, 0);
      for (let day = 1; day <= lastDay.getDate(); day++) {
        days.push({
          label: String(day),
          value: day,
          date: new Date(targetYear, targetMonth - 1, day),
        });
      }
      return days;
    }
  }, [targetYear, targetMonth, periodType]);

  // Calculate report counts based on period type
  const reportCounts = useMemo(() => {
    const counts = new Map<string, number>();

    reports.forEach((report) => {
      if (report.status === "submitted") {
        let key: string;
        if (periodType === "yearly") {
          // Count by year only
          key = String(report.periodYear);
        } else if (periodType === "monthly") {
          // Count by year-month
          key = `${report.periodYear}-${String(report.periodMonth).padStart(2, "0")}`;
        } else {
          // Daily - count by full date
          if (report.periodDay) {
            key = `${report.periodYear}-${String(report.periodMonth).padStart(2, "0")}-${String(report.periodDay).padStart(2, "0")}`;
          } else {
            return; // Skip reports without periodDay for daily view
          }
        }
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });

    return counts;
  }, [reports, periodType]);

  // Get max count for color scaling
  const maxCount = useMemo(() => {
    return Math.max(...reportCounts.values(), 1);
  }, [reportCounts]);

  const getColorClass = (count: number) => {
    if (count === 0) return "bg-muted";

    const intensity = count / maxCount;

    if (intensity <= 0.25) return "bg-blue-200";
    if (intensity <= 0.5) return "bg-blue-300";
    if (intensity <= 0.75) return "bg-blue-500";
    return "bg-blue-700";
  };

  const formatDate = (date: Date) => {
    if (periodType === "yearly") {
      return date.toLocaleDateString("en-US", { year: "numeric" });
    } else if (periodType === "monthly") {
      return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const isCurrentPeriod = (date: Date) => {
    const today = new Date();
    if (periodType === "yearly") {
      return date.getFullYear() === today.getFullYear();
    } else if (periodType === "monthly") {
      return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
    } else {
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    }
  };

  const isFuturePeriod = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  const getCountKey = (unit: { value: number; date: Date }) => {
    if (periodType === "yearly") {
      return String(unit.value);
    } else if (periodType === "monthly") {
      return `${targetYear}-${String(unit.value).padStart(2, "0")}`;
    } else {
      return `${unit.date.getFullYear()}-${String(unit.date.getMonth() + 1).padStart(2, "0")}-${String(unit.value).padStart(2, "0")}`;
    }
  };

  const isSelected = (unit: { date: Date }) => {
    if (!selectedDate) return false;
    if (periodType === "yearly") {
      return unit.date.getFullYear() === selectedDate.getFullYear();
    } else if (periodType === "monthly") {
      return unit.date.getFullYear() === selectedDate.getFullYear() && 
             unit.date.getMonth() === selectedDate.getMonth();
    } else {
      return unit.date.getDate() === selectedDate.getDate() &&
             unit.date.getMonth() === selectedDate.getMonth() &&
             unit.date.getFullYear() === selectedDate.getFullYear();
    }
  };

  return (
    <TooltipProvider>
      <div className="w-full">
        <div className="flex gap-1 overflow-x-auto p-2">
          {timeUnits.map((unit) => {
            const countKey = getCountKey(unit);
            const count = reportCounts.get(countKey) || 0;
            const current = isCurrentPeriod(unit.date);
            const future = isFuturePeriod(unit.date);
            const selected = isSelected(unit);
            const canClick = onDayClick && !future;

            return (
              <Tooltip key={countKey}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => canClick && onDayClick?.(unit.date)}
                    disabled={future}
                    className={`
                      ${periodType === "daily" ? "w-8 h-8" : "w-12 h-12"}
                      rounded-md ${getColorClass(count)}
                      flex items-center justify-center shrink-0
                      transition-all duration-200
                      ${current ? "ring-2 ring-primary" : ""}
                      ${selected ? "ring-2 ring-green-500" : ""}
                      ${canClick ? "hover:ring-2 hover:ring-ring cursor-pointer" : "cursor-not-allowed opacity-60"}
                    `}
                  >
                    <span
                      className={`text-[10px] font-medium ${count > 0 ? "text-white" : "text-muted-foreground"}`}
                    >
                      {unit.label}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="text-xs">
                    <p className="font-medium">{formatDate(unit.date)}</p>
                    <p>{count} laporan terkirim</p>
                    {canClick && count === 0 && (
                      <p className="text-blue-400 mt-1">
                        Click to fill missing report
                      </p>
                    )}
                    {future && (
                      <p className="text-gray-400 mt-1">
                        Cannot fill reports for future dates
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
