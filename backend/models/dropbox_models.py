from pydantic import BaseModel


class AuthUrlResponse(BaseModel):
    auth_url: str
    state: str


class TokenRequest(BaseModel):
    code: str
    state: str


class TokenResponse(BaseModel):
    access_token: str


class DropboxFile(BaseModel):
    name: str
    path: str
    size: int
    is_folder: bool


class ListFilesRequest(BaseModel):
    path: str
    access_token: str


class ListFilesResponse(BaseModel):
    files: list[DropboxFile]


class DownloadRequest(BaseModel):
    file_path: str
    access_token: str


class DownloadResponse(BaseModel):
    file_name: str
    data_base64: str
    media_type: str
