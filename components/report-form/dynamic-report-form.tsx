"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  getAllFieldIds,
  getLeafColumns,
  getColumnDepth,
  type TemplateSchema,
  type SimpleListTemplateSchema,
  type MatrixTemplateSchema,
  type ColumnDefinition,
} from "@/lib/template-types";
import { cn } from "@/lib/utils";
import { Save, Send, Loader2, Eye, Edit2, X, CheckCircle } from "lucide-react";

// ============================================
// Simple List Form
// ============================================

interface SimpleListFormProps {
  schema: SimpleListTemplateSchema;
  data: Record<string, Record<string, string>>;
  onChange: (data: Record<string, Record<string, string>>) => void;
  readOnly?: boolean;
}

function SimpleListForm({ schema, data, onChange, readOnly = false }: SimpleListFormProps) {
  const handleValueChange = (rowId: string, columnId: string, value: string) => {
    onChange({
      ...data,
      [rowId]: {
        ...(data[rowId] || {}),
        [columnId]: value,
      },
    });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center border">NO</TableHead>
            <TableHead className="border">JENIS KEGIATAN</TableHead>
            {schema.valueColumns.map((col) => (
              <TableHead key={col.id} className="text-center border">
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {schema.rows.map((row, index) => (
            <TableRow key={row.id}>
              <TableCell className="text-center border">{index + 1}</TableCell>
              <TableCell className="border">{row.label}</TableCell>
              {schema.valueColumns.map((col) => (
                <TableCell key={col.id} className="text-center border p-1">
                  {readOnly ? (
                    <span className="text-sm font-medium">
                      {data[row.id]?.[col.id] || "-"}
                    </span>
                  ) : (
                    <Input
                      type={col.fieldType === "number" ? "number" : "text"}
                      value={data[row.id]?.[col.id] || ""}
                      onChange={(e) => handleValueChange(row.id, col.id, e.target.value)}
                      className="w-24 mx-auto text-center"
                      min="0"
                      readOnly={readOnly}
                      disabled={readOnly}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================
// Matrix Form
// ============================================

interface MatrixFormProps {
  schema: MatrixTemplateSchema;
  data: Record<string, Record<string, string>>;
  onChange: (data: Record<string, Record<string, string>>) => void;
  readOnly?: boolean;
}

function buildHeaderRows(columns: ColumnDefinition[]): Array<Array<{ label: string; colSpan: number; rowSpan: number; isGroup: boolean }>> {
  const depth = getColumnDepth(columns);
  const rows: Array<Array<{ label: string; colSpan: number; rowSpan: number; isGroup: boolean }>> = 
    Array(depth).fill(null).map(() => []);

  function processColumns(cols: ColumnDefinition[], currentDepth: number) {
    for (const col of cols) {
      if (col.type === "field") {
        const rowSpan = depth - currentDepth;
        rows[currentDepth].push({
          label: col.label,
          colSpan: 1,
          rowSpan,
          isGroup: false,
        });
      } else {
        const leafCount = getLeafColumns(col.children).length;
        rows[currentDepth].push({
          label: col.label,
          colSpan: leafCount,
          rowSpan: 1,
          isGroup: true,
        });
        processColumns(col.children, currentDepth + 1);
      }
    }
  }

  processColumns(columns, 0);
  return rows;
}

function MatrixForm({ schema, data, onChange, readOnly = false }: MatrixFormProps) {
  const headerRows = buildHeaderRows(schema.columns);
  const leafColumns = getLeafColumns(schema.columns);
  const hasGroups = schema.columns.some(col => col.type === "group");

  const handleValueChange = (rowId: string, columnId: string, value: string) => {
    onChange({
      ...data,
      [rowId]: {
        ...(data[rowId] || {}),
        [columnId]: value,
      },
    });
  };

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          {hasGroups ? (
            <>
              {headerRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {rowIndex === 0 && (
                    <TableHead 
                      rowSpan={headerRows.length} 
                      className="w-12 text-center border align-middle"
                    >
                      NO
                    </TableHead>
                  )}
                  {rowIndex === 0 && (
                    <TableHead 
                      rowSpan={headerRows.length} 
                      className="border align-middle min-w-[200px]"
                    >
                      JENIS PELAYANAN
                    </TableHead>
                  )}
                  {row.map((cell, cellIndex) => (
                    <TableHead
                      key={cellIndex}
                      colSpan={cell.colSpan}
                      rowSpan={cell.rowSpan}
                      className={cn(
                        "text-center border align-middle",
                        cell.isGroup && "bg-muted/50 font-semibold"
                      )}
                    >
                      {cell.label}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </>
          ) : (
            <TableRow>
              <TableHead className="w-12 text-center border">NO</TableHead>
              <TableHead className="border min-w-[200px]">JENIS PELAYANAN</TableHead>
              {leafColumns.map((col) => (
                <TableHead key={col.id} className="text-center border">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
          {schema.rows.map((row, index) => (
            <TableRow key={row.id}>
              <TableCell className="text-center border">{index + 1}</TableCell>
              <TableCell className="border">{row.label}</TableCell>
              {leafColumns.map((col) => (
                <TableCell key={col.id} className="text-center border p-1">
                  {readOnly ? (
                    <span className="text-sm font-medium">
                      {data[row.id]?.[col.id] || "-"}
                    </span>
                  ) : (
                    <Input
                      type="number"
                      value={data[row.id]?.[col.id] || ""}
                      onChange={(e) => handleValueChange(row.id, col.id, e.target.value)}
                      className="w-16 mx-auto text-center"
                      min="0"
                      readOnly={readOnly}
                      disabled={readOnly}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================
// Main Dynamic Report Form Component
// ============================================

interface DynamicReportFormProps {
  schema: TemplateSchema;
  roomId: string;
  templateId: string;
  periodYear: number;
  periodMonth: number;
  periodDay?: number;
  initialData?: Record<string, any>;
  onSave: (data: Record<string, any>, status: "draft" | "submitted") => Promise<void>;
  saving?: boolean;
  status?: string;
}

export function DynamicReportForm({
  schema,
  roomId,
  templateId,
  periodYear,
  periodMonth,
  periodDay,
  initialData,
  onSave,
  saving = false,
  status = "draft",
}: DynamicReportFormProps) {
  const [data, setData] = useState<Record<string, Record<string, string>>>(
    initialData || {}
  );
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const isSubmitted = status === "submitted";
  const isReadOnly = isSubmitted && !isEditing;

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (Object.keys(data).length > 0) {
        try {
          await onSave(data, "draft");
          setLastSaved(new Date());
        } catch (error) {
          console.error("Auto-save failed:", error);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [data, onSave]);

  const handleSaveDraft = async () => {
    await onSave(data, "draft");
    setLastSaved(new Date());
  };

  const handleSubmit = async () => {
    await onSave(data, "submitted");
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset data to initial data when canceling
    setData(initialData || {});
  };

  const periodLabel = periodDay 
    ? `${String(periodDay).padStart(2, '0')}/${String(periodMonth).padStart(2, '0')}/${periodYear}`
    : `${String(periodMonth).padStart(2, '0')}/${periodYear}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {schema.title} - {periodLabel}
              {isSubmitted && (
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Submitted
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2">
              {lastSaved && !isSubmitted && (
                <p className="text-sm text-muted-foreground">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </p>
              )}
              {isSubmitted && !isEditing && (
                <p className="text-sm text-green-600">
                  This report has been submitted. Click Edit to make changes.
                </p>
              )}
              {isEditing && (
                <p className="text-sm text-blue-600">
                  Editing mode - Make your changes and click Save or Submit
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isReadOnly ? (
              <Button
                variant="outline"
                onClick={handleEdit}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Report
              </Button>
            ) : (
              <>
                {isEditing && (
                  <Button
                    variant="ghost"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Draft
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {isEditing ? "Resubmit Report" : "Submit Report"}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {schema.type === "simple_list" ? (
          <SimpleListForm
            schema={schema}
            data={data}
            onChange={setData}
            readOnly={isReadOnly}
          />
        ) : (
          <MatrixForm
            schema={schema}
            data={data}
            onChange={setData}
            readOnly={isReadOnly}
          />
        )}

        {schema.type === "matrix" && schema.notes && schema.notes.length > 0 && (
          <div className="text-sm space-y-1 mt-6">
            <p className="font-semibold">NB :</p>
            {schema.notes.map((note, index) => (
              <p key={index} className="text-muted-foreground">{note}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
