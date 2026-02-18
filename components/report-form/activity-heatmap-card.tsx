import { Button } from "@/components/ui/button";
import { ReportHeatmap } from "@/components/report-form/report-heatmap";
import { formatTanggal, formatBulanTahun } from "@/lib/report-utils";
import type { Report } from "@/lib/report-utils";
import { RotateCcw } from "lucide-react";

interface ActivityHeatmapCardProps {
  reports: Report[];
  currentYear: number;
  currentMonth: number;
  selectedDate: Date;
  isViewingToday: boolean;
  onDayClick: (date: Date) => void;
  onBackToToday: () => void;
}

export function ActivityHeatmapCard({
  reports,
  currentYear,
  currentMonth,
  selectedDate,
  isViewingToday,
  onDayClick,
  onBackToToday,
}: ActivityHeatmapCardProps) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono font-bold">
          Laporan Aktivitas
          {isViewingToday &&
            ` - ${formatBulanTahun(currentYear, currentMonth)}`}
        </div>
        <div>
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
        onDayClick={onDayClick}
        selectedDate={selectedDate}
      />
      <p className="text-xs text-muted-foreground">
        {isViewingToday
          ? "Klik pada tanggal untuk mengisi laporan yang belum terisi. Menampilkan laporan yang sudah dikirim bulan ini."
          : `Melihat laporan untuk ${formatTanggal(selectedDate)}. Klik "Kembali ke Hari Ini" untuk kembali ke tanggal saat ini.`}
      </p>
    </div>
  );
}
