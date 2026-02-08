import { useState } from "react";
import { downloadCsv } from "../../api/export";
import type { ReceiptResult } from "../../types";

interface Props {
  results: ReceiptResult[];
}

export function ExportButton({ results }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadCsv(results);
    } catch (e) {
      alert("CSVエクスポートに失敗しました");
    } finally {
      setIsExporting(false);
    }
  };

  const validResults = results.filter((r) => !r.error);
  if (validResults.length === 0) return null;

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition text-sm font-medium"
    >
      {isExporting ? "エクスポート中..." : "CSVダウンロード"}
    </button>
  );
}
