"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  List,
  Grid3X3,
  ArrowRight,
  CalendarDays,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TemplateType, PeriodType } from "@/lib/template-types";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface TemplateTypeSelectorProps {
  templateName: string;
  setTemplateName: (name: string) => void;
  roomIds: string[];
  setRoomIds: (roomIds: string[]) => void;
  periodType: PeriodType;
  setPeriodType: (type: PeriodType) => void;
  templateType: TemplateType | null;
  setTemplateType: (type: TemplateType) => void;
  rooms: Array<{ id: string; name: string }>;
  isLoadingRooms?: boolean;
  onNext: () => void;
}

export function TemplateTypeSelector({
  templateName,
  setTemplateName,
  roomIds,
  setRoomIds,
  periodType,
  setPeriodType,
  templateType,
  setTemplateType,
  rooms,
  isLoadingRooms,
  onNext,
}: TemplateTypeSelectorProps) {
  const canProceed = templateName && roomIds.length > 0 && templateType;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Template</CardTitle>
          <CardDescription>
            Define the basic information for your report template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="templateName">Template Name</Label>
            <Input
              id="templateName"
              placeholder="e.g., LAPORAN SIRS RADIOLOGI"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Rooms / Departments</Label>
            <div className="border rounded-md p-3 space-y-2">
              {isLoadingRooms ? (
                <p className="text-sm text-muted-foreground">Loading rooms...</p>
              ) : rooms.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rooms available</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {rooms.map((room) => (
                    <div key={room.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`room-${room.id}`}
                        checked={roomIds.includes(room.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setRoomIds([...roomIds, room.id]);
                          } else {
                            setRoomIds(roomIds.filter((id) => id !== room.id));
                          }
                        }}
                      />
                      <label
                        htmlFor={`room-${room.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {room.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              {roomIds.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Selected ({roomIds.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {roomIds.map((id) => {
                      const room = rooms.find((r) => r.id === id);
                      return room ? (
                        <Badge key={id} variant="secondary" className="text-xs">
                          {room.name}
                          <button
                            type="button"
                            onClick={() => setRoomIds(roomIds.filter((rid) => rid !== id))}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Report Period</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={periodType === "daily" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPeriodType("daily")}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Daily
              </Button>
              <Button
                type="button"
                variant={periodType === "monthly" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPeriodType("monthly")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Monthly
              </Button>
              <Button
                type="button"
                variant={periodType === "yearly" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPeriodType("yearly")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Yearly
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Template Type</CardTitle>
          <CardDescription>
            Choose the structure that best fits your reporting needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTemplateType("simple_list")}
              className={cn(
                "relative flex flex-col items-center p-6 rounded-lg border-2 transition-all hover:border-primary",
                templateType === "simple_list"
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <List className="h-12 w-12 mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Simple List</h3>
              <p className="text-sm text-muted-foreground text-center">
                Best for counting items and simple values. Like the Radiologi report.
              </p>
              {templateType === "simple_list" && (
                <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setTemplateType("matrix")}
              className={cn(
                "relative flex flex-col items-center p-6 rounded-lg border-2 transition-all hover:border-primary",
                templateType === "matrix"
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <Grid3X3 className="h-12 w-12 mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Matrix / Grid</h3>
              <p className="text-sm text-muted-foreground text-center">
                Best for complex tables with multiple metrics. Like the Rawat Inap report.
              </p>
              {templateType === "matrix" && (
                <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canProceed}>
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
