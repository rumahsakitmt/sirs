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
    <header className=" z-50 mx-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between py-3 rounded-2xl font-mono text-primary-foreground">
          <div className="relative group">
            <Link href="/" className="font-serif text-2xl font-bold">
              RSMT
            </Link>
            <span className="absolute -right-4 bottom-0 -rotate-6 group-hover:rotate-0 group-hover:-bottom-4 transition-all block bg-black text-white rounded-lg px-2">
              sirs
            </span>
          </div>

          <p className="text-sm font-medium text-primary-foreground/80 uppercase tracking-wide">
            [{currentRoom || "Tidak Ada Ruangan"}]
          </p>

          <UserDropdown
            name={session.user.name ?? "Tamu"}
            isAdmin={session.user.role === "admin"}
          />
        </div>
      </div>
    </header>
  );
};
