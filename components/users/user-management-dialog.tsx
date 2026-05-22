"use client";

import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  resetUserPasswordToDefault,
} from "@/lib/actions";
import { DEFAULT_USER_PASSWORD } from "@/lib/user-password";
import { UserCog, Loader2, Shield, User, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";

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
  const [isResettingPassword, startResetPasswordTransition] = useTransition();

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

  const handleResetPassword = () => {
    startResetPasswordTransition(async () => {
      try {
        await resetUserPasswordToDefault(user.id);
        toast.success(
          `Password ${user.name} direset ke ${DEFAULT_USER_PASSWORD}`
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Gagal reset password pengguna"
        );
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <UserCog className="mr-2 size-4" />
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
                    <User className="size-4" />
                    Staff
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="size-4" />
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

        <DialogFooter className="items-stretch gap-2 sm:flex-col sm:items-stretch">
          {!isSelf && (
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-center">
                    <KeyRound className="mr-2 size-4" />
                    Reset Password
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Password</AlertDialogTitle>
                    <AlertDialogDescription>
                      Reset password {user.name} ke password default:{" "}
                      <span className="font-mono font-medium">
                        {DEFAULT_USER_PASSWORD}
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isResettingPassword}>
                      Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleResetPassword}
                      disabled={isResettingPassword}
                    >
                      {isResettingPassword ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Resetting&hellip;
                        </>
                      ) : (
                        "Reset Password"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <DeleteConfirmationDialog
                title="Delete User"
                description={`Are you sure you want to delete ${user.name}? This will also remove all their reports and cannot be undone.`}
                onConfirm={handleDelete}
                trigger={
                  <Button
                    variant="outline"
                    className="w-full justify-center text-destructive"
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete User
                  </Button>
                }
              />
            </div>
          )}
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button className="w-full" onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving&hellip;
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
