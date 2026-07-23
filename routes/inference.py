from fastapi import (
    APIRouter,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
    status,
)

from config.model_registry import (
    get_available_models,
    get_model_config,
)

from services.upload_validation import (
    EmptyUploadError,
    UnsupportedImageContentTypeError,
    UploadTooLargeError,
    get_safe_filename,
    read_upload_bytes,
)

from services.yolo_service import (
    InvalidImageError,
    ModelLoadError,
    SahiUnavailableError,
    predict_image,
)


router = APIRouter(
    prefix="/api",
    tags=["RT-DETR Inference"],
)


@router.get("/models")
def list_available_models() -> dict:
    return {
        "models": get_available_models()
    }


@router.post("/predict")
async def predict_uploaded_image(
    request: Request,
    model_id: str = Form(...),
    confidence: float = Form(0.25),
    use_sahi: bool = Form(False),
    file: UploadFile = File(...),
) -> dict:
    model_id = model_id.strip()

    if not model_id:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail="model_id must not be empty",
        )

    if not 0.0 <= confidence <= 1.0:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "confidence must be "
                "between 0 and 1"
            ),
        )

    try:
        get_model_config(model_id)

    except ValueError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=str(error),
        ) from error

    safe_filename = get_safe_filename(
        file
    )

    try:
        image_bytes = await read_upload_bytes(
            file
        )

    except UnsupportedImageContentTypeError as error:
        raise HTTPException(
            status_code=(
                status
                .HTTP_415_UNSUPPORTED_MEDIA_TYPE
            ),
            detail=str(error),
        ) from error

    except UploadTooLargeError as error:
        raise HTTPException(
            status_code=(
                status
                .HTTP_413_CONTENT_TOO_LARGE
            ),
            detail=str(error),
        ) from error

    except EmptyUploadError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=str(error),
        ) from error

    finally:
        # ปิด Temporary File ของ UploadFile
        await file.close()

    try:
        prediction_result = predict_image(
            model_id=model_id,
            image_bytes=image_bytes,
            confidence=confidence,
            use_sahi=use_sahi,
        )

    except SahiUnavailableError as error:
        raise HTTPException(
            status_code=(
                status
                .HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail=(
                "SAHI mode is not available "
                "on the server. "
                f"{error}"
            ),
        ) from error

    except InvalidImageError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=str(error),
        ) from error

    except FileNotFoundError as error:
        raise HTTPException(
            status_code=(
                status
                .HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=str(error),
        ) from error

    except ModelLoadError as error:
        raise HTTPException(
            status_code=(
                status
                .HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=str(error),
        ) from error

    except RuntimeError as error:
        raise HTTPException(
            status_code=(
                status
                .HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=str(error),
        ) from error

    result_filename = prediction_result[
        "result_image_filename"
    ]

    base_url = str(
        request.base_url
    ).rstrip("/")

    result_image_url = (
        f"{base_url}/results/"
        f"{result_filename}"
    )

    # ภาพต้นฉบับ (ไม่มีกล่อง) สำหรับให้ Frontend
    # วาดกรอบเฉพาะคลาสที่เลือกเอง
    original_filename = (
        prediction_result.get(
            "original_image_filename"
        )
    )

    original_image_url = (
        f"{base_url}/results/{original_filename}"
        if original_filename
        else None
    )

    return {
        "message": (
            "Prediction completed successfully"
        ),
        "filename": safe_filename,
        "content_type": file.content_type,
        "upload_size_bytes": len(
            image_bytes
        ),
        **prediction_result,
        "result_image_url": (
            result_image_url
        ),
        "original_image_url": (
            original_image_url
        ),
    }