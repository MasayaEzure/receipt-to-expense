import base64

from fastapi import APIRouter, HTTPException

from models.dropbox_models import (
    DownloadRequest,
    DownloadResponse,
    ListFilesRequest,
    ListFilesResponse,
)
from services.dropbox_service import download_file, list_files

router = APIRouter(prefix="/api/dropbox", tags=["dropbox"])


@router.post("/list", response_model=ListFilesResponse)
def list_dropbox_files(request: ListFilesRequest):
    try:
        files = list_files(request.access_token, request.path)
        return ListFilesResponse(files=files)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/download", response_model=DownloadResponse)
def download_dropbox_file(request: DownloadRequest):
    try:
        file_bytes, file_name = download_file(request.access_token, request.file_path)
        ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
        media_type_map = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "gif": "image/gif",
            "bmp": "image/bmp",
            "tiff": "image/tiff",
            "pdf": "application/pdf",
        }
        media_type = media_type_map.get(ext, "application/octet-stream")
        return DownloadResponse(
            file_name=file_name,
            data_base64=base64.b64encode(file_bytes).decode(),
            media_type=media_type,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
