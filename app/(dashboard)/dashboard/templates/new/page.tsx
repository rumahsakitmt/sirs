"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { TemplateTypeSelector } from "@/components/template-builder/template-type-selector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import type {
  TemplateType,
  PeriodType,
  TemplateSchema,
} from "@/lib/template-types";
import { Loader2 } from "lucide-react";

const SimpleListBuilder = dynamic(
  () =>
    import("@/components/template-builder/simple-list-builder").then((mod) => ({
      default: mod.SimpleListBuilder,
    })),
  {
    loading: () => <BuilderSkeleton />,
    ssr: false,
  },
);

const MatrixBuilder = dynamic(
  () =>
    import("@/components/template-builder/matrix-builder").then((mod) => ({
      default: mod.MatrixBuilder,
    })),
  {
    loading: () => <BuilderSkeleton />,
    ssr: false,
  },
);

const TemplatePreview = dynamic(
  () =>
    import("@/components/template-builder/template-preview").then((mod) => ({
      default: mod.TemplatePreview,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
  },
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

export default function NewTemplatePage() {
  const router = useRouter();
  const [step, setStep] = useState<"type" | "builder" | "preview">("type");
  const [templateName, setTemplateName] = useState("");
  const [roomIds, setRoomIds] = useState<string[]>([]);
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const [templateType, setTemplateType] = useState<TemplateType | null>(null);
  const [schema, setSchema] = useState<TemplateSchema | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: rooms, isLoading: isLoadingRooms } = trpc.room.list.useQuery();
  const createTemplateMutation = trpc.template.create.useMutation({
    onSuccess: (data) => {
      const count = data.length;
      router.push("/dashboard/templates");
      router.refresh();
    },
    onError: (error) => {
      console.error("Failed to create template:", error);
      alert("Failed to create template. Please try again.");
    },
  });

  const handleNext = () => {
    if (templateName && roomIds.length > 0 && templateType) {
      setStep("builder");
    }
  };

  const handleBack = () => {
    setStep("type");
  };

  const handleSave = async (newSchema: TemplateSchema) => {
    if (!templateType) return;

    createTemplateMutation.mutate({
      name: templateName,
      roomIds,
      type: templateType,
      periodType,
      schema: newSchema,
    });
  };

  const handlePreview = (previewSchema: TemplateSchema) => {
    setSchema(previewSchema);
    setShowPreview(true);
  };

  const isSaving = createTemplateMutation.isPending;

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Template</h1>
        <p className="text-muted-foreground">
          Design a new report template for your department
        </p>
      </div>

      {step === "type" && (
        <TemplateTypeSelector
          templateName={templateName}
          setTemplateName={setTemplateName}
          roomIds={roomIds}
          setRoomIds={setRoomIds}
          periodType={periodType}
          setPeriodType={setPeriodType}
          templateType={templateType}
          setTemplateType={setTemplateType}
          rooms={rooms ?? []}
          isLoadingRooms={isLoadingRooms}
          onNext={handleNext}
        />
      )}

      {step === "builder" && templateType === "simple_list" && (
        <SimpleListBuilder
          onSave={handleSave}
          onBack={handleBack}
          onPreview={handlePreview}
        />
      )}

      {step === "builder" && templateType === "matrix" && (
        <MatrixBuilder
          onSave={handleSave}
          onBack={handleBack}
          onPreview={handlePreview}
        />
      )}

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[98vw] sm:max-w-[95vw] md:max-w-[90vw] w-full max-h-[95vh] overflow-auto p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          {schema ? (
            <div className="p-6">
              <TemplatePreview schema={schema} />
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No schema available for preview
            </p>
          )}
        </DialogContent>
      </Dialog>

      {isSaving && (
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
