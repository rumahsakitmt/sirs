"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DynamicReportForm } from "@/components/report-form/dynamic-report-form";
import { updateReport, createReport } from "@/lib/actions";
import { AlertCircle, ChevronLeft, ChevronRight, Building2, FileText } from "lucide-react";

interface Report {
  id: string;
  templateId: string;
  roomId: string;
  periodYear: number;
  periodMonth: number;
  periodDay: number | null;
  data: Record<string, any>;
  status: string;
  template: {
    id: string;
    name: string;
    schema: any;
    periodType?: string;
  } | null;
  room: {
    id: string;
    name: string;
  } | null;
}

interface Room {
  id: string;
  name: string;
}

interface Template {
  id: string;
  name: string;
  roomId: string | null;
  periodType: string;
  schema: any;
}

interface DashboardReportFormProps {
  reports: Report[];
  rooms: Room[];
  templates: Template[];
  userId: string;
  userName: string;
}

export function DashboardReportForm({ 
  reports, 
  rooms, 
  templates, 
  userId,
  userName 
}: DashboardReportFormProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [createdReportIds, setCreatedReportIds] = useState<Record<number, string>>({});

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();

  // Get draft reports for current period
  const draftReports = useMemo(() => {
    return reports.filter((r) => 
      r.status === "draft" && 
      r.periodYear === currentYear && 
      r.periodMonth === currentMonth
    );
  }, [reports, currentYear, currentMonth]);

  // Get submitted reports for current period (to exclude from needed reports)
  const submittedReportKeys = useMemo(() => {
    const keys = new Set<string>();
    reports.forEach((r) => {
      if (r.status === "submitted" && r.periodYear === currentYear && r.periodMonth === currentMonth) {
        keys.add(`${r.roomId}-${r.templateId}`);
      }
    });
    return keys;
  }, [reports, currentYear, currentMonth]);

  // Determine which room/template combinations need reports
  const neededReports = useMemo(() => {
    const needed: Array<{ room: Room; template: Template }> = [];
    
    rooms.forEach((room) => {
      templates.forEach((template) => {
        // Check if template is for this room or is global (roomId is null)
        if (template.roomId === null || template.roomId === room.id) {
          const key = `${room.id}-${template.id}`;
          // Only add if not already submitted
          if (!submittedReportKeys.has(key)) {
            needed.push({ room, template });
          }
        }
      });
    });
    
    return needed;
  }, [rooms, templates, submittedReportKeys]);

  // Combine draft reports and needed reports
  const allReportsToShow = useMemo(() => {
    const items: Array<
      | { type: "existing"; report: Report }
      | { type: "new"; room: Room; template: Template }
    > = [];

    // Add existing draft reports
    draftReports.forEach((report) => {
      items.push({ type: "existing", report });
    });

    // Add new report slots for room/template combos that don't have a draft
    neededReports.forEach(({ room, template }) => {
      const hasDraft = draftReports.some(
        (r) => r.roomId === room.id && r.templateId === template.id
      );
      if (!hasDraft) {
        items.push({ type: "new", room, template });
      }
    });

    return items;
  }, [draftReports, neededReports]);

  const currentItem = allReportsToShow[currentIndex];

  const handleSave = useCallback(
    async (data: Record<string, any>, status: "draft" | "submitted") => {
      if (!currentItem) return;

      setSaving(true);
      try {
        if (currentItem.type === "existing") {
          // Update existing report
          await updateReport(currentItem.report.id, data, status);
        } else {
          // Create new report
          const periodDay = currentItem.template.periodType === "daily" ? currentDay : null;
          const newReportId = await createReport(
            currentItem.template.id,
            currentItem.room.id,
            userId,
            currentYear,
            currentMonth,
            periodDay,
            data,
            status
          );
          // Store the created report ID so we can update it next time
          setCreatedReportIds((prev) => ({ ...prev, [currentIndex]: newReportId }));
        }
        
        if (status === "submitted") {
          router.refresh();
        }
      } catch (error) {
        console.error("Failed to save report:", error);
        alert("Failed to save report. Please try again.");
      } finally {
        setSaving(false);
      }
    },
    [currentItem, currentIndex, currentYear, currentMonth, currentDay, userId, router]
  );

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(allReportsToShow.length - 1, prev + 1));
  };

  if (allReportsToShow.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {userName}</h1>
          <p className="text-muted-foreground">No reports to fill for {currentMonth}/{currentYear}</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>All reports for this period have been submitted!</p>
            <p className="text-sm mt-2">Great job!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {userName}</h1>
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  // Extract data for display
  const isExisting = currentItem.type === "existing";
  const reportData = isExisting ? currentItem.report : null;
  const roomData = isExisting ? currentItem.report?.room : currentItem.room;
  const templateData = isExisting ? currentItem.report?.template : currentItem.template;
  const schema = templateData?.schema;
  const initialData = reportData?.data || {};
  const roomId = roomData?.id || "";
  const templateId = templateData?.id || "";
  const periodYear = reportData?.periodYear || currentYear;
  const periodMonth = reportData?.periodMonth || currentMonth;
  const periodDay = reportData?.periodDay || (templateData?.periodType === "daily" ? currentDay : undefined);

  if (!schema) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {userName}</h1>
          <p className="text-red-500">Error: Template schema is missing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Welcome, {userName}</h1>
        <p className="text-muted-foreground">
          Report {currentIndex + 1} of {allReportsToShow.length} to fill for {currentMonth}/{currentYear}
        </p>
      </div>

      <Card className="mb-4 border-blue-200 bg-blue-50/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {currentIndex + 1} / {allReportsToShow.length}
              </Badge>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{roomData?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{templateData?.name}</span>
                </div>
                {!isExisting && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-400">
                    New
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex === allReportsToShow.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

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
      />
    </div>
  );
}
