"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Users } from "lucide-react";
import { UserManagementDialog } from "./user-management-dialog";

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
  createdAt: Date;
  rooms: UserRoom[];
}

interface UsersTableProps {
  users: UserData[];
  rooms: Room[];
  currentUserId: string;
}

export function UsersTable({ users, rooms, currentUserId }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Tidak ada pengguna ditemukan</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Peran</TableHead>
          <TableHead>Ruangan Ditugaskan</TableHead>
          <TableHead>Bergabung</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {user.name}
                {user.id === currentUserId && (
                  <Badge variant="outline" className="text-xs">Anda</Badge>
                )}
              </div>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge
                variant={user.role === "admin" ? "default" : "secondary"}
                className="flex items-center gap-1 w-fit"
              >
                {user.role === "admin" ? (
                  <Shield className="h-3 w-3" />
                ) : (
                  <User className="h-3 w-3" />
                )}
                {user.role}
              </Badge>
            </TableCell>
            <TableCell>
              {user.rooms.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {user.rooms.slice(0, 2).map((ur) => (
                    <Badge key={ur.roomId} variant="outline" className="text-xs">
                      {ur.room?.name}
                    </Badge>
                  ))}
                  {user.rooms.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{user.rooms.length - 2}
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">Tidak ada ruangan</span>
              )}
            </TableCell>
            <TableCell>
              {new Date(user.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <UserManagementDialog
                user={user}
                allRooms={rooms}
                currentUserId={currentUserId}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
