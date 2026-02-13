// ============================================
// Template Types and Schemas
// ============================================

export type TemplateType = "simple_list" | "matrix";
export type FieldType = "number" | "text" | "select";
export type PeriodType = "daily" | "monthly";

// Simple List Template
export interface SimpleListTemplateSchema {
  type: "simple_list";
  title: string;
  description?: string;
  valueColumns: {
    id: string;
    label: string;
    fieldType: FieldType;
    options?: string[]; // for select type
  }[];
  rows: {
    id: string;
    label: string;
  }[];
}

// Matrix/Grid Template
export interface MatrixTemplateSchema {
  type: "matrix";
  title: string;
  description?: string;
  columns: ColumnDefinition[];
  rows: {
    id: string;
    label: string;
    note?: string;
  }[];
  notes?: string[];
}

export type ColumnDefinition = 
  | { 
      type: "field";
      id: string;
      label: string;
      fieldType: FieldType;
      options?: string[];
    }
  | {
      type: "group";
      id: string;
      label: string;
      children: ColumnDefinition[];
    };

export type TemplateSchema = SimpleListTemplateSchema | MatrixTemplateSchema;

// ============================================
// Default Templates from Images
// ============================================

export const defaultRadiologiTemplate: SimpleListTemplateSchema = {
  type: "simple_list",
  title: "LAPORAN SIRS RADIOLOGI",
  valueColumns: [
    { id: "jumlah", label: "JUMLAH", fieldType: "number" }
  ],
  rows: [
    { id: "1", label: "Foto Tanpa Bahan Kontras" },
    { id: "2", label: "Foto dengan Bahan Kontras" },
    { id: "3", label: "Foto dengan rol film" },
    { id: "4", label: "Flouroskopi" },
    { id: "5", label: "Foto Gigi" },
    { id: "6", label: "C.T. Scan" },
    { id: "7", label: "Lymphografi" },
    { id: "8", label: "Angiografi" },
    { id: "9", label: "Lain-Lain" },
    { id: "10", label: "Radioterapi dengan Linac" },
    { id: "11", label: "Radioterapi dengan Cobalt" },
    { id: "12", label: "Radioterapi dengan Brakhiterapi" },
    { id: "13", label: "Lain-Lain" },
    { id: "14", label: "Diagnostik" },
    { id: "15", label: "Therapi" },
    { id: "16", label: "Lain-Lain" },
    { id: "17", label: "USG" },
    { id: "18", label: "MRI" },
  ]
};

export const defaultRawatInapTemplate: MatrixTemplateSchema = {
  type: "matrix",
  title: "LAPORAN SIRS RAWAT INAP",
  columns: [
    { type: "field", id: "pasien_awal", label: "PASIEN AWAL BULAN", fieldType: "number" },
    { type: "field", id: "pasien_masuk", label: "PASIEN MASUK", fieldType: "number" },
    { type: "field", id: "pasien_pindahan", label: "PASIEN PINDAHAN", fieldType: "number" },
    { type: "field", id: "pasien_dipindahkan", label: "PASIEN DIPINDAHKAN", fieldType: "number" },
    { type: "field", id: "pasien_keluar_hidup", label: "PASIEN KELUAR HIDUP", fieldType: "number" },
    {
      type: "group",
      id: "pasien_keluar_mati",
      label: "PASIEN KELUAR MATI",
      children: [
        {
          type: "group",
          id: "kurang_48",
          label: "<48 JAM",
          children: [
            { type: "field", id: "mati_kurang_48_p", label: "P", fieldType: "number" },
            { type: "field", id: "mati_kurang_48_l", label: "L", fieldType: "number" }
          ]
        },
        {
          type: "group",
          id: "lebih_48",
          label: ">=48 JAM",
          children: [
            { type: "field", id: "mati_lebih_48_p", label: "P", fieldType: "number" },
            { type: "field", id: "mati_lebih_48_l", label: "L", fieldType: "number" }
          ]
        }
      ]
    },
    { type: "field", id: "jumlah_lama_dirawat", label: "JUMLAH LAMA DIRAWAT", fieldType: "number" },
    { type: "field", id: "pasien_akhir_bulan", label: "PASIEN AKHIR BULAN", fieldType: "number" },
    { type: "field", id: "jumlah_hari_perawatan", label: "JUMLAH HARI PERAWATAN", fieldType: "number" },
    {
      type: "group",
      id: "rincian_hari",
      label: "RINCIAN HARI PERAWATAN PER KELAS",
      children: [
        { type: "field", id: "hari_vvip", label: "VVIP", fieldType: "number" },
        { type: "field", id: "hari_vip", label: "VIP", fieldType: "number" },
        { type: "field", id: "hari_kelas_1", label: "1", fieldType: "number" },
        { type: "field", id: "hari_kelas_2", label: "2", fieldType: "number" },
        { type: "field", id: "hari_kelas_3", label: "3", fieldType: "number" },
        { type: "field", id: "hari_khusus", label: "KHUSUS", fieldType: "number" }
      ]
    },
    { type: "field", id: "alokasi_tt_awal", label: "JUMLAH ALOKASI TT AWAL BULAN", fieldType: "number" }
  ],
  rows: [
    { id: "1", label: "PENYAKIT DALAM" },
    { id: "2", label: "KESEHATAN ANAK" },
    { id: "3", label: "OBSTETRI", note: "Berfokus pada Kehamilan, Persalinan, dan Masa Nifas (Pasca persalinan)" },
    { id: "4", label: "GINEKOLOGI", note: "Berfokus pada kesehatan Organ Reproduksi Wanita Secara Umum." },
    { id: "5", label: "BEDAH" },
    { id: "6", label: "KARDIOLOGI (Jantung)" },
    { id: "7", label: "PARU-PARU" },
    { id: "8", label: "KANKER" },
    { id: "9", label: "URONEFROLOGI (Ginjal)" },
    { id: "10", label: "ISOLASI" },
    { id: "11", label: "ICU" },
    { id: "12", label: "NICU" },
    { id: "13", label: "PICU" },
    { id: "14", label: "PERINATOLOGI" }
  ],
  notes: [
    "OBSTETRI: Berfokus pada Kehamilan, Persalinan, dan Masa Nifas (Pasca persalinan)",
    "GINEKOLOGI: Berfokus pada kesehatan Organ Reproduksi Wanita Secara Umum."
  ]
};

// ============================================
// Utility Functions
// ============================================

export function getAllFieldIds(columns: ColumnDefinition[]): string[] {
  const ids: string[] = [];
  
  for (const col of columns) {
    if (col.type === "field") {
      ids.push(col.id);
    } else if (col.type === "group") {
      ids.push(...getAllFieldIds(col.children));
    }
  }
  
  return ids;
}

export function flattenColumns(columns: ColumnDefinition[]): Array<{ id: string; label: string; depth: number }> {
  const result: Array<{ id: string; label: string; depth: number }> = [];
  
  for (const col of columns) {
    if (col.type === "field") {
      result.push({ id: col.id, label: col.label, depth: 0 });
    } else if (col.type === "group") {
      const children = flattenColumns(col.children);
      result.push({ id: col.id, label: col.label, depth: 0 });
      children.forEach(child => result.push({ ...child, depth: child.depth + 1 }));
    }
  }
  
  return result;
}

export function getColumnDepth(columns: ColumnDefinition[]): number {
  let maxDepth = 1;
  
  for (const col of columns) {
    if (col.type === "group") {
      const childDepth = getColumnDepth(col.children);
      maxDepth = Math.max(maxDepth, childDepth + 1);
    }
  }
  
  return maxDepth;
}

export function getLeafColumns(columns: ColumnDefinition[]): Array<{ id: string; label: string }> {
  const result: Array<{ id: string; label: string }> = [];
  
  for (const col of columns) {
    if (col.type === "field") {
      result.push({ id: col.id, label: col.label });
    } else if (col.type === "group") {
      result.push(...getLeafColumns(col.children));
    }
  }
  
  return result;
}
