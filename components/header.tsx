import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { getApi } from "@/lib/trpc/server";
import { UserDropdown } from "./user-dropdown";

export const Header = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return <div>belum masuk</div>;
  }

  const api = await getApi();
  const userRooms = await api.user.getUserRooms({ userId: session.user.id });
  const currentRoom = userRooms[0]?.room?.name;

  return (
    <header className="p-4 sticky top-2">
      <div className="container mx-auto py-2 flex items-center justify-between font-mono">
        <Link href="/">
          <p className="font-serif text-xl">SIRS </p>
        </Link>

        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {currentRoom || "Tidak Ada Ruangan"}
        </p>

        <UserDropdown
          name={session.user.name ?? "Tamu"}
          isAdmin={session.user.role === "admin"}
        />
      </div>
    </header>
  );
};
