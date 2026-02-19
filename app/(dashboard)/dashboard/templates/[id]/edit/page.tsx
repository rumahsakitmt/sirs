"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getTemplateById, updateTemplate, deleteTemplate, createTemplateForEdit } from "@/lib/actions";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc/client";
import { TemplateSettingsForm } from "./components/template-settings-form";
import type { 
  TemplateSchema,
  SimpleListTemplateSchema,
  MatrixTemplateSchema,
  PeriodType
} from "@/lib/template-types";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const SimpleListBuilder = dynamic(
  () => import("@/components/template-builder/simple-list-builder").then(mod => ({ default: mod.SimpleListBuilder })),
  {
    loading: () => <BuilderSkeleton />,
    ssr: false,
  }
);

const MatrixBuilder = dynamic(
  () => import("@/components/template-builder/matrix-builder").then(mod => ({ default: mod.MatrixBuilder })),
  {
    loading: () => <BuilderSkeleton />,
    ssr: false,
  }
);

const TemplatePreview = dynamic(
  () => import("@/components/template-builder/template-preview").then(mod => ({ default: mod.TemplatePreview })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
  }
);

function BuilderSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

interface EditTemplatePageProps {
  params: Promise<{ id: string }>;
}

export default function EditTemplatePage({ params }: EditTemplatePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [roomIds, setRoomIds] = useState<string[]>([]);
  const [originalRoomIds, setOriginalRoomIds] = useState<string[]>([]);
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const [isActive, setIsActive] = useState(true);
  const [schema, setSchema] = useState<TemplateSchema | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [session, setSession] = useState<any>(null);

  const { data: rooms, isLoading: isLoadingRooms } = trpc.room.list.useQuery();
  const { data: allTemplates } = trpc.template.list.useQuery();

  useEffect(() => {
    loadData();
    loadSession();
  }, [id]);

  async function loadData() {
    try {
      const templateData = await getTemplateById(id);
      if (templateData) {
        const { report_template } = templateData;
        setTemplate(report_template);
        setTemplateName(report_template.name);
        setDescription(report_template.description || "");
        setPeriodType((report_template.periodType as PeriodType) || "monthly");
        setIsActive(report_template.isActive ?? true);
        setSchema(report_template.schema as TemplateSchema);
        
        if (allTemplates) {
          const siblings = allTemplates.filter(
            (t) =>
              t.name === report_template.name &&
              t.type === report_template.type &&
              t.id !== report_template.id &&
              t.room?.id
          );
          const siblingRoomIds = siblings.map((t) => t.room!.id);
          const allRoomIds = report_template.roomId 
            ? [report_template.roomId, ...siblingRoomIds]
            : siblingRoomIds;
          setRoomIds(allRoomIds);
          setOriginalRoomIds(allRoomIds);
        } else if (report_template.roomId) {
          setRoomIds([report_template.roomId]);
          setOriginalRoomIds([report_template.roomId]);
        }
      }
    } catch (error) {
      console.error("Failed to load template:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSession() {
    const { data } = await authClient.getSession();
    setSession(data);
  }

  const handleSave = async (newSchema: TemplateSchema) => {
    if (!session?.user?.id || !template) return;

    setSaving(true);
    try {
      const roomsToAdd = roomIds.filter((rid) => !originalRoomIds.includes(rid));
      const roomsToRemove = originalRoomIds.filter((rid) => !roomIds.includes(rid));

      await updateTemplate(id, {
        name: templateName,
        description: description || undefined,
        periodType,
        schema: newSchema,
        isActive,
      });

      for (const roomId of roomsToAdd) {
        await createTemplateForEdit(
          templateName,
          roomId,
          template.type,
          periodType,
          newSchema,
          session.user.id,
          description || undefined
        );
      }

      if (allTemplates) {
        for (const roomId of roomsToRemove) {
          const siblingTemplate = allTemplates.find(
            (t) =>
              t.name === template.name &&
              t.type === template.type &&
              t.room?.id === roomId
          );
          if (siblingTemplate) {
            await deleteTemplate(siblingTemplate.id);
          }
        }
      }

      router.push(`/dashboard/templates/${id}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to update template:", error);
      alert("Failed to update template. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/templates/${id}`);
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!template || !schema) {
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Template not found</h2>
          <p className="text-muted-foreground mb-4">
            The template you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/dashboard/templates">
            <Button>Back to Templates</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/dashboard/templates/${id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Edit Template</h1>
          <p className="text-muted-foreground">
            Modify the template structure and settings
          </p>
        </div>
      </div>

      <TemplateSettingsForm
        templateName={templateName}
        onTemplateNameChange={setTemplateName}
        description={description}
        onDescriptionChange={setDescription}
        roomIds={roomIds}
        onRoomIdsChange={setRoomIds}
        periodType={periodType}
        onPeriodTypeChange={setPeriodType}
        isActive={isActive}
        onIsActiveChange={setIsActive}
        rooms={rooms}
        isLoadingRooms={isLoadingRooms}
      />

      {schema.type === "simple_list" && (
        <SimpleListBuilder
          initialSchema={schema as SimpleListTemplateSchema}
          onSave={handleSave}
          onBack={handleBack}
          onPreview={handlePreview}
        />
      )}

      {schema.type === "matrix" && (
        <MatrixBuilder
          initialSchema={schema as MatrixTemplateSchema}
          onSave={handleSave}
          onBack={handleBack}
          onPreview={handlePreview}
        />
      )}

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          <TemplatePreview schema={schema} />
        </DialogContent>
      </Dialog>

      {saving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Saving template...</span>
          </div>
        </div>
      )}
    </div>
  );
}
