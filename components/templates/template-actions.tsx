"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { deleteTemplate } from "@/lib/actions";
import { Eye, Edit, Trash2 } from "lucide-react";

interface TemplateActionsProps {
  templateId: string;
  templateName: string;
}

export function TemplateActions({ templateId, templateName }: TemplateActionsProps) {
  const handleDelete = async () => {
    await deleteTemplate(templateId);
  };

  return (
    <div className="flex justify-end gap-2">
      <Link href={`/templates/${templateId}`}>
        <Button variant="ghost" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
      <Link href={`/templates/${templateId}/edit`}>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </Link>
      <DeleteConfirmationDialog
        title="Delete Template"
        description={`Are you sure you want to delete "${templateName}"? This action cannot be undone. Any reports using this template will no longer be accessible.`}
        onConfirm={handleDelete}
        trigger={
          <Button variant="ghost" size="icon">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        }
      />
    </div>
  );
}
