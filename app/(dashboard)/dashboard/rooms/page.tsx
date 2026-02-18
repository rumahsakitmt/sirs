import { getRooms } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Plus, Edit, Trash2 } from "lucide-react";

export default async function RoomsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const rooms = await getRooms();

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Ruangan</h1>
          <p className="text-muted-foreground">
            Kelola ruangan dan departemen rumah sakit
          </p>
        </div>
        <Link href="/dashboard/rooms/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Ruangan
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semua Ruangan</CardTitle>
          <CardDescription>
            {rooms.length} ruangan ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {room.name}
                    </div>
                  </TableCell>
                  <TableCell>{room.description || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/rooms/${room.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {rooms.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Belum ada ruangan yang dibuat.</p>
              <p className="text-sm mt-2">
                Buat ruangan untuk mengorganisir laporan berdasarkan departemen.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
