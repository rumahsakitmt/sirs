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
    <header>
      <div className="max-w-3xl mx-auto p-4 flex items-center justify-between font-mono border-b-2 border-primary">
        <Link href="/" className="flex flex-col gap-0 border-b">
          <p className="font-serif text-2xl">SIRS </p>
          <span className="text-xs uppercase text-muted-foreground">
            RSUD Mamuju Tengah
          </span>
        </Link>

        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {currentRoom || "No Room Assigned"}
        </p>

        <p>{session.user.name || "Guest"}</p>
      </div>
    </header>
  );
};
