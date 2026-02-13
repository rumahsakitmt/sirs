import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  getColumnDepth, 
  getLeafColumns,
  type TemplateSchema,
  type SimpleListTemplateSchema,
  type MatrixTemplateSchema,
  type ColumnDefinition
} from "@/lib/template-types";
import { cn } from "@/lib/utils";

interface TemplatePreviewProps {
  schema: TemplateSchema;
  periodMonth?: string;
  periodYear?: string;
  showInputs?: boolean;
}

// ============================================
// Simple List Preview
// ============================================

function SimpleListPreview({ 
  schema, 
  periodMonth = "___", 
  periodYear = "2025",
  showInputs = false 
}: { 
  schema: SimpleListTemplateSchema;
  periodMonth?: string;
  periodYear?: string;
  showInputs?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold">
          {schema.title} BULAN {periodMonth} TAHUN {periodYear}
        </h2>
      </div>

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
                  <TableCell key={col.id} className="text-center border">
                    {showInputs ? (
                      <div className="w-16 h-8 border rounded mx-auto bg-white" />
                    ) : (
                      "___"
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {schema.description && (
        <p className="text-sm text-muted-foreground">{schema.description}</p>
      )}
    </div>
  );
}

// ============================================
// Matrix Table Header Builder
// ============================================

interface HeaderRow {
  cells: Array<{
    label: string;
    colSpan: number;
    rowSpan: number;
    isGroup: boolean;
  }>;
}

function buildHeaderRows(columns: ColumnDefinition[]): HeaderRow[] {
  const depth = getColumnDepth(columns);
  const rows: HeaderRow[] = Array(depth).fill(null).map(() => ({ cells: [] }));

  function processColumns(cols: ColumnDefinition[], currentDepth: number) {
    for (const col of cols) {
      if (col.type === "field") {
        // Field column - spans from current depth to the bottom
        const rowSpan = depth - currentDepth;
        rows[currentDepth].cells.push({
          label: col.label,
          colSpan: 1,
          rowSpan,
          isGroup: false,
        });
      } else {
        // Group column - label at current depth
        const leafCount = getLeafColumns(col.children).length;
        rows[currentDepth].cells.push({
          label: col.label,
          colSpan: leafCount,
          rowSpan: 1,
          isGroup: true,
        });
        // Process children at next depth
        processColumns(col.children, currentDepth + 1);
      }
    }
  }

  processColumns(columns, 0);
  return rows;
}

// ============================================
// Matrix Preview
// ============================================

function MatrixPreview({ 
  schema, 
  periodMonth = "___", 
  periodYear = "2025",
  showInputs = false 
}: { 
  schema: MatrixTemplateSchema;
  periodMonth?: string;
  periodYear?: string;
  showInputs?: boolean;
}) {
  const headerRows = buildHeaderRows(schema.columns);
  const leafColumns = getLeafColumns(schema.columns);
  const hasGroups = schema.columns.some(col => col.type === "group");

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold">
          {schema.title} BULAN {periodMonth} TAHUN {periodYear}
        </h2>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            {/* Build multi-level headers */}
            {hasGroups ? (
              <>
                {headerRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {/* Row number column */}
                    {rowIndex === 0 && (
                      <TableHead 
                        rowSpan={headerRows.length} 
                        className="w-12 text-center border align-middle"
                      >
                        NO
                      </TableHead>
                    )}
                    {/* Service type column */}
                    {rowIndex === 0 && (
                      <TableHead 
                        rowSpan={headerRows.length} 
                        className="border align-middle min-w-[200px]"
                      >
                        JENIS PELAYANAN
                      </TableHead>
                    )}
                    {/* Data columns */}
                    {row.cells.map((cell, cellIndex) => (
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
                    {showInputs ? (
                      <div className="w-12 h-6 border rounded mx-auto bg-white" />
                    ) : (
                      <span className="text-muted-foreground">___</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer Notes */}
      {schema.notes && schema.notes.length > 0 && (
        <div className="text-sm space-y-1">
          <p className="font-semibold">NB :</p>
          {schema.notes.map((note, index) => (
            <p key={index} className="text-muted-foreground">{note}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Preview Component
// ============================================

export function TemplatePreview({
  schema,
  periodMonth,
  periodYear,
  showInputs = false,
}: TemplatePreviewProps) {
  return (
    <Card>
      <CardContent className="p-6">
        {schema.type === "simple_list" ? (
          <SimpleListPreview
            schema={schema}
            periodMonth={periodMonth}
            periodYear={periodYear}
            showInputs={showInputs}
          />
        ) : (
          <MatrixPreview
            schema={schema}
            periodMonth={periodMonth}
            periodYear={periodYear}
            showInputs={showInputs}
          />
        )}
      </CardContent>
    </Card>
  );
}
