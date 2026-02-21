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
import { GripVertical, Plus, Trash2, Save, Eye, ArrowLeft } from "lucide-react";
import { nanoid } from "nanoid";
import type { 
  SimpleListTemplateSchema, 
  FieldType,
  TemplateSchema 
} from "@/lib/template-types";

interface SortableItemProps {
  id: string;
  label: string;
  onRemove: () => void;
  onUpdate: (label: string) => void;
}

function SortableItem({ id, label, onRemove, onUpdate }: SortableItemProps) {
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
      className={`flex items-center gap-2 p-3 bg-card border rounded-lg ${
        isDragging ? "shadow-lg ring-2 ring-primary" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <Input
        value={label}
        onChange={(e) => onUpdate(e.target.value)}
        className="flex-1"
        placeholder="Item label"
      />
      <Button variant="ghost" size="icon" onClick={onRemove}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

interface SimpleListBuilderProps {
  initialSchema?: SimpleListTemplateSchema;
  onSave: (schema: TemplateSchema) => void;
  onBack: () => void;
  onPreview: (schema: TemplateSchema) => void;
}

export function SimpleListBuilder({
  initialSchema,
  onSave,
  onBack,
  onPreview,
}: SimpleListBuilderProps) {
  const [title, setTitle] = useState(initialSchema?.title || "");
  const [description, setDescription] = useState(initialSchema?.description || "");
  const [valueColumns, setValueColumns] = useState(
    initialSchema?.valueColumns || [{ id: nanoid(), label: "", fieldType: "number" as FieldType }]
  );
  const [rows, setRows] = useState(
    initialSchema?.rows || []
  );
  const [newRowLabel, setNewRowLabel] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
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

  const updateRow = (id: string, label: string) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, label } : row)));
  };

  const addValueColumn = () => {
    setValueColumns([
      ...valueColumns,
      { id: nanoid(), label: "", fieldType: "number" },
    ]);
  };

  const updateValueColumn = (id: string, updates: Partial<typeof valueColumns[0]>) => {
    setValueColumns(
      valueColumns.map((col) => (col.id === id ? { ...col, ...updates } : col))
    );
  };

  const removeValueColumn = (id: string) => {
    if (valueColumns.length > 1) {
      setValueColumns(valueColumns.filter((col) => col.id !== id));
    }
  };

  const handleSave = () => {
    const schema: SimpleListTemplateSchema = {
      type: "simple_list",
      title,
      description: description || undefined,
      valueColumns,
      rows,
    };
    onSave(schema);
  };

  const handlePreview = () => {
    const schema: SimpleListTemplateSchema = {
      type: "simple_list",
      title,
      description: description || undefined,
      valueColumns,
      rows,
    };
    onPreview(schema);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Simple List Builder</CardTitle>
          <CardDescription>
            Configure your report title, columns, and items
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Report Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., LAPORAN SIRS RADIOLOGI"
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

          <div className="space-y-4">
            <Label>Value Columns</Label>
            <div className="space-y-2">
              {valueColumns.map((col, index) => (
                <div key={col.id} className="flex items-center gap-2">
                  <Input
                    value={col.label}
                    onChange={(e) => updateValueColumn(col.id, { label: e.target.value })}
                    placeholder="Column label"
                    className="flex-1"
                  />
                  <Select
                    value={col.fieldType}
                    onValueChange={(v) => updateValueColumn(col.id, { fieldType: v as FieldType })}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeValueColumn(col.id)}
                    disabled={valueColumns.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addValueColumn}>
              <Plus className="mr-2 h-4 w-4" />
              Add Column
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Row Items</CardTitle>
          <CardDescription>
            Add items to be reported. Drag to reorder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showBulkAdd ? (
            <div className="flex gap-2">
              <Input
                value={newRowLabel}
                onChange={(e) => setNewRowLabel(e.target.value)}
                placeholder="Enter item label"
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
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={rows.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {rows.map((row, index) => (
                  <SortableItem
                    key={row.id}
                    id={row.id}
                    label={row.label}
                    onRemove={() => removeRow(row.id)}
                    onUpdate={(label) => updateRow(row.id, label)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {rows.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              No items added yet. Add items above.
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
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={!title || rows.length === 0}>
            <Save className="mr-2 h-4 w-4" />
            Save Template
          </Button>
        </div>
      </div>
    </div>
  );
}
