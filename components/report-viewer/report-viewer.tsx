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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ResponsiveContainer } from "recharts";
import {
  TemplateSchema,
  SimpleListTemplateSchema,
  MatrixTemplateSchema,
  getLeafColumns,
  getColumnDepth,
  type ColumnDefinition,
} from "@/lib/template-types";
import { cn } from "@/lib/utils";
import { Calendar, TrendingUp, Table2, BarChart3, Filter, Download, Eye } from "lucide-react";

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
    templateId: string;
    year: number;
    month?: number;
    startDay?: number;
    endDay?: number;
    roomId?: string;
    status?: "draft" | "submitted";
  }) => Promise<ReportData[]>;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function ReportViewer({
  templates,
  rooms,
  initialReports = [],
  onFilterChange,
}: ReportViewerProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(currentMonth);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<"draft" | "submitted" | undefined>("submitted");
  const [reports, setReports] = useState<ReportData[]>(initialReports);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "chart" | "summary">("table");

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  const filteredRooms = useMemo(() => {
    if (!selectedTemplate?.room) return rooms;
    return rooms.filter((r) => r.id === selectedTemplate.room?.id);
  }, [rooms, selectedTemplate]);

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
    if (!selectedTemplateId) return;

    setIsLoading(true);
    try {
      const results = await onFilterChange({
        templateId: selectedTemplateId,
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

  // Aggregate data for visualization
  const aggregatedData = useMemo(() => {
    if (!selectedTemplate?.schema || reports.length === 0) return null;

    const schema = selectedTemplate.schema;

    if (schema.type === "simple_list") {
      return aggregateSimpleListData(schema, reports);
    } else {
      return aggregateMatrixData(schema, reports);
    }
  }, [selectedTemplate, reports]);

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Viewer
          </CardTitle>
          <CardDescription>
            Select a template and time period to view aggregated report data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Template Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Template</label>
              <Select
                value={selectedTemplateId}
                onValueChange={(v) => {
                  setSelectedTemplateId(v);
                  setSelectedRoomId(undefined);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="w-full">
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
              <label className="text-sm font-medium">Month</label>
              <Select
                value={selectedMonth?.toString() || "all"}
                onValueChange={(v) =>
                  setSelectedMonth(v === "all" ? undefined : parseInt(v))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Room Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Room</label>
              <Select
                value={selectedRoomId || "all"}
                onValueChange={(v) =>
                  setSelectedRoomId(v === "all" ? undefined : v)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
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
              <label className="text-sm font-medium invisible">Search</label>
              <Button
                onClick={handleSearch}
                disabled={!selectedTemplateId || isLoading}
                className="w-full"
              >
                {isLoading ? "Loading..." : "Search Reports"}
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
                    <p className="text-sm text-muted-foreground">Total Reports</p>
                    <p className="text-2xl font-bold">{reports.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
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
                    <p className="text-sm text-muted-foreground">Drafts</p>
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
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Period</p>
                    <p className="text-lg font-bold">
                      {selectedMonth ? MONTHS[selectedMonth - 1] : "All"} {selectedYear}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* View Tabs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedTemplate.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {selectedTemplate.type === "simple_list" ? "Simple List" : "Matrix"}
                  </Badge>
                  <Badge variant="secondary">
                    {selectedTemplate.periodType === "daily" ? "Daily" : "Monthly"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                <TabsList className="mb-4">
                  <TabsTrigger value="table">
                    <Table2 className="h-4 w-4 mr-2" />
                    Table View
                  </TabsTrigger>
                  <TabsTrigger value="chart">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Chart View
                  </TabsTrigger>
                  <TabsTrigger value="summary">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Summary
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="table">
                  <ReportTableView
                    schema={selectedTemplate.schema}
                    reports={reports}
                    periodType={selectedTemplate.periodType}
                  />
                </TabsContent>

                <TabsContent value="chart">
                  {aggregatedData && (
                    <ReportChartView
                      schema={selectedTemplate.schema}
                      aggregatedData={aggregatedData}
                    />
                  )}
                </TabsContent>

                <TabsContent value="summary">
                  {aggregatedData && (
                    <ReportSummaryView
                      schema={selectedTemplate.schema}
                      aggregatedData={aggregatedData}
                      reports={reports}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {/* No results */}
      {selectedTemplateId && reports.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              No reports found for the selected criteria.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your filters or selecting a different time period.
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
  const [tableViewMode, setTableViewMode] = useState<"individual" | "combined">("combined");

  return (
    <div className="space-y-4">
      <Tabs value={tableViewMode} onValueChange={(v) => setTableViewMode(v as any)}>
        <TabsList>
          <TabsTrigger value="combined">
            Combined Values
          </TabsTrigger>
          <TabsTrigger value="individual">
            Individual Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="combined" className="mt-4">
          {schema.type === "simple_list" ? (
            <SimpleListCombinedView schema={schema} reports={reports} />
          ) : (
            <MatrixCombinedView schema={schema} reports={reports} />
          )}
        </TabsContent>

        <TabsContent value="individual" className="mt-4">
          {schema.type === "simple_list" ? (
            <SimpleListTableView
              schema={schema}
              reports={reports}
              periodType={periodType}
            />
          ) : (
            <MatrixTableView
              schema={schema}
              reports={reports}
              periodType={periodType}
            />
          )}
        </TabsContent>
      </Tabs>
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
            <TableHead className="sticky left-0 bg-background">Period</TableHead>
            <TableHead>Room</TableHead>
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
            <TableHead className="sticky left-0 bg-background">Period</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Service</TableHead>
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

  // Calculate grand total
  const grandTotal = useMemo(() => {
    let total = 0;
    Object.values(combinedData).forEach((row) => {
      Object.values(row).forEach((val) => {
        total += val;
      });
    });
    return total;
  }, [combinedData]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Combined data from {reports.length} report(s)
        </p>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          Total: {grandTotal.toLocaleString()}
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead>Category</TableHead>
              {schema.valueColumns.map((col) => (
                <TableHead key={col.id} className="text-center min-w-[120px]">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {schema.rows.map((row, index) => {
              const rowTotal = Object.values(combinedData[row.id] || {}).reduce((a, b) => a + b, 0);
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
            {/* Total Row */}
            <TableRow className="bg-muted/50 font-bold">
              <TableCell colSpan={2}>TOTAL</TableCell>
              {schema.valueColumns.map((col) => {
                const colTotal = schema.rows.reduce(
                  (sum, row) => sum + (combinedData[row.id]?.[col.id] || 0),
                  0
                );
                return (
                  <TableCell key={col.id} className="text-center font-mono">
                    {colTotal.toLocaleString()}
                  </TableCell>
                );
              })}
            </TableRow>
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

  // Calculate grand total
  const grandTotal = useMemo(() => {
    let total = 0;
    Object.values(combinedData).forEach((row) => {
      Object.values(row).forEach((val) => {
        total += val;
      });
    });
    return total;
  }, [combinedData]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Combined data from {reports.length} report(s)
        </p>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          Total: {grandTotal.toLocaleString()}
        </Badge>
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
                        Service Type
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
                    {rowIndex === 0 && (
                      <TableHead
                        rowSpan={headerRows.length}
                        className="text-center min-w-[100px] bg-primary/10"
                      >
                        Row Total
                      </TableHead>
                    )}
                  </TableRow>
                ))}
              </>
            ) : (
              <TableRow>
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead className="min-w-[180px]">Service Type</TableHead>
                {leafColumns.map((col) => (
                  <TableHead key={col.id} className="text-center min-w-[80px]">
                    {col.label}
                  </TableHead>
                ))}
                <TableHead className="text-center min-w-[100px] bg-primary/10">
                  Row Total
                </TableHead>
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {schema.rows.map((row, index) => {
              const rowTotal = Object.values(combinedData[row.id] || {}).reduce(
                (a, b) => a + b,
                0
              );
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
                  <TableCell className="text-center font-mono font-bold bg-primary/5">
                    {rowTotal.toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
            {/* Total Row */}
            <TableRow className="bg-muted/50 font-bold">
              <TableCell colSpan={2} className="text-right">
                COLUMN TOTAL
              </TableCell>
              {leafColumns.map((col) => {
                const colTotal = schema.rows.reduce(
                  (sum, row) => sum + (combinedData[row.id]?.[col.id] || 0),
                  0
                );
                return (
                  <TableCell key={col.id} className="text-center font-mono">
                    {colTotal.toLocaleString()}
                  </TableCell>
                );
              })}
              <TableCell className="text-center font-mono bg-primary/10">
                {grandTotal.toLocaleString()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {schema.notes && schema.notes.length > 0 && (
        <div className="text-sm space-y-1 mt-4 p-4 bg-muted/30 rounded-lg">
          <p className="font-semibold">Notes:</p>
          {schema.notes.map((note, index) => (
            <p key={index} className="text-muted-foreground">
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

// ============================================
// Chart View Component
// ============================================

function ReportChartView({
  schema,
  aggregatedData,
}: {
  schema: TemplateSchema;
  aggregatedData: AggregatedData;
}) {
  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    aggregatedData.labels.forEach((label, index) => {
      config[label] = {
        label,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });
    return config;
  }, [aggregatedData]);

  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <div className="h-[400px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart data={aggregatedData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
              tick={{ fontSize: 10 }}
            />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>

      {/* Trend Line Chart (if multiple periods) */}
      {aggregatedData.trendData && aggregatedData.trendData.length > 1 && (
        <div className="h-[300px]">
          <h3 className="text-lg font-semibold mb-4">Trend Over Time</h3>
          <ChartContainer config={chartConfig} className="h-full w-full">
            <LineChart data={aggregatedData.trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      )}
    </div>
  );
}

// ============================================
// Summary View Component
// ============================================

function ReportSummaryView({
  schema,
  aggregatedData,
  reports,
}: {
  schema: TemplateSchema;
  aggregatedData: AggregatedData;
  reports: ReportData[];
}) {
  // Get top items
  const topItems = [...aggregatedData.chartData]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const totalValue = aggregatedData.chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Total Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Total Summary</CardTitle>
          <CardDescription>
            Aggregated totals from {reports.length} report(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary mb-4">
            {totalValue.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">
            Total across all categories
          </p>
        </CardContent>
      </Card>

      {/* Top Items */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Categories</CardTitle>
          <CardDescription>Highest values by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topItems.map((item, index) => (
              <div key={item.name} className="flex items-center gap-4">
                <span className="text-2xl font-bold text-muted-foreground w-8">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm">{item.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(item.value / (topItems[0]?.value || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
          <CardDescription>All categories with their totals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {aggregatedData.chartData.map((item) => (
              <div
                key={item.name}
                className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <p className="text-sm text-muted-foreground truncate" title={item.name}>
                  {item.name}
                </p>
                <p className="text-xl font-bold">{item.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Data Aggregation Helpers
// ============================================

interface AggregatedData {
  chartData: Array<{ name: string; value: number }>;
  trendData?: Array<{ period: string; total: number }>;
  labels: string[];
}

function aggregateSimpleListData(
  schema: SimpleListTemplateSchema,
  reports: ReportData[]
): AggregatedData {
  const totals: Record<string, number> = {};
  const periodTotals: Record<string, number> = {};

  // Initialize totals for all rows
  schema.rows.forEach((row) => {
    totals[row.label] = 0;
  });

  // Aggregate data from all reports
  reports.forEach((report) => {
    let reportTotal = 0;
    schema.rows.forEach((row) => {
      schema.valueColumns.forEach((col) => {
        const value = parseInt(report.data?.[row.id]?.[col.id] || "0", 10);
        totals[row.label] += value;
        reportTotal += value;
      });
    });

    // Track period totals
    const periodKey = report.periodDay
      ? `${report.periodDay}/${report.periodMonth}`
      : `${MONTHS[report.periodMonth - 1]}`;
    periodTotals[periodKey] = (periodTotals[periodKey] || 0) + reportTotal;
  });

  const chartData = schema.rows.map((row) => ({
    name: row.label,
    value: totals[row.label],
  }));

  const trendData = Object.entries(periodTotals).map(([period, total]) => ({
    period,
    total,
  }));

  return {
    chartData,
    trendData,
    labels: schema.rows.map((r) => r.label),
  };
}

function aggregateMatrixData(
  schema: MatrixTemplateSchema,
  reports: ReportData[]
): AggregatedData {
  const leafColumns = getLeafColumns(schema.columns);
  const totals: Record<string, number> = {};
  const periodTotals: Record<string, number> = {};

  // Initialize totals for all rows
  schema.rows.forEach((row) => {
    totals[row.label] = 0;
  });

  // Aggregate data from all reports
  reports.forEach((report) => {
    let reportTotal = 0;
    schema.rows.forEach((row) => {
      leafColumns.forEach((col) => {
        const value = parseInt(report.data?.[row.id]?.[col.id] || "0", 10);
        totals[row.label] += value;
        reportTotal += value;
      });
    });

    // Track period totals
    const periodKey = report.periodDay
      ? `${report.periodDay}/${report.periodMonth}`
      : `${MONTHS[report.periodMonth - 1]}`;
    periodTotals[periodKey] = (periodTotals[periodKey] || 0) + reportTotal;
  });

  const chartData = schema.rows.map((row) => ({
    name: row.label,
    value: totals[row.label],
  }));

  const trendData = Object.entries(periodTotals).map(([period, total]) => ({
    period,
    total,
  }));

  return {
    chartData,
    trendData,
    labels: schema.rows.map((r) => r.label),
  };
}
