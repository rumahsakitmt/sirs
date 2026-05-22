"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { KeyRound, LogOut } from "lucide-react";

interface UserDropdownProps {
  name: string;
  isAdmin: boolean;
}

export const UserDropdown = ({ name, isAdmin }: UserDropdownProps) => {
  const { push } = useRouter();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const handleLogout = async () => {
    await authClient.signOut();
    push("/login");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-gray-950 hover:bg-gray-950">{name}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Dasbor</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => setChangePasswordOpen(true)}>
              <KeyRound className="mr-2 size-4" />
              Ubah Kata Sandi
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 size-4" />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </>
  );
};
