export type AccountingCategory =
  | "交通費"
  | "消耗品費"
  | "接待交際費"
  | "通信費"
  | "地代家賃"
  | "水道光熱費"
  | "新聞図書費"
  | "広告宣伝費"
  | "保険料"
  | "修繕費"
  | "租税公課"
  | "外注費"
  | "福利厚生費"
  | "事務用品費"
  | "旅費交通費"
  | "会議費"
  | "雑費";

export interface ReceiptResult {
  id: string;
  file_name: string;
  file_path: string;
  company_name: string | null;
  amount: number | null;
  tax_amount: number | null;
  date: string | null;
  description: string | null;
  category: AccountingCategory | null;
  category_reason: string | null;
  confidence: number | null;
  error: string | null;
  is_manually_edited: boolean;
}

export interface CategoryTotal {
  category: AccountingCategory;
  count: number;
  total_amount: number;
}

export interface DropboxFile {
  name: string;
  path: string;
  size: number;
  is_folder: boolean;
}

export interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
}

export interface ProcessingState {
  isProcessing: boolean;
  completed: number;
  total: number;
  currentFile: string | null;
}
