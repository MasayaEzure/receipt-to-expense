from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import auth, dropbox_files, export, ocr

app = FastAPI(title="Receipt Scanner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dropbox_files.router)
app.include_router(ocr.router)
app.include_router(export.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
