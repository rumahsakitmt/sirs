"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  ArrowLeft,
  Folder,
  FileText,
  FolderOpen
} from "lucide-react";
import { nanoid } from "nanoid";
import type { 
  MatrixTemplateSchema, 
  ColumnDefinition,
  FieldType,
  TemplateSchema 
} from "@/lib/template-types";
import { cn } from "@/lib/utils";

// ============================================
// Sortable Column Component
// ============================================

interface SortableColumnProps {
  column: ColumnDefinition;
  onRemove: () => void;
  onUpdate: (column: ColumnDefinition) => void;
  depth?: number;
}

function SortableColumn({ column, onRemove, onUpdate, depth = 0 }: SortableColumnProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  if (column.type === "field") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "flex items-center gap-2 p-3 bg-card border rounded-lg",
          isDragging && "shadow-lg ring-2 ring-primary",
          depth > 0 && "ml-6 border-l-4 border-l-primary/20"
        )}
      >
        <button
          {...attributes}
          {...listeners}
          className="touch-none p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <FileText className="h-4 w-4 text-muted-foreground" />
        <Input
          value={column.label}
          onChange={(e) => onUpdate({ ...column, label: e.target.value })}
          className="flex-1"
          placeholder="Column label"
        />
        <Select
          value={column.fieldType}
          onValueChange={(v) => onUpdate({ ...column, fieldType: v as FieldType })}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="text">Text</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    );
  }

  // Group column
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-lg overflow-hidden",
        isDragging && "shadow-lg ring-2 ring-primary",
        depth > 0 && "ml-6"
      )}
    >
      <div className={cn(
        "flex items-center gap-2 p-3 bg-muted/50",
        isDragging && "bg-primary/5"
      )}>
        <button
          {...attributes}
          {...listeners}
          className="touch-none p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <button onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-primary" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <Input
          value={column.label}
          onChange={(e) => onUpdate({ ...column, label: e.target.value })}
          className="flex-1"
          placeholder="Group label"
        />
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      
      {isExpanded && (
        <div className="p-3 space-y-2 bg-card">
          <DndContext
            sensors={useSensors(
              useSensor(PointerSensor),
              useSensor(KeyboardSensor, {
                coordinateGetter: sortableKeyboardCoordinates,
              })
            )}
            collisionDetection={closestCenter}
            onDragEnd={(event) => {
              const { active, over } = event;
              if (over && active.id !== over.id) {
                const oldIndex = column.children.findIndex((c) => c.id === active.id);
                const newIndex = column.children.findIndex((c) => c.id === over.id);
                onUpdate({
                  ...column,
                  children: arrayMove(column.children, oldIndex, newIndex),
                });
              }
            }}
          >
            <SortableContext
              items={column.children.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {column.children.map((child) => (
                  <SortableColumn
                    key={child.id}
                    column={child}
                    depth={depth + 1}
                    onRemove={() => {
                      onUpdate({
                        ...column,
                        children: column.children.filter((c) => c.id !== child.id),
                      });
                    }}
                    onUpdate={(updated) => {
                      onUpdate({
                        ...column,
                        children: column.children.map((c) =>
                          c.id === child.id ? updated : c
                        ),
                      });
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onUpdate({
                  ...column,
                  children: [
                    ...column.children,
                    { type: "field", id: nanoid(), label: "New Field", fieldType: "number" },
                  ],
                });
              }}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Field
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onUpdate({
                  ...column,
                  children: [
                    ...column.children,
                    { type: "group", id: nanoid(), label: "New Group", children: [] },
                  ],
                });
              }}
            >
              <Folder className="mr-1 h-3 w-3" />
              Add Subgroup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Sortable Row Component
// ============================================

interface SortableRowProps {
  id: string;
  label: string;
  note?: string;
  onRemove: () => void;
  onUpdate: (label: string, note?: string) => void;
}

function SortableRow({ id, label, note, onRemove, onUpdate }: SortableRowProps) {
  const [showNote, setShowNote] = useState(!!note);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "space-y-2 p-3 bg-card border rounded-lg",
        isDragging && "shadow-lg ring-2 ring-primary"
      )}
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="touch-none p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <Input
          value={label}
          onChange={(e) => onUpdate(e.target.value, note)}
          className="flex-1"
          placeholder="Row label"
        />
        <Button variant="ghost" size="sm" onClick={() => setShowNote(!showNote)}>
          {showNote ? "Hide Note" : "Add Note"}
        </Button>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      {showNote && (
        <Input
          value={note || ""}
          onChange={(e) => onUpdate(label, e.target.value || undefined)}
          placeholder="Optional note for this row (shown in report footer)"
          className="text-sm"
        />
      )}
    </div>
  );
}

// ============================================
// Main Matrix Builder Component
// ============================================

interface MatrixBuilderProps {
  initialSchema?: MatrixTemplateSchema;
  onSave: (schema: TemplateSchema) => void;
  onBack: () => void;
  onPreview: () => void;
}

export function MatrixBuilder({
  initialSchema,
  onSave,
  onBack,
  onPreview,
}: MatrixBuilderProps) {
  const [title, setTitle] = useState(initialSchema?.title || "");
  const [description, setDescription] = useState(initialSchema?.description || "");
  const [columns, setColumns] = useState<ColumnDefinition[]>(
    initialSchema?.columns || []
  );
  const [rows, setRows] = useState(initialSchema?.rows || []);
  const [newRowLabel, setNewRowLabel] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleRowDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRows((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addRow = () => {
    if (newRowLabel.trim()) {
      setRows([...rows, { id: nanoid(), label: newRowLabel.trim() }]);
      setNewRowLabel("");
    }
  };

  const addBulkRows = () => {
    const labels = bulkInput
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    
    const newRows = labels.map((label) => ({ id: nanoid(), label }));
    setRows([...rows, ...newRows]);
    setBulkInput("");
    setShowBulkAdd(false);
  };

  const removeRow = (id: string) => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const updateRow = (id: string, label: string, note?: string) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, label, note } : row)));
  };

  const addColumn = () => {
    setColumns([
      ...columns,
      { type: "field", id: nanoid(), label: "New Column", fieldType: "number" },
    ]);
  };

  const addColumnGroup = () => {
    setColumns([
      ...columns,
      { type: "group", id: nanoid(), label: "New Group", children: [] },
    ]);
  };

  const updateColumn = (id: string, updates: ColumnDefinition) => {
    setColumns(
      columns.map((col) => (col.id === id ? updates : col))
    );
  };

  const removeColumn = (id: string) => {
    setColumns(columns.filter((col) => col.id !== id));
  };

  const handleSave = () => {
    const schema: MatrixTemplateSchema = {
      type: "matrix",
      title,
      description: description || undefined,
      columns,
      rows,
      notes: rows.filter(r => r.note).map(r => `${r.label}: ${r.note}`),
    };
    onSave(schema);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Matrix / Grid Builder</CardTitle>
          <CardDescription>
            Configure complex tables with grouped columns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Report Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., LAPORAN SIRS RAWAT INAP"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this report"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Columns</CardTitle>
          <CardDescription>
            Build your table structure. Groups can contain fields or nested groups.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleColumnDragEnd}
          >
            <SortableContext
              items={columns.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {columns.map((column) => (
                  <SortableColumn
                    key={column.id}
                    column={column}
                    onRemove={() => removeColumn(column.id)}
                    onUpdate={(updated) => updateColumn(column.id, updated)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {columns.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              No columns added yet.
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={addColumn}>
              <Plus className="mr-2 h-4 w-4" />
              Add Field Column
            </Button>
            <Button variant="outline" onClick={addColumnGroup}>
              <Folder className="mr-2 h-4 w-4" />
              Add Column Group
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rows (Service Types)</CardTitle>
          <CardDescription>
            Add row items. Drag to reorder. Add notes for footer explanations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showBulkAdd ? (
            <div className="flex gap-2">
              <Input
                value={newRowLabel}
                onChange={(e) => setNewRowLabel(e.target.value)}
                placeholder="Enter service type"
                onKeyDown={(e) => e.key === "Enter" && addRow()}
              />
              <Button onClick={addRow}>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
              <Button variant="outline" onClick={() => setShowBulkAdd(true)}>
                Bulk Add
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Paste list (one item per line)</Label>
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                className="w-full h-32 p-3 border rounded-md resize-none"
                placeholder="Item 1&#10;Item 2&#10;Item 3"
              />
              <div className="flex gap-2">
                <Button onClick={addBulkRows} disabled={!bulkInput.trim()}>
                  Add All
                </Button>
                <Button variant="outline" onClick={() => setShowBulkAdd(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleRowDragEnd}
          >
            <SortableContext
              items={rows.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {rows.map((row) => (
                  <SortableRow
                    key={row.id}
                    id={row.id}
                    label={row.label}
                    note={row.note}
                    onRemove={() => removeRow(row.id)}
                    onUpdate={(label, note) => updateRow(row.id, label, note)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {rows.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              No rows added yet.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onPreview}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={!title || rows.length === 0 || columns.length === 0}>
            <Save className="mr-2 h-4 w-4" />
            Save Template
          </Button>
        </div>
      </div>
    </div>
  );
}
