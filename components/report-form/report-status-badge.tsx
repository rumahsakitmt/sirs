"use client";

import { Badge } from "@/components/ui/badge";

interface ReportStatusBadgeProps {
  status: "new" | "submitted" | "draft";
}

const badgeConfig = {
  new: {
    label: "Baru",
    className: "text-yellow-600 border-yellow-400",
  },
  submitted: {
    label: "Terkirim",
    className: "text-blue-600 border-blue-400 bg-blue-50",
  },
  draft: {
    label: "Draf",
    className: "text-orange-600 border-orange-400 bg-orange-50",
  },
} as const;

export function ReportStatusBadge({ status }: ReportStatusBadgeProps) {
  const config = badgeConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
