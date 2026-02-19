"use client";

import { Button } from "@/components/ui/button";
import { CalendarDays, Calendar } from "lucide-react";
import type { PeriodType } from "@/lib/template-types";

interface PeriodSelectorProps {
  value: PeriodType;
  onChange: (period: PeriodType) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant={value === "daily" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("daily")}
      >
        <CalendarDays className="mr-1 h-4 w-4" />
        Daily
      </Button>
      <Button
        type="button"
        variant={value === "monthly" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("monthly")}
      >
        <Calendar className="mr-1 h-4 w-4" />
        Monthly
      </Button>
      <Button
        type="button"
        variant={value === "yearly" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("yearly")}
      >
        <Calendar className="mr-1 h-4 w-4" />
        Yearly
      </Button>
    </div>
  );
}
