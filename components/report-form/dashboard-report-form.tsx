"use client";

import { useState, useCallback, useMemo } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { DynamicReportForm } from "@/components/report-form/dynamic-report-form";
import { ActivityHeatmapCard } from "@/components/report-form/activity-heatmap-card";
import { ReportNavigator } from "@/components/report-form/report-navigator";
import { trpc } from "@/lib/trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardReports } from "@/hooks/use-dashboard-reports";
import { isSameDay, formatTanggal, formatBulanTahun } from "@/lib/report-utils";
import type { PeriodType } from "@/lib/template-types";
import { AlertCircle } from "lucide-react";

export function DashboardReportForm() {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const reportsQuery = trpc.report.listWithSchema.useQuery();
  const roomsQuery = trpc.room.listForCurrentUser.useQuery();
  const templatesQuery = trpc.template.listActive.useQuery();

  const reports = reportsQuery.data ?? [];
  const rooms = roomsQuery.data ?? [];
  const templates = templatesQuery.data ?? [];

  const isLoading =
    reportsQuery.isLoading || roomsQuery.isLoading || templatesQuery.isLoading;
  const isError =
    reportsQuery.isError || roomsQuery.isError || templatesQuery.isError;

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [["report"]] });
    queryClient.invalidateQueries({ queryKey: [["room"]] });
    queryClient.invalidateQueries({ queryKey: [["template"]] });
  }, [queryClient]);

  const createReport = trpc.report.create.useMutation({
    onSuccess: invalidateAll,
  });
  const updateReport = trpc.report.update.useMutation({
    onSuccess: invalidateAll,
  });

  const saving = createReport.isPending || updateReport.isPending;
  const today = useMemo(() => new Date(), []);
  const isViewingToday = isSameDay(selectedDate, today);

  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth() + 1;
  const currentDay = selectedDate.getDate();

  const { allReportsToShow } = useDashboardReports({
    reports,
    rooms,
    templates,
    currentYear,
    currentMonth,
    currentDay,
  });

  const currentItem = allReportsToShow[currentIndex];
  
  // Get period type from current template
  const currentPeriodType = useMemo<PeriodType>(() => {
    if (!currentItem) return "daily";
    const template = currentItem.type === "existing" 
      ? currentItem.report?.template 
      : currentItem.template;
    const pt = template?.periodType;
    if (pt === "daily" || pt === "monthly" || pt === "yearly") return pt;
    return "daily";
  }, [currentItem]);

  const handleSave = useCallback(
    async (
      data: Record<string, Record<string, string>>,
      status: "draft" | "submitted",
    ) => {
      if (!currentItem) return;

      try {
        if (currentItem.type === "existing") {
          await updateReport.mutateAsync({
            id: currentItem.report.id,
            data,
            status,
          });
        } else {
          await createReport.mutateAsync({
            templateId: currentItem.template.id,
            roomId: currentItem.room.id,
            periodYear: currentYear,
            periodMonth: currentMonth,
            periodDay:
              currentItem.template.periodType === "daily" ? currentDay : null,
            data,
            status,
          });
        }
      } catch (error) {
        console.error("Gagal menyimpan laporan:", error);
        alert("Gagal menyimpan laporan. Silakan coba lagi.");
      }
    },
    [
      currentItem,
      currentYear,
      currentMonth,
      currentDay,
      createReport,
      updateReport,
    ],
  );

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(allReportsToShow.length - 1, prev + 1));
  }, [allReportsToShow.length]);

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setCurrentIndex(0);
  }, []);

  const handleBackToToday = useCallback(() => {
    setSelectedDate(new Date());
    setCurrentIndex(0);
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-red-500">
          Gagal memuat data. Silakan muat ulang halaman.
        </p>
      </div>
    );
  }

  const heatmap = (
    <ActivityHeatmapCard
      reports={reports}
      currentYear={currentYear}
      currentMonth={currentMonth}
      selectedDate={selectedDate}
      isViewingToday={isViewingToday}
      periodType={currentPeriodType}
      onDayClick={handleDayClick}
      onBackToToday={handleBackToToday}
    />
  );

  if (allReportsToShow.length === 0) {
    return (
      <div className="container mx-auto py-6 p-4 sm:p-0 bg-background rounded-2xl">
        <p className="p-4">
          {isViewingToday
            ? `Tidak ada laporan untuk ${formatBulanTahun(currentYear, currentMonth)}`
            : `Tidak ada laporan untuk ${formatTanggal(selectedDate)}`}
        </p>

        {heatmap}

        <div className="py-8 text-center text-muted-foreground">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            Semua laporan untuk periode ini sudah dikirim!
          </p>
          <p className="text-xs mt-1 opacity-70">
            Seluruh laporan yang ditugaskan sudah lengkap.
          </p>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="container mx-auto py-6 p-4 sm:p-0 bg-background rounded-2xl">
        <p>Memuat laporan...</p>
      </div>
    );
  }

  const isExisting = currentItem.type === "existing";
  const reportData = isExisting ? currentItem.report : null;
  const templateData = isExisting
    ? currentItem.report?.template
    : currentItem.template;
  const roomData = isExisting ? currentItem.report?.room : currentItem.room;
  const schema = templateData?.schema;
  const initialData = (reportData?.data || {}) as Record<
    string,
    Record<string, string>
  >;
  const roomId = roomData?.id || "";
  const templateId = templateData?.id || "";
  const periodYear = reportData?.periodYear || currentYear;
  const periodMonth = reportData?.periodMonth || currentMonth;
  const periodDay =
    reportData?.periodDay ||
    (templateData?.periodType === "daily" ? currentDay : undefined);
  const reportStatus = reportData?.status || "draft";

  if (!schema) {
    return (
      <div className="container mx-auto py-6 p-4 sm:p-0 bg-background rounded-2xl">
        <p className="text-red-500">Error: Skema template tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 p-4 sm:p-0 bg-background rounded-2xl">
      {heatmap}

      <ReportNavigator
        currentIndex={currentIndex}
        totalCount={allReportsToShow.length}
        currentItem={currentItem}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />

      <div className="p-4">
        <DynamicReportForm
          schema={schema}
          roomId={roomId}
          templateId={templateId}
          periodYear={periodYear}
          periodMonth={periodMonth}
          periodDay={periodDay}
          initialData={initialData}
          onSave={handleSave}
          saving={saving}
          status={reportStatus}
        />
      </div>
    </div>
  );
}
