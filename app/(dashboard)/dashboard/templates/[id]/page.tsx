import { getTemplateById } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit } from "lucide-react";
import { TemplatePreview } from "@/components/template-builder/template-preview";
import type { TemplateSchema } from "@/lib/template-types";

interface TemplateViewPageProps {
  params: Promise<{ id: string }>;
}

export default async function TemplateViewPage({ params }: TemplateViewPageProps) {
  const { id } = await params;
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const templateData = await getTemplateById(id);

  if (!templateData) {
    notFound();
  }

  const { report_template: template, room } = templateData;
  const schema = template.schema as TemplateSchema;

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <Link href="/templates">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{template.name}</h1>
            <p className="text-muted-foreground">
              {template.description || "No description provided"}
            </p>
          </div>
        </div>
        <Link href={`/templates/${id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Template
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Room</p>
                <p className="font-medium">{room?.name || "All Rooms"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant="outline">
                  {template.type === "simple_list" ? "Simple List" : "Matrix"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Period</p>
                <p className="font-medium capitalize">{template.periodType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={template.isActive ? "default" : "secondary"}>
                  {template.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {new Date(template.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {template.updatedAt
                    ? new Date(template.updatedAt).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
            <CardDescription>
              This is how the report form will look when filled by staff
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TemplatePreview schema={schema} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
