"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { deleteReport } from "@/lib/actions";
import { Eye, Edit, Printer, Trash2 } from "lucide-react";

interface ReportActionsProps {
  reportId: string;
  status: string;
  periodLabel: string;
  roomName: string;
  templateName: string;
  canDelete: boolean;
}

export function ReportActions({
  reportId,
  status,
  periodLabel,
  roomName,
  templateName,
  canDelete,
}: ReportActionsProps) {
  const handleDelete = async () => {
    await deleteReport(reportId);
  };

  return (
    <div className="flex justify-end gap-2">
      <Link href={`/dashboard/reports/${reportId}`}>
        <Button variant="ghost" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
      {status === "draft" && (
        <Link href={`/dashboard/reports/${reportId}/edit`}>
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
      )}
      <Link href={`/dashboard/reports/${reportId}/print`}>
        <Button variant="ghost" size="icon">
          <Printer className="h-4 w-4" />
        </Button>
      </Link>
      {canDelete && (
        <DeleteConfirmationDialog
          title="Hapus Laporan"
          description={`Apakah Anda yakin ingin menghapus laporan ${templateName} (${roomName}, periode ${periodLabel})? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={handleDelete}
          trigger={
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          }
        />
      )}
    </div>
  );
}
