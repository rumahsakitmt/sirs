import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { db } from "@/lib/db";
import { room, userRoom } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const Header = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return <div>no loggin</div>;
  }

  const userRooms = await db
    .select({
      roomName: room.name,
    })
    .from(userRoom)
    .innerJoin(room, eq(userRoom.roomId, room.id))
    .where(eq(userRoom.userId, session.user.id));

  const currentRoom = userRooms[0]?.roomName;

  return (
    <header className="p-4 sticky top-2">
      <div className="max-w-5xl mx-auto py-2 flex items-center justify-between font-mono bg-white/40 backdrop-blur-2xl border rounded-full px-8">
        <Link href="/">
          <p className="font-serif text-xl">SIRS </p>
        </Link>

        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {currentRoom || "No Room Assigned"}
        </p>

        <p>{session.user.name || "Guest"}</p>
      </div>
    </header>
  );
};
