import base64
import hashlib
import secrets

import dropbox
from dropbox.files import FileMetadata, FolderMetadata

from config import settings
from models.dropbox_models import DropboxFile

# PKCE state storage (in-production, use Redis or DB)
_pkce_store: dict[str, str] = {}


def generate_auth_url() -> tuple[str, str]:
    """Generate Dropbox OAuth2 authorization URL with PKCE."""
    code_verifier = secrets.token_urlsafe(64)
    code_challenge = (
        base64.urlsafe_b64encode(hashlib.sha256(code_verifier.encode()).digest())
        .rstrip(b"=")
        .decode()
    )
    state = secrets.token_urlsafe(32)

    auth_url = (
        f"https://www.dropbox.com/oauth2/authorize"
        f"?client_id={settings.dropbox_app_key}"
        f"&response_type=code"
        f"&redirect_uri={settings.dropbox_redirect_uri}"
        f"&state={state}"
        f"&code_challenge={code_challenge}"
        f"&code_challenge_method=S256"
        f"&token_access_type=online"
    )

    _pkce_store[state] = code_verifier
    return auth_url, state


def exchange_code_for_token(code: str, state: str) -> str:
    """Exchange authorization code for access token."""
    code_verifier = _pkce_store.pop(state, None)
    if not code_verifier:
        raise ValueError("Invalid or expired state parameter")

    import requests

    resp = requests.post(
        "https://api.dropboxapi.com/oauth2/token",
        data={
            "code": code,
            "grant_type": "authorization_code",
            "client_id": settings.dropbox_app_key,
            "client_secret": settings.dropbox_app_secret,
            "redirect_uri": settings.dropbox_redirect_uri,
            "code_verifier": code_verifier,
        },
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def list_files(access_token: str, path: str) -> list[DropboxFile]:
    """List image files in a Dropbox folder."""
    dbx = dropbox.Dropbox(access_token)
    # Dropbox API requires "" for root, not "/"
    if path == "/" or not path:
        path = ""
    result = dbx.files_list_folder(path)

    files: list[DropboxFile] = []
    image_extensions = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".pdf"}

    for entry in result.entries:
        if isinstance(entry, FolderMetadata):
            files.append(
                DropboxFile(
                    name=entry.name,
                    path=entry.path_display or entry.path_lower or "",
                    size=0,
                    is_folder=True,
                )
            )
        elif isinstance(entry, FileMetadata):
            ext = "." + entry.name.rsplit(".", 1)[-1].lower() if "." in entry.name else ""
            if ext in image_extensions:
                files.append(
                    DropboxFile(
                        name=entry.name,
                        path=entry.path_display or entry.path_lower or "",
                        size=entry.size,
                        is_folder=False,
                    )
                )
    return files


def download_file(access_token: str, file_path: str) -> tuple[bytes, str]:
    """Download a file from Dropbox. Returns (file_bytes, file_name)."""
    dbx = dropbox.Dropbox(access_token)
    metadata, response = dbx.files_download(file_path)
    return response.content, metadata.name
