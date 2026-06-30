import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportHeatmap } from "@/components/report-form/report-heatmap";
import { formatTanggal, formatBulanTahun } from "@/lib/report-utils";
import type { Report } from "@/lib/report-utils";
import type { PeriodType } from "@/lib/template-types";
import { RotateCcw } from "lucide-react";

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i).toLocaleDateString("id-ID", { month: "long" }),
);

const CURRENT_CALENDAR_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_CALENDAR_YEAR - i);

interface ActivityHeatmapCardProps {
  reports: Report[];
  currentYear: number;
  currentMonth: number;
  selectedDate: Date;
  isViewingToday: boolean;
  periodType?: PeriodType;
  onDayClick: (date: Date) => void;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onBackToToday: () => void;
}

export function ActivityHeatmapCard({
  reports,
  currentYear,
  currentMonth,
  selectedDate,
  isViewingToday,
  periodType = "daily",
  onDayClick,
  onYearChange,
  onMonthChange,
  onBackToToday,
}: ActivityHeatmapCardProps) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 font-mono font-bold">
          Laporan Aktivitas
          {isViewingToday &&
            ` - ${formatBulanTahun(currentYear, currentMonth)}`}
        </div>
        <div className="flex items-center gap-2">
          {periodType === "daily" && (
            <>
              <Select
                value={currentYear.toString()}
                onValueChange={(v) => onYearChange(parseInt(v, 10))}
              >
                <SelectTrigger className="w-[100px] font-sans font-normal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={currentMonth.toString()}
                onValueChange={(v) => onMonthChange(parseInt(v, 10))}
              >
              <SelectTrigger className="w-[160px] font-sans font-normal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={month} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </>
          )}
          {!isViewingToday && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToToday}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-4 w-4" />
              Kembali ke Hari Ini
            </Button>
          )}
        </div>
      </div>

      <ReportHeatmap
        reports={reports}
        year={currentYear}
        month={currentMonth}
        periodType={periodType}
        onDayClick={onDayClick}
        selectedDate={selectedDate}
      />
      <p className="text-xs text-muted-foreground">
        {isViewingToday
          ? "Klik pada periode untuk mengisi laporan yang belum terisi. Menampilkan laporan yang sudah dikirim."
          : `Melihat laporan untuk ${formatTanggal(selectedDate)}. Klik \"Kembali ke Hari Ini\" untuk kembali ke periode saat ini.`}
      </p>
    </div>
  );
}
