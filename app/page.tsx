import { Header } from "@/components/header";
import { DashboardReportForm } from "@/components/report-form/dashboard-report-form";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SIRS",
  description: "Sistem Informasi Rumah Sakit",
};

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="relative min-h-screen bg-blue-500 p-4">
      <div className="relative z-10">
        <Header />
        <DashboardReportForm />
      </div>

      <div
        className={cn(
          "absolute inset-0 z-0 opacity-20 pointer-events-none",
          "[background-size:40px_40px]",
          "[background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)]",
          "dark:[background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)]",
        )}
      />
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center bg-blue-500 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,blue)]"></div>
    </div>
  );
}
