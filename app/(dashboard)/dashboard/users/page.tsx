import { getUsers, getRooms, getUserRooms } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users } from "lucide-react";
import { UsersTable } from "@/components/users/users-table";

export default async function UsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if ((session.user as any).role !== "admin") {
    redirect("/");
  }

  const [users, rooms] = await Promise.all([
    getUsers(),
    getRooms(),
  ]);

  // Get rooms for each user
  const usersWithRooms = await Promise.all(
    users.map(async (user) => {
      const userRooms = await getUserRooms(user.id);
      return {
        ...user,
        rooms: userRooms,
      };
    })
  );

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
        <p className="text-muted-foreground">
          Kelola pengguna sistem dan penugasan ruangan mereka
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Semua Pengguna
          </CardTitle>
          <CardDescription>
            {users.length} pengguna terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable
            users={usersWithRooms}
            rooms={rooms}
            currentUserId={session.user.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
