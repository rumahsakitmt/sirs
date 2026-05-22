"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { push, refresh } = useRouter();
  const PasswordIcon = passwordVisible ? EyeOff : Eye;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email: credentials.email,
        password: credentials.password,
        callbackURL: "/",
      });

      if (result.error) {
        setError(result.error.message || "Gagal masuk");
      } else {
        push("/");
        refresh();
      }
    } catch {
      setError("Terjadi kesalahan saat masuk");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Masuk SIRS
        </CardTitle>
        <CardDescription className="text-center">
          Sistem Informasi Rumah Sakit
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@rumahsakit.com"
              value={credentials.email}
              onChange={(e) =>
                setCredentials((current) => ({
                  ...current,
                  email: e.target.value,
                }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Kata Sandi</Label>
            <div className="relative">
              <Input
                id="password"
                type={passwordVisible ? "text" : "password"}
                value={credentials.password}
                onChange={(e) =>
                  setCredentials((current) => ({
                    ...current,
                    password: e.target.value,
                  }))
                }
                autoComplete="current-password"
                className="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-1 -translate-y-1/2"
                onClick={() => setPasswordVisible((current) => !current)}
                aria-label={
                  passwordVisible
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
                aria-pressed={passwordVisible}
              >
                <PasswordIcon className="size-4" />
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Sedang masuk&hellip;
              </>
            ) : (
              "Masuk"
            )}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Belum punya akun?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Daftar
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
