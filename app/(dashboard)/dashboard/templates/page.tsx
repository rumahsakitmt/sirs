import { getTemplates } from "@/lib/actions";
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
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { TemplateActions } from "@/components/templates/template-actions";

export default async function TemplatesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const templates = await getTemplates();

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Template Laporan</h1>
          <p className="text-muted-foreground">
            Kelola template laporan untuk berbagai departemen
          </p>
        </div>
        <Link href="/dashboard/templates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Buat Template
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semua Template</CardTitle>
          <CardDescription>
            {templates.length} template ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Ruangan</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>{template.room?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {template.type === "simple_list" ? "Daftar Sederhana" : "Matriks"}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{template.periodType === "daily" ? "Harian" : "Bulanan"}</TableCell>
                  <TableCell>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(template.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <TemplateActions 
                      templateId={template.id} 
                      templateName={template.name} 
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {templates.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Belum ada template yang dibuat.</p>
              <Link href="/dashboard/templates/new">
                <Button variant="outline" className="mt-4">
                  Buat template pertama
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
