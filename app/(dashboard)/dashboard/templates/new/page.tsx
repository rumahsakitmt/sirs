"use client";

import { useState, useEffect } from "react";
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
import { createTemplate, getRooms } from "@/lib/actions";
import { authClient } from "@/lib/auth-client";
import type { 
  TemplateType, 
  PeriodType, 
  TemplateSchema 
} from "@/lib/template-types";
import { Loader2 } from "lucide-react";

// Dynamic imports for heavy components to reduce initial bundle size
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

export default function NewTemplatePage() {
  const router = useRouter();
  const [step, setStep] = useState<"type" | "builder" | "preview">("type");
  const [templateName, setTemplateName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const [templateType, setTemplateType] = useState<TemplateType | null>(null);
  const [schema, setSchema] = useState<TemplateSchema | null>(null);
  const [rooms, setRooms] = useState<Array<{ id: string; name: string }>>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<{ user?: { id: string } } | null>(null);

  useEffect(() => {
    loadRooms();
    loadSession();
  }, []);

  async function loadRooms() {
    const data = await getRooms();
    setRooms(data);
  }

  async function loadSession() {
    const { data } = await authClient.getSession();
    setSession(data);
  }

  const handleNext = () => {
    if (templateName && roomId && templateType) {
      setStep("builder");
    }
  };

  const handleBack = () => {
    setStep("type");
  };

  const handleSave = async (newSchema: TemplateSchema) => {
    if (!session?.user?.id) return;
    
    setSaving(true);
    try {
      const templateId = await createTemplate(
        templateName,
        roomId,
        templateType!,
        periodType,
        newSchema,
        session.user.id
      );
      router.push("/templates");
      router.refresh();
    } catch (error) {
      console.error("Failed to create template:", error);
      alert("Failed to create template. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = (previewSchema: TemplateSchema) => {
    setSchema(previewSchema);
    setShowPreview(true);
  };

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
          roomId={roomId}
          setRoomId={setRoomId}
          periodType={periodType}
          setPeriodType={setPeriodType}
          templateType={templateType}
          setTemplateType={setTemplateType}
          rooms={rooms}
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          {schema ? (
            <TemplatePreview schema={schema} />
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No schema available for preview
            </p>
          )}
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
