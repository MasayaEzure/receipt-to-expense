import base64
import io

from PIL import Image


def prepare_image_base64(file_bytes: bytes, file_name: str) -> list[tuple[str, str]]:
    """
    Prepare image(s) as base64 for Claude Vision API.
    For PDFs, converts each page to an image.
    Returns list of (base64_data, media_type) tuples.
    """
    ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""

    if ext == "pdf":
        return _pdf_to_images_base64(file_bytes)

    image = Image.open(io.BytesIO(file_bytes))
    image = _resize_if_needed(image)

    buffer = io.BytesIO()
    fmt = "PNG" if ext == "png" else "JPEG"
    media_type = "image/png" if ext == "png" else "image/jpeg"
    if image.mode == "RGBA" and fmt == "JPEG":
        image = image.convert("RGB")
    image.save(buffer, format=fmt, quality=85)

    return [(base64.b64encode(buffer.getvalue()).decode(), media_type)]


def _resize_if_needed(image: Image.Image, max_size: int = 1568) -> Image.Image:
    """Resize image if any dimension exceeds max_size."""
    w, h = image.size
    if w <= max_size and h <= max_size:
        return image
    ratio = min(max_size / w, max_size / h)
    new_size = (int(w * ratio), int(h * ratio))
    return image.resize(new_size, Image.LANCZOS)


def _pdf_to_images_base64(file_bytes: bytes) -> list[tuple[str, str]]:
    """Convert PDF pages to base64 images."""
    from pdf2image import convert_from_bytes

    images = convert_from_bytes(file_bytes, dpi=200)

    results: list[tuple[str, str]] = []
    for img in images:
        img = _resize_if_needed(img)
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85)
        results.append((base64.b64encode(buffer.getvalue()).decode(), "image/jpeg"))

    return results
