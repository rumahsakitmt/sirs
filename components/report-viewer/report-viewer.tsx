"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  TemplateSchema,
  SimpleListTemplateSchema,
  MatrixTemplateSchema,
  getLeafColumns,
  getColumnDepth,
  type ColumnDefinition,
} from "@/lib/template-types";
import { cn } from "@/lib/utils";
import { Calendar, Filter, Eye, CheckCircle2 } from "lucide-react";

interface ReportData {
  id: string;
  periodYear: number;
  periodMonth: number;
  periodDay: number | null;
  data: Record<string, Record<string, string>>;
  status: string;
  createdAt: Date;
  submittedAt: Date | null;
  room: {
    id: string;
    name: string;
  } | null;
  user: {
    id: string;
    name: string;
  } | null;
}

interface Template {
  id: string;
  name: string;
  type: string;
  periodType: string;
  schema: TemplateSchema;
  room: {
    id: string;
    name: string;
  } | null;
}

interface Room {
  id: string;
  name: string;
}

interface ReportViewerProps {
  templates: Template[];
  rooms: Room[];
  initialReports?: ReportData[];
  onFilterChange: (filters: {
    templateId?: string;
    templateIds?: string[];
    year: number;
    month?: number;
    startDay?: number;
    endDay?: number;
    roomId?: string;
    status?: "draft" | "submitted";
  }) => Promise<ReportData[]>;
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export function ReportViewer({
  templates,
  rooms,
  initialReports,
  onFilterChange,
}: ReportViewerProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedTemplateName, setSelectedTemplateName] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(currentMonth);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<"draft" | "submitted" | undefined>("submitted");
  const [reports, setReports] = useState<ReportData[]>(initialReports ?? []);
  const [isLoading, setIsLoading] = useState(false);

  // Group templates by name
  const uniqueTemplates = useMemo(() => {
    const map = new Map<string, Template>();
    templates.forEach(t => {
      if (!map.has(t.name)) {
        map.set(t.name, t);
      }
    });
    return Array.from(map.values());
  }, [templates]);

  // All templates matching the selected name
  const selectedTemplates = useMemo(
    () => templates.filter((t) => t.name === selectedTemplateName),
    [templates, selectedTemplateName]
  );

  // Use the first template for schema rendering
  const selectedTemplate = selectedTemplates.length > 0 ? selectedTemplates[0] : undefined;

  const filteredRooms = useMemo(() => {
    if (selectedTemplates.length === 0) return rooms;

    // If any selected template is global (no room), show all rooms
    const hasGlobal = selectedTemplates.some(t => !t.room);
    if (hasGlobal) return rooms;

    // Otherwise, only show rooms that are assigned to these templates
    const roomIds = new Set(selectedTemplates.map(t => t.room?.id).filter(Boolean));
    return rooms.filter((r) => roomIds.has(r.id));
  }, [rooms, selectedTemplates]);

  const years = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  const daysInMonth = useMemo(() => {
    if (!selectedYear || !selectedMonth) return 31;
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const handleSearch = async () => {
    if (selectedTemplates.length === 0) return;

    setIsLoading(true);
    try {
      const results = await onFilterChange({
        templateIds: selectedTemplates.map(t => t.id),
        year: selectedYear,
        month: selectedMonth,
        roomId: selectedRoomId,
        status: selectedStatus,
      });
      setReports(results);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Lihat Laporan
          </CardTitle>
          <CardDescription>
            Pilih template dan periode waktu untuk melihat data laporan teragregasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Template Select */}
            <div className="space-y-2">
              <label htmlFor="template-select" className="text-sm font-medium">Template</label>
              <Select
                value={selectedTemplateName}
                onValueChange={(v) => {
                  setSelectedTemplateName(v);
                  setSelectedRoomId(undefined);
                }}
              >
                <SelectTrigger id="template-select" className="w-full">
                  <SelectValue placeholder="Pilih template" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueTemplates.map((template) => (
                    <SelectItem key={template.name} value={template.name}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Select */}
            <div className="space-y-2">
              <label htmlFor="year-select" className="text-sm font-medium">Tahun</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger id="year-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Select */}
            <div className="space-y-2">
              <label htmlFor="month-select" className="text-sm font-medium">Bulan</label>
              <Select
                value={selectedMonth?.toString() || "all"}
                onValueChange={(v) =>
                  setSelectedMonth(v === "all" ? undefined : parseInt(v))
                }
              >
                <SelectTrigger id="month-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Bulan</SelectItem>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={month} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Room Select */}
            <div className="space-y-2">
              <label htmlFor="room-select" className="text-sm font-medium">Ruangan</label>
              <Select
                value={selectedRoomId || "all"}
                onValueChange={(v) =>
                  setSelectedRoomId(v === "all" ? undefined : v)
                }
              >
                <SelectTrigger id="room-select" className="w-full">
                  <SelectValue placeholder="Semua Ruangan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Ruangan</SelectItem>
                  {filteredRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Button */}
            <div className="space-y-2">
              <span className="text-sm font-medium invisible" aria-hidden="true">Cari</span>
              <Button
                onClick={handleSearch}
                disabled={selectedTemplates.length === 0 || isLoading}
                className="w-full"
              >
                {isLoading ? "Memuat..." : "Cari Laporan"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {selectedTemplate && reports.length > 0 && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Laporan</p>
                    <p className="text-2xl font-bold">{reports.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Terkirim</p>
                    <p className="text-2xl font-bold">
                      {reports.filter((r) => r.status === "submitted").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-yellow-500/10">
                    <Eye className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Draf</p>
                    <p className="text-2xl font-bold">
                      {reports.filter((r) => r.status === "draft").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Calendar className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Periode</p>
                    <p className="text-lg font-bold">
                      {selectedMonth ? MONTHS[selectedMonth - 1] : "Semua"} {selectedYear}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedTemplate.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {selectedTemplate.type === "simple_list" ? "Daftar Sederhana" : "Matriks"}
                  </Badge>
                  <Badge variant="secondary">
                    {selectedTemplate.periodType === "daily" ? "Harian" : "Bulanan"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ReportTableView
                schema={selectedTemplate.schema}
                reports={reports}
                periodType={selectedTemplate.periodType}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* No results */}
      {selectedTemplates.length > 0 && reports.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              Tidak ada laporan ditemukan untuk kriteria yang dipilih.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Coba sesuaikan filter atau pilih periode waktu yang berbeda.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================
// Table View Component
// ============================================

function ReportTableView({
  schema,
  reports,
  periodType,
}: {
  schema: TemplateSchema;
  reports: ReportData[];
  periodType: string;
}) {
  return (
    <div className="space-y-4">
      {schema.type === "simple_list" ? (
        <SimpleListCombinedView schema={schema} reports={reports} />
      ) : (
        <MatrixCombinedView schema={schema} reports={reports} />
      )}
    </div>
  );
}

function SimpleListTableView({
  schema,
  reports,
  periodType,
}: {
  schema: SimpleListTemplateSchema;
  reports: ReportData[];
  periodType: string;
}) {
  // Group reports by period for display
  const sortedReports = [...reports].sort((a, b) => {
    if (a.periodYear !== b.periodYear) return b.periodYear - a.periodYear;
    if (a.periodMonth !== b.periodMonth) return b.periodMonth - a.periodMonth;
    if (a.periodDay !== null && b.periodDay !== null) return b.periodDay - a.periodDay;
    return 0;
  });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background">Periode</TableHead>
            <TableHead>Ruangan</TableHead>
            {schema.rows.map((row) => (
              <TableHead key={row.id} className="text-center min-w-[100px]">
                {row.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedReports.map((report) => (
            <TableRow key={report.id}>
              <TableCell className="sticky left-0 bg-background font-medium">
                {periodType === "daily"
                  ? `${String(report.periodDay).padStart(2, "0")}/${String(report.periodMonth).padStart(2, "0")}/${report.periodYear}`
                  : `${MONTHS[report.periodMonth - 1]} ${report.periodYear}`}
              </TableCell>
              <TableCell>{report.room?.name || "-"}</TableCell>
              {schema.rows.map((row) => (
                <TableCell key={row.id} className="text-center">
                  {schema.valueColumns.map((col) => (
                    <span key={col.id}>
                      {report.data?.[row.id]?.[col.id] || "0"}
                    </span>
                  ))}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MatrixTableView({
  schema,
  reports,
  periodType,
}: {
  schema: MatrixTemplateSchema;
  reports: ReportData[];
  periodType: string;
}) {
  const leafColumns = getLeafColumns(schema.columns);
  const sortedReports = [...reports].sort((a, b) => {
    if (a.periodYear !== b.periodYear) return b.periodYear - a.periodYear;
    if (a.periodMonth !== b.periodMonth) return b.periodMonth - a.periodMonth;
    if (a.periodDay !== null && b.periodDay !== null) return b.periodDay - a.periodDay;
    return 0;
  });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background">Periode</TableHead>
            <TableHead>Ruangan</TableHead>
            <TableHead>Layanan</TableHead>
            {leafColumns.map((col) => (
              <TableHead key={col.id} className="text-center min-w-[80px]">
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedReports.map((report) =>
            schema.rows.map((row, rowIndex) => (
              <TableRow key={`${report.id}-${row.id}`}>
                {rowIndex === 0 && (
                  <TableCell
                    rowSpan={schema.rows.length}
                    className="sticky left-0 bg-background font-medium align-top"
                  >
                    {periodType === "daily"
                      ? `${String(report.periodDay).padStart(2, "0")}/${String(report.periodMonth).padStart(2, "0")}/${report.periodYear}`
                      : `${MONTHS[report.periodMonth - 1]} ${report.periodYear}`}
                  </TableCell>
                )}
                {rowIndex === 0 && (
                  <TableCell
                    rowSpan={schema.rows.length}
                    className="align-top"
                  >
                    {report.room?.name || "-"}
                  </TableCell>
                )}
                <TableCell>{row.label}</TableCell>
                {leafColumns.map((col) => (
                  <TableCell key={col.id} className="text-center">
                    {report.data?.[row.id]?.[col.id] || "0"}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================
// Combined Value View Components
// ============================================

function SimpleListCombinedView({
  schema,
  reports,
}: {
  schema: SimpleListTemplateSchema;
  reports: ReportData[];
}) {
  // Calculate combined totals for each row and column
  const combinedData = useMemo(() => {
    const totals: Record<string, Record<string, number>> = {};

    // Initialize totals
    schema.rows.forEach((row) => {
      totals[row.id] = {};
      schema.valueColumns.forEach((col) => {
        totals[row.id][col.id] = 0;
      });
    });

    // Sum up all values
    reports.forEach((report) => {
      schema.rows.forEach((row) => {
        schema.valueColumns.forEach((col) => {
          const value = parseInt(report.data?.[row.id]?.[col.id] || "0", 10);
          totals[row.id][col.id] += value;
        });
      });
    });

    return totals;
  }, [schema, reports]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Combined data from {reports.length} report(s)
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead>Kategori</TableHead>
              {schema.valueColumns.map((col) => (
                <TableHead key={col.id} className="text-center min-w-[120px]">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {schema.rows.map((row, index) => {
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{row.label}</TableCell>
                  {schema.valueColumns.map((col) => (
                    <TableCell key={col.id} className="text-center font-mono">
                      {(combinedData[row.id]?.[col.id] || 0).toLocaleString()}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function MatrixCombinedView({
  schema,
  reports,
}: {
  schema: MatrixTemplateSchema;
  reports: ReportData[];
}) {
  const leafColumns = getLeafColumns(schema.columns);
  const headerRows = buildHeaderRows(schema.columns);
  const hasGroups = schema.columns.some((col) => col.type === "group");

  // Calculate combined totals for each row and column
  const combinedData = useMemo(() => {
    const totals: Record<string, Record<string, number>> = {};

    // Initialize totals
    schema.rows.forEach((row) => {
      totals[row.id] = {};
      leafColumns.forEach((col) => {
        totals[row.id][col.id] = 0;
      });
    });

    // Sum up all values
    reports.forEach((report) => {
      schema.rows.forEach((row) => {
        leafColumns.forEach((col) => {
          const value = parseInt(report.data?.[row.id]?.[col.id] || "0", 10);
          totals[row.id][col.id] += value;
        });
      });
    });

    return totals;
  }, [schema, reports, leafColumns]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Combined data from {reports.length} report(s)
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {hasGroups ? (
              <>
                {headerRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {rowIndex === 0 && (
                      <TableHead
                        rowSpan={headerRows.length}
                        className="w-12 text-center"
                      >
                        No
                      </TableHead>
                    )}
                    {rowIndex === 0 && (
                      <TableHead
                        rowSpan={headerRows.length}
                        className="min-w-[180px]"
                      >
                        Jenis Layanan
                      </TableHead>
                    )}
                    {row.map((cell, cellIndex) => (
                      <TableHead
                        key={cellIndex}
                        colSpan={cell.colSpan}
                        rowSpan={cell.rowSpan}
                        className={cn(
                          "text-center min-w-[80px]",
                          cell.isGroup && "bg-muted/50"
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
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead className="min-w-[180px]">Jenis Layanan</TableHead>
                {leafColumns.map((col) => (
                  <TableHead key={col.id} className="text-center min-w-[80px]">
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {schema.rows.map((row, index) => {
              return (
                <TableRow key={row.id}>
                  <TableCell className="text-center font-medium">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    {row.label}
                    {row.note && (
                      <span className="block text-xs text-muted-foreground">
                        {row.note}
                      </span>
                    )}
                  </TableCell>
                  {leafColumns.map((col) => (
                    <TableCell key={col.id} className="text-center font-mono">
                      {(combinedData[row.id]?.[col.id] || 0).toLocaleString()}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {schema.notes && schema.notes.length > 0 && (
        <div className="text-sm space-y-1 mt-4 p-4 bg-muted/30 rounded-lg">
          <p className="font-semibold">Catatan:</p>
          {schema.notes.map((note, index) => (
            <p key={`note-${index}`} className="text-muted-foreground">
              {note}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to build header rows for matrix tables
function buildHeaderRows(
  columns: ColumnDefinition[]
): Array<
  Array<{ label: string; colSpan: number; rowSpan: number; isGroup: boolean }>
> {
  const depth = getColumnDepth(columns);
  const rows: Array<
    Array<{ label: string; colSpan: number; rowSpan: number; isGroup: boolean }>
  > = Array(depth)
    .fill(null)
    .map(() => []);

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
