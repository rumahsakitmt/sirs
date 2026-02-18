"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Fragment } from "react";

const pathNameMap: Record<string, string> = {
  dashboard: "Dasbor",
  reports: "Laporan",
  viewer: "Lihat Laporan",
  rooms: "Ruangan",
  templates: "Template",
  users: "Pengguna",
  settings: "Pengaturan",
  new: "Baru",
  edit: "Edit",
};

function formatSegment(segment: string): string {
  return pathNameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Skip the 'dashboard' segment since we're already in the dashboard
  const breadcrumbSegments = segments.slice(1);

  if (breadcrumbSegments.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dasbor</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Dasbor</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbSegments.length > 0 && (
          <BreadcrumbSeparator className="hidden md:block" />
        )}
        {breadcrumbSegments.map((segment, index) => {
          const isLast = index === breadcrumbSegments.length - 1;
          const href = "/dashboard/" + breadcrumbSegments.slice(0, index + 1).join("/");
          const label = formatSegment(segment);

          return (
            <Fragment key={segment + index}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
