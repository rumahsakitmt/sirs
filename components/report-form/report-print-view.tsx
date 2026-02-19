"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  getLeafColumns,
  getColumnDepth,
  type TemplateSchema,
  type SimpleListTemplateSchema,
  type MatrixTemplateSchema,
  type ColumnDefinition,
} from "@/lib/template-types";
import { cn } from "@/lib/utils";
import { Printer } from "lucide-react";

interface ReportPrintViewProps {
  schema: TemplateSchema;
  data: Record<string, Record<string, string>>;
  periodLabel: string;
  roomName: string;
}

// ============================================
// Simple List Print View
// ============================================

function SimpleListPrintView({ 
  schema, 
  data, 
  periodLabel 
}: { 
  schema: SimpleListTemplateSchema;
  data: Record<string, Record<string, string>>;
  periodLabel: string;
}) {
  return (
    <div className="space-y-4 print:space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold print:text-2xl">
          {schema.title} BULAN {periodLabel}
        </h2>
      </div>

      <table className="w-full border-collapse border border-black print:border-black">
        <thead>
          <tr>
            <th className="w-16 border border-black p-2 text-center print:border-black">NO</th>
            <th className="border border-black p-2 text-left print:border-black">JENIS KEGIATAN</th>
            {schema.valueColumns.map((col) => (
              <th 
                key={col.id} 
                className="border border-black p-2 text-center print:border-black"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {schema.rows.map((row, index) => (
            <tr key={row.id}>
              <td className="border border-black p-2 text-center print:border-black">
                {index + 1}
              </td>
              <td className="border border-black p-2 print:border-black">
                {row.label}
              </td>
              {schema.valueColumns.map((col) => (
                <td 
                  key={col.id} 
                  className="border border-black p-2 text-center print:border-black min-w-[80px]"
                >
                  {data[row.id]?.[col.id] || ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// Matrix Print View
// ============================================

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

function MatrixPrintView({ 
  schema, 
  data, 
  periodLabel 
}: { 
  schema: MatrixTemplateSchema;
  data: Record<string, Record<string, string>>;
  periodLabel: string;
}) {
  const headerRows = buildHeaderRows(schema.columns);
  const leafColumns = getLeafColumns(schema.columns);
  const hasGroups = schema.columns.some(col => col.type === "group");

  return (
    <div className="space-y-4 print:space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold print:text-2xl">
          {schema.title} BULAN {periodLabel}
        </h2>
      </div>

      <table className="w-full border-collapse border border-black print:border-black text-sm">
        <thead>
          {hasGroups ? (
            <>
              {headerRows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {rowIndex === 0 && (
                    <th 
                      rowSpan={headerRows.length} 
                      className="w-12 border border-black p-2 text-center print:border-black"
                    >
                      NO
                    </th>
                  )}
                  {rowIndex === 0 && (
                    <th 
                      rowSpan={headerRows.length} 
                      className="border border-black p-2 text-left print:border-black min-w-[180px]"
                    >
                      JENIS PELAYANAN
                    </th>
                  )}
                  {row.map((cell, cellIndex) => (
                    <th
                      key={cellIndex}
                      colSpan={cell.colSpan}
                      rowSpan={cell.rowSpan}
                      className={cn(
                        "border border-black p-2 text-center print:border-black",
                        cell.isGroup && "bg-gray-100"
                      )}
                    >
                      {cell.label}
                    </th>
                  ))}
                </tr>
              ))}
            </>
          ) : (
            <tr>
              <th className="w-12 border border-black p-2 text-center print:border-black">NO</th>
              <th className="border border-black p-2 text-left print:border-black min-w-[180px]">JENIS PELAYANAN</th>
              {leafColumns.map((col) => (
                <th key={col.id} className="border border-black p-2 text-center print:border-black">
                  {col.label}
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {schema.rows.map((row, index) => (
            <tr key={row.id}>
              <td className="border border-black p-2 text-center print:border-black">
                {index + 1}
              </td>
              <td className="border border-black p-2 print:border-black">
                {row.label}
              </td>
              {leafColumns.map((col) => (
                <td 
                  key={col.id} 
                  className="border border-black p-2 text-center print:border-black min-w-[60px]"
                >
                  {data[row.id]?.[col.id] || ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {schema.notes && schema.notes.length > 0 && (
        <div className="text-sm space-y-1 mt-6 print:mt-6">
          <p className="font-semibold">NB :</p>
          {schema.notes.map((note, index) => (
            <p key={`note-${index}`}>{note}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Print View Component
// ============================================

export function ReportPrintView({
  schema,
  data,
  periodLabel,
  roomName,
}: ReportPrintViewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Print button - hidden when printing */}
      <div className="mb-6 flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Print Preview</h1>
          <p className="text-muted-foreground">{roomName} • {periodLabel}</p>
        </div>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </Button>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block mb-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{schema.title}</h1>
          <p className="text-sm mt-2">Room: {roomName}</p>
        </div>
      </div>

      {/* Report content */}
      <div className="bg-white p-8 print:p-0">
        {schema.type === "simple_list" ? (
          <SimpleListPrintView
            schema={schema}
            data={data}
            periodLabel={periodLabel}
          />
        ) : (
          <MatrixPrintView
            schema={schema}
            data={data}
            periodLabel={periodLabel}
          />
        )}
      </div>

      {/* Print footer */}
      <div className="hidden print:block mt-12 text-center text-sm text-gray-500">
        <p>Generated by SIRS - Sistem Informasi Rumah Sakit</p>
      </div>
    </div>
  );
}
