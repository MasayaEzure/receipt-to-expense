import csv
import io

from models.receipt import ReceiptResult


def generate_csv(results: list[ReceiptResult]) -> bytes:
    """Generate CSV content encoded in CP932 (Shift-JIS) for Japanese Excel compatibility."""
    output = io.StringIO()
    writer = csv.writer(output)

    # Header row
    writer.writerow([
        "No.",
        "ファイル名",
        "日付",
        "会社名・店名",
        "品目・但し書き",
        "金額（税込）",
        "消費税額",
        "勘定科目",
        "分類理由",
        "信頼度",
        "手動修正",
    ])

    for i, r in enumerate(results, 1):
        writer.writerow([
            i,
            r.file_name,
            r.date or "",
            r.company_name or "",
            r.description or "",
            r.amount or "",
            r.tax_amount or "",
            r.category.value if r.category else "",
            r.category_reason or "",
            f"{r.confidence:.0%}" if r.confidence is not None else "",
            "○" if r.is_manually_edited else "",
        ])

    # Category summary section
    writer.writerow([])
    writer.writerow(["勘定科目別集計"])
    writer.writerow(["勘定科目", "件数", "合計金額"])

    category_totals: dict[str, tuple[int, int]] = {}
    for r in results:
        if r.category and r.amount is not None:
            cat = r.category.value
            count, total = category_totals.get(cat, (0, 0))
            category_totals[cat] = (count + 1, total + r.amount)

    grand_total = 0
    for cat, (count, total) in sorted(category_totals.items()):
        writer.writerow([cat, count, total])
        grand_total += total

    writer.writerow(["合計", "", grand_total])

    return output.getvalue().encode("cp932", errors="replace")
