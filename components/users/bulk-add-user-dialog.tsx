"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Loader2, Download, AlertCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function BulkAddUserDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [parsedUsers, setParsedUsers] = useState<any[] | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0, failed: 0 });
    const router = useRouter();

    const handleDownloadTemplate = () => {
        const headers = ["name", "email", "password", "role"];
        const rows = [
            ["John Doe", "john@example.com", "password123", "staff"],
            ["Admin User", "admin@example.com", "password123", "admin"],
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map(e => e.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "template_users.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const parseCSV = (text: string) => {
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length < 2) return [];

        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        const nameIdx = headers.indexOf("name");
        const emailIdx = headers.indexOf("email");
        const passwordIdx = headers.indexOf("password");
        const roleIdx = headers.indexOf("role");

        if (nameIdx === -1 || emailIdx === -1 || passwordIdx === -1 || roleIdx === -1) {
            throw new Error("Format CSV tidak valid. Pastikan ada kolom name, email, password, role");
        }

        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const row: string[] = [];
            let current = "";
            let inQuotes = false;

            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    row.push(current);
                    current = "";
                } else {
                    current += char;
                }
            }
            row.push(current);

            const cleanRow = row.map(val => val.trim());

            if (cleanRow.length >= 4) {
                data.push({
                    name: cleanRow[nameIdx],
                    email: cleanRow[emailIdx],
                    password: cleanRow[passwordIdx],
                    role: cleanRow[roleIdx] || "staff",
                });
            }
        }
        return data;
    };

    async function handlePreview(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!file) {
            toast.error("Pilih file CSV terlebih dahulu");
            return;
        }

        try {
            const text = await file.text();
            let usersToCreate;
            try {
                usersToCreate = parseCSV(text);
            } catch (err: any) {
                toast.error(err.message || "Gagal membaca format CSV");
                return;
            }

            if (usersToCreate.length === 0) {
                toast.error("Tidak ada data pengguna dalam file");
                return;
            }

            setParsedUsers(usersToCreate);
        } catch (error) {
            toast.error("Terjadi kesalahan saat membaca file");
        }
    }

    async function handleUpload() {
        if (!parsedUsers || parsedUsers.length === 0) return;

        setLoading(true);
        try {
            setProgress({ current: 0, total: parsedUsers.length, failed: 0 });

            let failedCount = 0;
            let successCount = 0;

            for (let i = 0; i < parsedUsers.length; i++) {
                const user = parsedUsers[i];
                const { error } = await authClient.admin.createUser({
                    email: user.email,
                    password: user.password,
                    name: user.name,
                    role: user.role as any,
                });

                if (error) {
                    console.error("Failed to create user", user.email, error);
                    failedCount++;
                } else {
                    successCount++;
                }

                setProgress({ current: i + 1, total: parsedUsers.length, failed: failedCount });
            }

            if (failedCount > 0) {
                toast.warning(`${successCount} berhasil, ${failedCount} gagal ditambahkan`);
            } else {
                toast.success(`${successCount} Pengguna berhasil ditambahkan`);
            }

            if (successCount > 0) {
                router.refresh();
            }

            setTimeout(() => {
                setOpen(false);
                setFile(null);
                setParsedUsers(null);
                setProgress({ current: 0, total: 0, failed: 0 });
                setLoading(false);
            }, 2000);

        } catch (error) {
            toast.error("Terjadi kesalahan saat memproses file");
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!loading) {
                setOpen(val);
                if (!val) {
                    setFile(null);
                    setParsedUsers(null);
                    setProgress({ current: 0, total: 0, failed: 0 });
                }
            }
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Mulai Bulk Upload</DialogTitle>
                    <DialogDescription>
                        Tambahkan banyak pengguna sekaligus dengan file CSV.
                    </DialogDescription>
                </DialogHeader>

                {!loading && progress.total === 0 ? (
                    !parsedUsers ? (
                        <form onSubmit={handlePreview} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Template CSV</Label>
                                <div>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="gap-2"
                                        onClick={handleDownloadTemplate}
                                    >
                                        <Download className="h-4 w-4" />
                                        Download Template
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2 pt-2">
                                <Label htmlFor="file">File CSV</Label>
                                <Input
                                    id="file"
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    required
                                />
                            </div>
                            <DialogFooter className="pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" disabled={!file}>
                                    Pratinjau Data
                                </Button>
                            </DialogFooter>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-md border">
                                <ScrollArea className="h-[300px]">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                            <TableRow>
                                                <TableHead>Nama</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Peran</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {parsedUsers.map((user, idx) => (
                                                <TableRow key={`preview-${idx}`}>
                                                    <TableCell className="font-medium">{user.name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell className="capitalize">{user.role}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </div>
                            <div className="flex items-center gap-2 p-3 text-sm bg-orange-50 text-orange-900 border border-orange-200 rounded-md">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <p>Pastikan data sudah benar sebelum mengunggah. Password tidak ditampilkan untuk alasan keamanan.</p>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setParsedUsers(null);
                                        setFile(null);
                                    }}
                                >
                                    Batal
                                </Button>
                                <Button onClick={handleUpload}>
                                    Upload {parsedUsers.length} Data
                                </Button>
                            </DialogFooter>
                        </div>
                    )
                ) : (
                    <div className="py-6 space-y-4 flex flex-col items-center justify-center text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">
                                Memproses {progress.current} dari {progress.total}
                            </h4>
                            {progress.failed > 0 && (
                                <p className="text-sm text-destructive">
                                    {progress.failed} gagal diproses
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
