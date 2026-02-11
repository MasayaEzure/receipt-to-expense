from fastapi import APIRouter, HTTPException

from models.dropbox_models import AuthUrlResponse, TokenRequest, TokenResponse
from services.dropbox_service import exchange_code_for_token, generate_auth_url

router = APIRouter(prefix="/api/auth/dropbox", tags=["auth"])


@router.get("/url", response_model=AuthUrlResponse)
def get_auth_url():
    auth_url, state = generate_auth_url()
    return AuthUrlResponse(auth_url=auth_url, state=state)


@router.post("/callback", response_model=TokenResponse)
def auth_callback(request: TokenRequest):
    try:
        access_token = exchange_code_for_token(request.code, request.state)
        return TokenResponse(access_token=access_token)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token exchange failed: {e}")
