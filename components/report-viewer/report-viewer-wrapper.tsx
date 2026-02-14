"use client";

import { ReportViewer } from "./report-viewer";
import { getReportsForViewer } from "@/lib/actions";
import type { TemplateSchema } from "@/lib/template-types";

interface Template {
  id: string;
  name: string;
  type: string;
  periodType: string;
  schema: TemplateSchema;
  room: {
    id: string;
    name: string;
  } | null;
}

interface Room {
  id: string;
  name: string;
}

interface ReportViewerWrapperProps {
  templates: Template[];
  rooms: Room[];
}

export function ReportViewerWrapper({ templates, rooms }: ReportViewerWrapperProps) {
  const handleFilterChange = async (filters: {
    templateId: string;
    year: number;
    month?: number;
    startDay?: number;
    endDay?: number;
    roomId?: string;
    status?: "draft" | "submitted";
  }) => {
    const results = await getReportsForViewer(filters.templateId, {
      year: filters.year,
      month: filters.month,
      startDay: filters.startDay,
      endDay: filters.endDay,
      roomId: filters.roomId,
      status: filters.status,
    });

    return results.map((r) => ({
      ...r,
      data: r.data as Record<string, Record<string, string>>,
      createdAt: r.createdAt,
      submittedAt: r.submittedAt,
    }));
  };

  return (
    <ReportViewer
      templates={templates}
      rooms={rooms}
      onFilterChange={handleFilterChange}
    />
  );
}
