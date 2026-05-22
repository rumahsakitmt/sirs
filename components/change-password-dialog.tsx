"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PasswordFieldProps {
  id: string;
  label: string;
  name: string;
  autoComplete: string;
  minLength?: number;
}

function PasswordField({
  id,
  label,
  name,
  autoComplete,
  minLength,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          className="pr-10"
          required
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1 -translate-y-1/2"
          onClick={() => setVisible((current) => !current)}
          aria-label={
            visible ? `Sembunyikan ${label}` : `Tampilkan ${label}`
          }
          aria-pressed={visible}
        >
          <Icon className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const [loading, setLoading] = useState(false);
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!currentPassword) {
      toast.error("Kata sandi saat ini diperlukan");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok");
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      });

      if (result.error) {
        toast.error(result.error.message || "Gagal mengubah kata sandi");
        return;
      }

      toast.success("Kata sandi berhasil diubah");
      form.reset();
      onOpenChange(false);
    } catch {
      toast.error("Terjadi kesalahan saat mengubah kata sandi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ubah Kata Sandi</DialogTitle>
          <DialogDescription>
            Masukkan kata sandi saat ini untuk membuat kata sandi baru.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <PasswordField
            id="currentPassword"
            name="currentPassword"
            label="Kata Sandi Saat Ini"
            autoComplete="current-password"
          />
          <PasswordField
            id="newPassword"
            name="newPassword"
            label="Kata Sandi Baru"
            autoComplete="new-password"
            minLength={6}
          />
          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            label="Konfirmasi Kata Sandi Baru"
            autoComplete="new-password"
            minLength={6}
          />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={revokeOtherSessions}
              onCheckedChange={(checked) =>
                setRevokeOtherSessions(checked === true)
              }
            />
            Keluar dari sesi lain
          </label>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
