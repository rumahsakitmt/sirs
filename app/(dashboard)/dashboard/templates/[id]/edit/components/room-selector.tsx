"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Room {
  id: string;
  name: string;
}

interface RoomSelectorProps {
  rooms: Room[] | undefined;
  selectedRoomIds: string[];
  onChange: (roomIds: string[]) => void;
  isLoading: boolean;
}

export function RoomSelector({
  rooms,
  selectedRoomIds,
  onChange,
  isLoading,
}: RoomSelectorProps) {
  const toggleRoom = (roomId: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedRoomIds, roomId]);
    } else {
      onChange(selectedRoomIds.filter((id) => id !== roomId));
    }
  };

  const removeRoom = (roomId: string) => {
    onChange(selectedRoomIds.filter((id) => id !== roomId));
  };

  if (isLoading) {
    return (
      <div className="border rounded-md p-3">
        <p className="text-sm text-muted-foreground">Loading rooms...</p>
      </div>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="border rounded-md p-3">
        <p className="text-sm text-muted-foreground">No rooms available</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md p-3 space-y-2">
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {rooms.map((room) => (
          <div key={room.id} className="flex items-center space-x-2">
            <Checkbox
              id={`room-${room.id}`}
              checked={selectedRoomIds.includes(room.id)}
              onCheckedChange={(checked) => toggleRoom(room.id, checked as boolean)}
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

      {selectedRoomIds.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">
            Selected ({selectedRoomIds.length}):
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedRoomIds.map((id) => {
              const room = rooms.find((r) => r.id === id);
              return room ? (
                <Badge key={id} variant="secondary" className="text-xs">
                  {room.name}
                  <button
                    type="button"
                    onClick={() => removeRoom(id)}
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
  );
}
