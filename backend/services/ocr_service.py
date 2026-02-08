import json
import re
import uuid

import anthropic

from config import settings
from models.receipt import AccountingCategory, ReceiptResult
from utils.image_utils import prepare_image_base64

EXTRACTION_PROMPT = """この画像は日本の領収書です。以下の情報をJSON形式で抽出してください。

注意事項:
- 「様」の前に書かれている名前は宛名であり、会社名・店名ではありません
- 会社名・店名は領収書の発行元（下部や印鑑の近く）を確認してください
- 金額は税込み総額を抽出してください
- 手書きの領収書にも対応してください
- 日付は注文確定日または商品購入日をYYYY-MM-DD形式に変換してください。発行日や印刷日ではなく、実際に注文・購入した日付を優先してください
- 品目・但し書きがない場合はnullとしてください

出力JSON形式:
{
  "company_name": "会社名・店名 または null",
  "amount": 税込金額(整数) または null,
  "tax_amount": 消費税額(整数) または null,
  "date": "YYYY-MM-DD" または null,
  "description": "品目・但し書き または null",
  "confidence": 0.0〜1.0の信頼度
}

JSONのみを出力してください。"""

CATEGORY_PROMPT_TEMPLATE = """以下の領収書情報から、最適な勘定科目を1つ選んでください。

領収書情報:
- 会社名: {company_name}
- 金額: {amount}円
- 品目: {description}

勘定科目の選択肢:
交通費, 消耗品費, 接待交際費, 通信費, 地代家賃, 水道光熱費, 新聞図書費, 広告宣伝費, 保険料, 修繕費, 租税公課, 外注費, 福利厚生費, 事務用品費, 旅費交通費, 会議費, 雑費

出力JSON形式:
{{"category": "勘定科目名", "reason": "分類理由"}}

JSONのみを出力してください。"""


def _extract_json(text: str) -> dict:
    """Extract JSON from text that may contain markdown code blocks."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:]  # Remove opening ```json or ```
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)
    return json.loads(text)


def is_multi_receipt_pdf(file_name: str) -> bool:
    """Check if the file is a PDF that likely contains multiple receipts.
    Pattern: '2025-mm-dd hh.mm.ss.pdf'
    """
    return bool(re.match(r"\d{4}-\d{2}-\d{2} \d{2}\.\d{2}\.\d{2}\.pdf$", file_name))


async def _classify_category(client: anthropic.Anthropic, extracted: dict) -> tuple[AccountingCategory | None, str | None]:
    """Classify receipt into accounting category."""
    if not extracted.get("company_name") and not extracted.get("description"):
        return None, None

    category_prompt = CATEGORY_PROMPT_TEMPLATE.format(
        company_name=extracted.get("company_name") or "不明",
        amount=extracted.get("amount") or "不明",
        description=extracted.get("description") or "不明",
    )

    category_response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=256,
        messages=[{"role": "user", "content": category_prompt}],
    )

    cat_data = _extract_json(category_response.content[0].text)
    try:
        category = AccountingCategory(cat_data["category"])
    except (ValueError, KeyError):
        category = AccountingCategory.MISCELLANEOUS
    return category, cat_data.get("reason")


async def process_receipt(image_data: list[tuple[str, str]], file_name: str, file_path: str) -> ReceiptResult:
    """Process a single receipt image through extraction and classification."""
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    content = []
    for b64_data, media_type in image_data:
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": media_type,
                "data": b64_data,
            },
        })
    content.append({"type": "text", "text": EXTRACTION_PROMPT})

    extraction_response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": content}],
    )

    extracted = _extract_json(extraction_response.content[0].text)
    category, category_reason = await _classify_category(client, extracted)

    return ReceiptResult(
        id=str(uuid.uuid4()),
        file_name=file_name,
        file_path=file_path,
        company_name=extracted.get("company_name"),
        amount=extracted.get("amount"),
        tax_amount=extracted.get("tax_amount"),
        date=extracted.get("date"),
        description=extracted.get("description"),
        category=category,
        category_reason=category_reason,
        confidence=extracted.get("confidence"),
    )


async def process_multi_receipt_pdf(image_pages: list[tuple[str, str]], file_name: str, file_path: str) -> list[ReceiptResult]:
    """Process a PDF with multiple receipts, one per page."""
    results: list[ReceiptResult] = []
    for i, (b64_data, media_type) in enumerate(image_pages):
        page_label = f"{file_name} (p{i + 1})"
        result = await process_receipt([(b64_data, media_type)], page_label, file_path)
        results.append(result)
    return results
