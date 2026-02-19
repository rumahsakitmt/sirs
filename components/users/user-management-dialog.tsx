"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import {
  updateUserRole,
  assignUserToRoom,
  removeUserFromRoom,
  deleteUser,
} from "@/lib/actions";
import { UserCog, Loader2, Shield, User, Trash2 } from "lucide-react";

interface Room {
  id: string;
  name: string;
}

interface UserRoom {
  roomId: string;
  room: Room | null;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  rooms: UserRoom[];
}

interface UserManagementDialogProps {
  user: UserData;
  allRooms: Room[];
  currentUserId: string;
}

export function UserManagementDialog({
  user,
  allRooms,
  currentUserId,
}: UserManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(user.role);
  const [assignedRoomIds, setAssignedRoomIds] = useState<string[]>(
    () => user.rooms.map((r) => r.roomId)
  );
  const [isPending, startTransition] = useTransition();

  const isSelf = user.id === currentUserId;

  const handleRoomToggle = (roomId: string, checked: boolean) => {
    if (checked) {
      setAssignedRoomIds([...assignedRoomIds, roomId]);
    } else {
      setAssignedRoomIds(assignedRoomIds.filter((id) => id !== roomId));
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      // Update role if changed
      if (role !== user.role) {
        await updateUserRole(user.id, role as "admin" | "staff");
      }

      // Get current room IDs
      const currentRoomIds = user.rooms.map((r) => r.roomId);

      // Find rooms to add
      const roomsToAdd = assignedRoomIds.filter(
        (id) => !currentRoomIds.includes(id)
      );

      // Find rooms to remove
      const roomsToRemove = currentRoomIds.filter(
        (id) => !assignedRoomIds.includes(id)
      );

      // Add new assignments
      for (const roomId of roomsToAdd) {
        await assignUserToRoom(user.id, roomId);
      }

      // Remove old assignments
      for (const roomId of roomsToRemove) {
        await removeUserFromRoom(user.id, roomId);
      }

      setOpen(false);
    });
  };

  const handleDelete = async () => {
    await deleteUser(user.id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <UserCog className="h-4 w-4 mr-2" />
          Manage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage User</DialogTitle>
          <DialogDescription>
            Update role and room assignments for {user.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={setRole}
              disabled={isSelf}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Staff
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {isSelf && (
              <p className="text-xs text-muted-foreground">
                You cannot change your own role
              </p>
            )}
          </div>

          {/* Room Assignments */}
          <div className="space-y-2">
            <Label>Room Assignments</Label>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
              {allRooms.length > 0 ? (
                allRooms.map((room) => (
                  <div key={room.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`room-${room.id}`}
                      checked={assignedRoomIds.includes(room.id)}
                      onCheckedChange={(checked) =>
                        handleRoomToggle(room.id, checked === true)
                      }
                    />
                    <label
                      htmlFor={`room-${room.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {room.name}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No rooms available
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {assignedRoomIds.length} room{assignedRoomIds.length !== 1 ? "s" : ""} selected
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!isSelf && (
            <DeleteConfirmationDialog
              title="Delete User"
              description={`Are you sure you want to delete ${user.name}? This will also remove all their reports and cannot be undone.`}
              onConfirm={handleDelete}
              trigger={
                <Button variant="outline" className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </Button>
              }
            />
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
