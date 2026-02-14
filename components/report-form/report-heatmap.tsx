"use client";

import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  onDayClick?: (date: Date) => void;
  selectedDate?: Date;
}

export function ReportHeatmap({ reports, year, month, onDayClick, selectedDate }: ReportHeatmapProps) {
  const currentDate = new Date();
  const targetYear = year ?? currentDate.getFullYear();
  const targetMonth = month ?? currentDate.getMonth() + 1;

  // Get all days in the target month
  const daysInMonth = useMemo(() => {
    const days: Date[] = [];
    const lastDay = new Date(targetYear, targetMonth, 0);
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(targetYear, targetMonth - 1, day));
    }
    
    return days;
  }, [targetYear, targetMonth]);

  // Calculate report counts per day
  const reportCounts = useMemo(() => {
    const counts = new Map<string, number>();
    
    reports.forEach((report) => {
      if (report.status === "submitted" && report.periodDay) {
        const dateKey = `${report.periodYear}-${String(report.periodMonth).padStart(2, "0")}-${String(report.periodDay).padStart(2, "0")}`;
        counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
      }
    });
    
    return counts;
  }, [reports]);

  // Get max count for color scaling
  const maxCount = useMemo(() => {
    return Math.max(...reportCounts.values(), 1);
  }, [reportCounts]);

  const getColorClass = (count: number) => {
    if (count === 0) return "bg-muted";
    
    const intensity = count / maxCount;
    
    if (intensity <= 0.25) return "bg-emerald-200";
    if (intensity <= 0.5) return "bg-emerald-300";
    if (intensity <= 0.75) return "bg-emerald-500";
    return "bg-emerald-700";
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  return (
    <TooltipProvider>
      <div className="w-full">
        {/* Simple heatmap strip - no calendar structure */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {daysInMonth.map((date, index) => {
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            const count = reportCounts.get(dateKey) || 0;
            const today = isToday(date);
            const future = isFutureDate(date);
            
            const isSelected = selectedDate &&
              date.getDate() === selectedDate.getDate() &&
              date.getMonth() === selectedDate.getMonth() &&
              date.getFullYear() === selectedDate.getFullYear();

            const canClick = onDayClick && !future;

            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => canClick && onDayClick?.(date)}
                    disabled={future}
                    className={`
                      w-8 h-8 rounded-md ${getColorClass(count)} 
                      flex items-center justify-center flex-shrink-0
                      transition-all duration-200
                      ${today ? "ring-2 ring-primary" : ""}
                      ${isSelected ? "ring-2 ring-blue-500" : ""}
                      ${canClick ? "hover:ring-2 hover:ring-ring cursor-pointer" : "cursor-not-allowed opacity-60"}
                    `}
                  >
                    <span className={`text-[10px] font-medium ${count > 0 ? "text-white" : "text-muted-foreground"}`}>
                      {date.getDate()}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="text-xs">
                    <p className="font-medium">{formatDate(date)}</p>
                    <p>{count} report{count !== 1 ? "s" : ""} submitted</p>
                    {canClick && count === 0 && <p className="text-blue-400 mt-1">Click to fill missing report</p>}
                    {future && <p className="text-gray-400 mt-1">Cannot fill reports for future dates</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-3 mt-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>Less</span>
            <div className="flex gap-0.5">
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <div className="w-3 h-3 rounded-sm bg-emerald-200" />
              <div className="w-3 h-3 rounded-sm bg-emerald-300" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              <div className="w-3 h-3 rounded-sm bg-emerald-700" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
