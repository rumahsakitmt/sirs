"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DynamicReportForm } from "@/components/report-form/dynamic-report-form";
import { createReport, updateReport } from "@/lib/actions";
import type { TemplateSchema } from "@/lib/template-types";
import { ArrowLeft, FileText, Building2 } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

interface Room {
  id: string;
  name: string;
}

interface Template {
  id: string;
  name: string;
  roomId: string | null;
  schema: TemplateSchema;
  periodType: string;
}

interface NewReportFormProps {
  rooms: Room[];
  templates: Template[];
  userId: string;
}

export function NewReportForm({ rooms, templates, userId }: NewReportFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "form">("select");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(() => (new Date().getMonth() + 1).toString());
  const [selectedDay, setSelectedDay] = useState("");
  const [reportId, setReportId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Auto-select room if user only has one room
  useEffect(() => {
    if (rooms.length === 1 && !selectedRoom) {
      setSelectedRoom(rooms[0].id);
    }
  }, [rooms, selectedRoom]);

  // Memoize filtered templates to avoid recalculation on every render
  const availableTemplates = useMemo(() => {
    return templates.filter(
      (t) => !selectedRoom || t.roomId === selectedRoom || t.roomId === null
    );
  }, [templates, selectedRoom]);

  // Auto-select template if only one is available for the selected room
  useEffect(() => {
    if (availableTemplates.length === 1 && !selectedTemplate) {
      setSelectedTemplate(availableTemplates[0].id);
    } else if (availableTemplates.length > 0 && selectedTemplate) {
      // Reset template selection if the current template is not in available templates
      const isValidTemplate = availableTemplates.some(t => t.id === selectedTemplate);
      if (!isValidTemplate) {
        setSelectedTemplate(availableTemplates.length === 1 ? availableTemplates[0].id : "");
      }
    }
  }, [availableTemplates, selectedTemplate]);

  // Memoize current template lookup
  const currentTemplateData = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplate);
  }, [templates, selectedTemplate]);

  // Determine if we should show simplified view (single room + single template)
  const isSimplifiedView = rooms.length === 1 && availableTemplates.length === 1;

  const isDaily = currentTemplateData?.periodType === "daily";

  // Use useCallback for event handlers to prevent unnecessary re-renders
  const handleContinue = useCallback(() => {
    if (!selectedTemplate) {
      alert("Please select a template");
      return;
    }
    
    const template = templates.find((t) => t.id === selectedTemplate);
    if (!template?.schema) {
      alert("Template schema is missing");
      return;
    }
    
    setStep("form");
  }, [selectedTemplate, templates]);

  const handleSave = useCallback(async (
    data: Record<string, any>,
    status: "draft" | "submitted"
  ) => {
    if (!currentTemplateData) return;

    setSaving(true);
    try {
      if (reportId) {
        await updateReport(reportId, data, status);
      } else {
        const roomId = selectedRoom || currentTemplateData.roomId || "";
        const id = await createReport(
          selectedTemplate,
          roomId,
          userId,
          parseInt(selectedYear),
          parseInt(selectedMonth),
          isDaily && selectedDay ? parseInt(selectedDay) : null,
          data,
          status
        );
        setReportId(id);
      }

      if (status === "submitted") {
        router.push("/reports");
      }
    } catch (error) {
      console.error("Failed to save report:", error);
      alert("Failed to save report. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [reportId, selectedRoom, currentTemplateData, selectedTemplate, userId, selectedYear, selectedMonth, isDaily, selectedDay, router]);

  const handleBack = useCallback(() => setStep("select"), []);

  // Filter rooms and templates to ensure valid values
  const validRooms = useMemo(() => rooms.filter((r) => r && r.id), [rooms]);
  const validTemplates = useMemo(() => availableTemplates.filter((t) => t && t.id), [availableTemplates]);

  if (step === "select") {
    // Simplified view when user has one room with one template
    if (isSimplifiedView && currentTemplateData) {
      const selectedRoomData = rooms[0];
      
      return (
        <div className="container mx-auto py-6 max-w-2xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">New Report</h1>
            <p className="text-muted-foreground">
              Select the period for your report
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Your Assignment</CardTitle>
              <CardDescription>
                You are assigned to create reports for this template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-3 flex-1 p-3 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Room</p>
                    <p className="font-medium">{selectedRoomData.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-1 p-3 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Template</p>
                    <p className="font-medium">{currentTemplateData.name}</p>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {currentTemplateData.periodType}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Select Period</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Month</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, index) => (
                        <SelectItem key={index + 1} value={(index + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isDaily && (
                <div className="space-y-2">
                  <Label>Day (Optional for daily reports)</Label>
                  <Select 
                    value={selectedDay || "all"} 
                    onValueChange={(v) => setSelectedDay(v === "all" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Whole month</SelectItem>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleContinue}
              >
                Continue to Form
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Full selection view when user has multiple rooms or templates
    return (
      <div className="container mx-auto py-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">New Report</h1>
          <p className="text-muted-foreground">
            Select room, template, and period for your report
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Room / Department</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {validRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Report Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {validTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.periodType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isDaily && (
              <div className="space-y-2">
                <Label>Day (Optional for daily reports)</Label>
                <Select 
                  value={selectedDay || "all"} 
                  onValueChange={(v) => setSelectedDay(v === "all" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Whole month</SelectItem>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleContinue}
              disabled={!selectedTemplate}
            >
              Continue to Form
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "form" && currentTemplateData?.schema) {
    const roomId = selectedRoom || currentTemplateData.roomId || "";
    
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Fill Report</h1>
            <p className="text-muted-foreground">
              Enter the data for your report
            </p>
          </div>
        </div>

        <DynamicReportForm
          schema={currentTemplateData.schema}
          roomId={roomId}
          templateId={selectedTemplate}
          periodYear={parseInt(selectedYear)}
          periodMonth={parseInt(selectedMonth)}
          periodDay={isDaily && selectedDay ? parseInt(selectedDay) : undefined}
          onSave={handleSave}
          saving={saving}
        />
      </div>
    );
  }

  return null;
}
