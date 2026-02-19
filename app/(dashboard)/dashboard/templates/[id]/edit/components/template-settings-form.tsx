"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RoomSelector } from "./room-selector";
import { PeriodSelector } from "./period-selector";
import type { PeriodType } from "@/lib/template-types";

interface Room {
  id: string;
  name: string;
}

interface TemplateSettingsFormProps {
  templateName: string;
  onTemplateNameChange: (name: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  roomIds: string[];
  onRoomIdsChange: (roomIds: string[]) => void;
  periodType: PeriodType;
  onPeriodTypeChange: (period: PeriodType) => void;
  isActive: boolean;
  onIsActiveChange: (active: boolean) => void;
  rooms: Room[] | undefined;
  isLoadingRooms: boolean;
}

export function TemplateSettingsForm({
  templateName,
  onTemplateNameChange,
  description,
  onDescriptionChange,
  roomIds,
  onRoomIdsChange,
  periodType,
  onPeriodTypeChange,
  isActive,
  onIsActiveChange,
  rooms,
  isLoadingRooms,
}: TemplateSettingsFormProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Template Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={templateName}
              onChange={(e) => onTemplateNameChange(e.target.value)}
              placeholder="Template name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Brief description"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Rooms / Departments</Label>
            <RoomSelector
              rooms={rooms}
              selectedRoomIds={roomIds}
              onChange={onRoomIdsChange}
              isLoading={isLoadingRooms}
            />
          </div>
          <div className="space-y-2">
            <Label>Report Period</Label>
            <PeriodSelector value={periodType} onChange={onPeriodTypeChange} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="active"
            checked={isActive}
            onCheckedChange={onIsActiveChange}
          />
          <Label htmlFor="active">Template is active</Label>
        </div>
      </CardContent>
    </Card>
  );
}
