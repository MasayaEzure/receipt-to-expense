import { useMemo } from "react";
import type { ReceiptResult, CategoryTotal } from "../../types";

interface Props {
  results: ReceiptResult[];
}

function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString()}`;
}

export function CategorySummary({ results }: Props) {
  const { totals, grandTotal } = useMemo(() => {
    const map = new Map<string, { count: number; total_amount: number }>();

    for (const r of results) {
      if (r.error || !r.category || r.amount === null) continue;
      const existing = map.get(r.category) || { count: 0, total_amount: 0 };
      existing.count += 1;
      existing.amount = (existing.total_amount += r.amount);
      map.set(r.category, existing);
    }

    const totals: CategoryTotal[] = Array.from(map.entries())
      .map(([category, data]) => ({
        category: category as CategoryTotal["category"],
        count: data.count,
        total_amount: data.total_amount,
      }))
      .sort((a, b) => b.total_amount - a.total_amount);

    const grandTotal = totals.reduce((sum, t) => sum + t.total_amount, 0);

    return { totals, grandTotal };
  }, [results]);

  if (totals.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-700">勘定科目別集計</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {totals.map((t) => (
          <div
            key={t.category}
            className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded text-sm"
          >
            <span className="text-gray-700">{t.category}: {t.count}件</span>
            <span className="font-medium">{formatAmount(t.total_amount)}</span>
          </div>
        ))}
      </div>
      <div className="text-right text-lg font-bold text-gray-800 pt-2 border-t border-gray-200">
        合計: {formatAmount(grandTotal)}
      </div>
    </div>
  );
}
