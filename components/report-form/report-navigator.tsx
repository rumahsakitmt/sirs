"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReportStatusBadge } from "@/components/report-form/report-status-badge";
import type { ReportItem } from "@/lib/report-utils";
import { ChevronLeft, ChevronRight, Building2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportNavigatorProps {
  currentIndex: number;
  totalCount: number;
  currentItem: ReportItem;
  onPrevious: () => void;
  onNext: () => void;
}

export function ReportNavigator({
  currentIndex,
  totalCount,
  currentItem,
  onPrevious,
  onNext,
}: ReportNavigatorProps) {
  const isExisting = currentItem.type === "existing";
  const roomName =
    currentItem.type === "existing"
      ? currentItem.report.room?.name
      : currentItem.room.name;
  const templateName =
    currentItem.type === "existing"
      ? currentItem.report.template?.name
      : currentItem.template.name;

  let badgeStatus: "new" | "submitted" | "draft" | null = null;
  if (!isExisting) {
    badgeStatus = "new";
  } else if (currentItem.report.status === "submitted") {
    badgeStatus = "submitted";
  } else if (currentItem.report.status === "draft") {
    badgeStatus = "draft";
  }

  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {currentIndex + 1} / {totalCount}
        </Badge>
        {badgeStatus && <ReportStatusBadge status={badgeStatus} />}
      </div>
      <div className="flex items-center  justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Sebelumnya
        </Button>
        <div className="flex flex-col items-start  text-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium uppercase font-mono">{roomName}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{templateName}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={currentIndex === totalCount - 1}
        >
          Selanjutnya
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
