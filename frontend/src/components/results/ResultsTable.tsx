import { useState } from "react";
import type { ReceiptResult, AccountingCategory } from "../../types";
import { ACCOUNTING_CATEGORIES } from "../../constants/categories";

interface Props {
  results: ReceiptResult[];
  onUpdate: (id: string, updates: Partial<ReceiptResult>) => void;
}

function formatAmount(amount: number | null): string {
  if (amount === null) return "-";
  return `¥${amount.toLocaleString()}`;
}

interface EditingCell {
  id: string;
  field: string;
}

export function ResultsTable({ results, onUpdate }: Props) {
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");

  if (results.length === 0) return null;

  const startEdit = (id: string, field: string, currentValue: string) => {
    setEditing({ id, field });
    setEditValue(currentValue);
  };

  const commitEdit = () => {
    if (!editing) return;
    const { id, field } = editing;
    let value: string | number | null = editValue;

    if (field === "amount" || field === "tax_amount") {
      const num = parseInt(editValue.replace(/[^0-9]/g, ""), 10);
      value = isNaN(num) ? null : num;
    }

    onUpdate(id, { [field]: value || null });
    setEditing(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setEditing(null);
  };

  const renderCell = (result: ReceiptResult, field: keyof ReceiptResult, display: string) => {
    const isEditing = editing?.id === result.id && editing?.field === field;

    if (isEditing) {
      return (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="w-full px-1 py-0.5 border border-blue-400 rounded text-sm focus:outline-none"
        />
      );
    }

    return (
      <span
        onClick={() => startEdit(result.id, field, display === "-" ? "" : display)}
        className="cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded block"
        title="クリックで編集"
      >
        {display}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b-2 border-gray-300">
            <th className="px-3 py-2 text-left w-8">#</th>
            <th className="px-3 py-2 text-left">ファイル名</th>
            <th className="px-3 py-2 text-left">日付</th>
            <th className="px-3 py-2 text-left">会社名</th>
            <th className="px-3 py-2 text-left">品目</th>
            <th className="px-3 py-2 text-right">金額</th>
            <th className="px-3 py-2 text-left">勘定科目</th>
            <th className="px-3 py-2 text-center w-12">信頼度</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr
              key={r.id}
              className={`border-b border-gray-200 ${
                r.error ? "bg-red-50" : r.is_manually_edited ? "bg-yellow-50" : "hover:bg-gray-50"
              }`}
            >
              <td className="px-3 py-2 text-gray-500">{i + 1}</td>
              <td className="px-3 py-2 text-xs truncate max-w-[120px]" title={r.file_name}>
                {r.file_name}
              </td>
              <td className="px-3 py-2">
                {r.error ? (
                  <span className="text-red-500 text-xs">{r.error}</span>
                ) : (
                  renderCell(r, "date", r.date || "-")
                )}
              </td>
              <td className="px-3 py-2">
                {renderCell(r, "company_name", r.company_name || "-")}
              </td>
              <td className="px-3 py-2">
                {renderCell(r, "description", r.description || "-")}
              </td>
              <td className="px-3 py-2 text-right">
                {renderCell(r, "amount", formatAmount(r.amount))}
              </td>
              <td className="px-3 py-2">
                <select
                  value={r.category || ""}
                  onChange={(e) =>
                    onUpdate(r.id, {
                      category: (e.target.value as AccountingCategory) || null,
                    })
                  }
                  className="text-sm border border-gray-200 rounded px-1 py-0.5 w-full bg-white"
                >
                  <option value="">未分類</option>
                  {ACCOUNTING_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2 text-center">
                {r.confidence !== null && (
                  <span
                    className={`text-xs font-medium ${
                      r.confidence >= 0.8
                        ? "text-green-600"
                        : r.confidence >= 0.5
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {Math.round(r.confidence * 100)}%
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
