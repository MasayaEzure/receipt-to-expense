from fastapi import APIRouter
from fastapi.responses import Response

from models.receipt import CsvExportRequest
from services.csv_service import generate_csv

router = APIRouter(prefix="/api/export", tags=["export"])


@router.post("/csv")
def export_csv(request: CsvExportRequest):
    csv_bytes = generate_csv(request.results)
    return Response(
        content=csv_bytes,
        media_type="text/csv; charset=shift_jis",
        headers={
            "Content-Disposition": 'attachment; filename="receipts.csv"',
        },
    )
