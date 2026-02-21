"use client";

import { useState } from "react";
import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Plus, Edit, Trash2, X, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";

export default function RoomsPage() {
  const [form, setForm] = useQueryState("form", {
    defaultValue: "",
    clearOnDefault: true,
  });
  const showForm = form === "open";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const { data: rooms = [], refetch } = trpc.room.list.useQuery();

  const createRoomMutation = trpc.room.create.useMutation({
    onSuccess: () => {
      setName("");
      setDescription("");
      setError("");
      refetch();
    },
    onError: (err) => {
      setError(err.message || "Gagal membuat ruangan. Silakan coba lagi.");
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Nama ruangan wajib diisi");
      return;
    }

    createRoomMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Ruangan</h1>
          <p className="text-muted-foreground">{rooms.length} ruangan ditemukan</p>
        </div>
        <Button
          onClick={() => {
            setForm(showForm ? null : "open");
            setError("");
          }}
          variant={showForm ? "outline" : "default"}
        >
          {showForm ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Batal
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Ruangan
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tambah Ruangan Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">
                  Nama Ruangan <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="contoh: Rawat Inap, Radiologi"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi singkat ruangan/departemen ini"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setForm(null);
                    setError("");
                  }}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={createRoomMutation.isPending}>
                  {createRoomMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Membuat...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Buat Ruangan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div>
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
      </div>
    </div>
  );
}
