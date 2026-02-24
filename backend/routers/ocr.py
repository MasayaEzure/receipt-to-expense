import asyncio
import json

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from models.receipt import BatchOcrRequest, OcrRequest, ReceiptResult
from services.dropbox_service import download_file
from services.ocr_service import is_multi_receipt_pdf, is_suica_statement, process_multi_receipt_pdf, process_receipt, process_suica_statement
from utils.image_utils import prepare_image_base64

router = APIRouter(prefix="/api/ocr", tags=["ocr"])


@router.post("/process", response_model=ReceiptResult)
async def process_single(request: OcrRequest):
    file_bytes, file_name = download_file(request.access_token, request.file_path)
    image_data = prepare_image_base64(file_bytes, file_name)
    result = await process_receipt(image_data, file_name, request.file_path)
    return result


@router.post("/process-batch")
async def process_batch(request: BatchOcrRequest):
    async def event_generator():
        total = len(request.file_paths)

        for i, file_path in enumerate(request.file_paths):
            file_name = file_path.rsplit("/", 1)[-1] if "/" in file_path else file_path

            yield {
                "event": "progress",
                "data": json.dumps(
                    {"completed": i, "total": total, "current_file": file_name},
                    ensure_ascii=False,
                ),
            }

            try:
                file_bytes, file_name = download_file(
                    request.access_token, file_path
                )
                image_data = prepare_image_base64(file_bytes, file_name)

                if is_suica_statement(file_name):
                    # Mobile Suica statement: extract all transactions
                    results = await process_suica_statement(image_data, file_name, file_path)
                    for result in results:
                        yield {
                            "event": "result",
                            "data": result.model_dump_json(),
                        }
                        await asyncio.sleep(0.5)
                elif is_multi_receipt_pdf(file_name):
                    # Multi-receipt PDF: process each page separately
                    results = await process_multi_receipt_pdf(image_data, file_name, file_path)
                    for result in results:
                        yield {
                            "event": "result",
                            "data": result.model_dump_json(),
                        }
                        await asyncio.sleep(0.5)
                else:
                    # Single receipt (image or single-page PDF)
                    result = await process_receipt(image_data, file_name, file_path)
                    yield {
                        "event": "result",
                        "data": result.model_dump_json(),
                    }
            except Exception as e:
                yield {
                    "event": "error",
                    "data": json.dumps(
                        {"file_name": file_name, "error": str(e)},
                        ensure_ascii=False,
                    ),
                }

            await asyncio.sleep(0.5)

        yield {
            "event": "done",
            "data": json.dumps({"total": total}),
        }

    return EventSourceResponse(event_generator())
