import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getRooms, getTemplates, getUserRooms } from "@/lib/actions";
import { NewReportForm } from "@/components/report-form/new-report-form";
import type { TemplateSchema } from "@/lib/template-types";

export default async function NewReportPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "admin";

  // Parallel data fetching - critical for performance
  const [allRooms, allTemplates, userRoomsData] = await Promise.all([
    isAdmin ? getRooms() : Promise.resolve([]),
    getTemplates(),
    isAdmin ? Promise.resolve([]) : getUserRooms(session.user.id),
  ]);

  // Prepare rooms data based on role
  const rooms = isAdmin
    ? allRooms.map((r) => ({ id: r.id, name: r.name }))
    : userRoomsData
        .map((ur) => ur.room)
        .filter((r): r is { id: string; name: string } => r !== null);

  // Prepare templates data (only serialize what's needed)
  const templates = allTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    roomId: t.room?.id || null,
    schema: t.schema as TemplateSchema,
    periodType: t.periodType,
  }));

  return (
    <NewReportForm
      rooms={rooms}
      templates={templates}
      userId={session.user.id}
    />
  );
}
