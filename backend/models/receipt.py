from enum import Enum

from pydantic import BaseModel


class AccountingCategory(str, Enum):
    TRANSPORTATION = "交通費"
    CONSUMABLES = "消耗品費"
    ENTERTAINMENT = "接待交際費"
    COMMUNICATION = "通信費"
    RENT = "地代家賃"
    UTILITIES = "水道光熱費"
    BOOKS = "新聞図書費"
    ADVERTISING = "広告宣伝費"
    INSURANCE = "保険料"
    REPAIRS = "修繕費"
    TAXES = "租税公課"
    OUTSOURCING = "外注費"
    WELFARE = "福利厚生費"
    OFFICE_SUPPLIES = "事務用品費"
    TRAVEL = "旅費交通費"
    MEETING = "会議費"
    MISCELLANEOUS = "雑費"


class ReceiptResult(BaseModel):
    id: str
    file_name: str
    file_path: str
    company_name: str | None = None
    amount: int | None = None
    tax_amount: int | None = None
    date: str | None = None
    description: str | None = None
    category: AccountingCategory | None = None
    category_reason: str | None = None
    confidence: float | None = None
    error: str | None = None
    is_manually_edited: bool = False


class CategoryTotal(BaseModel):
    category: AccountingCategory
    count: int
    total_amount: int


class OcrRequest(BaseModel):
    file_path: str
    access_token: str


class BatchOcrRequest(BaseModel):
    file_paths: list[str]
    access_token: str


class CsvExportRequest(BaseModel):
    results: list[ReceiptResult]
