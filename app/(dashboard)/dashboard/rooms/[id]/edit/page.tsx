"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateRoom, deleteRoom } from "@/lib/actions";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import Link from "next/link";
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

interface Room {
  id: string;
  name: string;
  description: string | null;
}

export default function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setFormLoading(true);
    setError("");
    
    try {
      const { id } = await params;
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      
      await updateRoom(id, name.trim(), description.trim() || undefined);
      router.push("/dashboard/rooms");
      router.refresh();
    } catch (err) {
      setError("Gagal memperbarui ruangan. Silakan coba lagi.");
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const { id } = await params;
      await deleteRoom(id);
      router.push("/dashboard/rooms");
      router.refresh();
    } catch (err) {
      setError("Gagal menghapus ruangan. Silakan coba lagi.");
      setDeleteLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard/rooms">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Ruangan</h1>
          <p className="text-muted-foreground">
            Perbarui detail ruangan
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detail Ruangan</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
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
                name="name"
                placeholder="contoh: Rawat Inap, Radiologi"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Deskripsi singkat ruangan/departemen ini"
                rows={3}
              />
            </div>

            <div className="flex justify-between items-center">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus Ruangan
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini akan menghapus ruangan ini beserta semua template dan laporan terkait secara permanen.
                      Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleteLoading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex gap-3">
                <Link href="/dashboard/rooms">
                  <Button type="button" variant="outline">
                    Batal
                  </Button>
                </Link>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
