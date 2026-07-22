from io import BytesIO
from pathlib import Path
from typing import Any
from uuid import uuid4
import warnings

import numpy as np
import torch
from PIL import (
    Image,
    UnidentifiedImageError,
)
from ultralytics import YOLO

from config.model_registry import (
    get_model_config,
)
from config.upload_config import (
    ALLOWED_PIL_FORMATS,
    MAX_IMAGE_PIXELS,
)


PROJECT_ROOT = (
    Path(__file__).resolve().parent.parent
)

RESULTS_DIR = PROJECT_ROOT / "results"

RESULTS_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


_MODEL_CACHE: dict[str, YOLO] = {}


class ModelLoadError(RuntimeError):
    """เกิดขึ้นเมื่อโหลด YOLO model ไม่สำเร็จ."""


class InvalidImageError(ValueError):
    """เกิดขึ้นเมื่อข้อมูลไม่ใช่รูปที่ระบบรองรับ."""


def get_device() -> int | str:
    if torch.cuda.is_available():
        return 0

    return "cpu"


def load_model(model_id: str) -> YOLO:
    if model_id in _MODEL_CACHE:
        print(
            f"[CACHE] Using loaded model: "
            f"{model_id}"
        )

        return _MODEL_CACHE[model_id]

    model_config = get_model_config(
        model_id
    )

    weight_path = Path(
        model_config["weight_path"]
    )

    if not weight_path.exists():
        raise FileNotFoundError(
            f"Weight file not found: "
            f"{weight_path}"
        )

    print(
        f"[MODEL] Loading model: "
        f"{model_id}"
    )

    print(
        f"[MODEL] Weight path: "
        f"{weight_path}"
    )

    try:
        model = YOLO(
            str(weight_path)
        )

    except Exception as error:
        raise ModelLoadError(
            f"Cannot load model "
            f"'{model_id}': {error}"
        ) from error

    _MODEL_CACHE[model_id] = model

    print(
        f"[MODEL] Model loaded successfully: "
        f"{model_id}"
    )

    return model


def decode_image(
    image_bytes: bytes,
) -> np.ndarray:
    if not image_bytes:
        raise InvalidImageError(
            "Image data is empty"
        )

    try:
        with warnings.catch_warnings():
            warnings.simplefilter(
                "error",
                Image.DecompressionBombWarning,
            )

            with Image.open(
                BytesIO(image_bytes),
                formats=list(
                    ALLOWED_PIL_FORMATS
                ),
            ) as image:
                detected_format = (
                    image.format or "UNKNOWN"
                )

                width, height = image.size

                if width <= 0 or height <= 0:
                    raise InvalidImageError(
                        "Image dimensions "
                        "must be greater than zero"
                    )

                pixel_count = width * height

                if (
                    pixel_count
                    > MAX_IMAGE_PIXELS
                ):
                    raise InvalidImageError(
                        "Image dimensions are too large. "
                        f"Maximum: "
                        f"{MAX_IMAGE_PIXELS:,} pixels. "
                        f"Received: "
                        f"{pixel_count:,} pixels"
                    )

                print(
                    f"[IMAGE] Format: "
                    f"{detected_format}"
                )

                print(
                    f"[IMAGE] Dimensions: "
                    f"{width}x{height}"
                )

                image.load()

                rgb_image = image.convert(
                    "RGB"
                )

                image_array = np.array(
                    rgb_image,
                    copy=True,
                )

    except InvalidImageError:
        raise

    except (
        Image.DecompressionBombWarning,
        Image.DecompressionBombError,
    ) as error:
        raise InvalidImageError(
            "Image is too large or may be "
            "a decompression bomb"
        ) from error

    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        SyntaxError,
    ) as error:
        raise InvalidImageError(
            "Uploaded data is not a valid "
            "JPEG, PNG, or WebP image"
        ) from error

    if (
        image_array.ndim != 3
        or image_array.shape[2] != 3
    ):
        raise InvalidImageError(
            "Decoded image must contain "
            "three RGB channels"
        )

    return image_array


def save_annotated_image(
    *,
    result: Any,
    model_id: str,
) -> str:
    unique_id = uuid4().hex

    result_filename = (
        f"{model_id}_{unique_id}.jpg"
    )

    result_path = (
        RESULTS_DIR / result_filename
    )

    print(
        f"[RESULT] Saving annotated image: "
        f"{result_path}"
    )

    try:
        result.save(
            filename=str(result_path)
        )

    except Exception as error:
        raise RuntimeError(
            "Cannot save annotated image: "
            f"{error}"
        ) from error

    if not result_path.exists():
        raise RuntimeError(
            "Annotated image was not created: "
            f"{result_path}"
        )

    return result_filename


def predict_image(
    *,
    model_id: str,
    image_bytes: bytes,
    confidence: float = 0.25,
) -> dict[str, Any]:
    if not 0.0 <= confidence <= 1.0:
        raise ValueError(
            "Confidence must be between 0 and 1"
        )

    # ตรวจรูปก่อนโหลดโมเดลเข้า RAM/GPU
    image_array = decode_image(
        image_bytes
    )

    model = load_model(model_id)

    device = get_device()

    device_name = (
        "cuda:0"
        if device == 0
        else "cpu"
    )

    print(
        f"[PREDICT] Model: {model_id}"
    )

    print(
        f"[PREDICT] Device: {device_name}"
    )

    print(
        f"[PREDICT] Image shape: "
        f"{image_array.shape}"
    )

    try:
        results = model.predict(
            source=image_array,
            conf=confidence,
            device=device,
            verbose=False,
        )

    except Exception as error:
        raise RuntimeError(
            f"Prediction failed: {error}"
        ) from error

    if not results:
        raise RuntimeError(
            "YOLO returned no prediction result"
        )

    result = results[0]

    detections: list[
        dict[str, Any]
    ] = []

    if result.boxes is not None:
        for box in result.boxes:
            class_id = int(
                box.cls[0].item()
            )

            confidence_score = float(
                box.conf[0].item()
            )

            x1, y1, x2, y2 = (
                box.xyxy[0].tolist()
            )

            class_name = result.names.get(
                class_id,
                str(class_id),
            )

            detections.append(
                {
                    "class_id": class_id,
                    "class_name": class_name,
                    "confidence": round(
                        confidence_score,
                        4,
                    ),
                    "bounding_box": {
                        "x1": round(x1, 2),
                        "y1": round(y1, 2),
                        "x2": round(x2, 2),
                        "y2": round(y2, 2),
                    },
                }
            )

    image_height, image_width = (
        image_array.shape[:2]
    )

    result_image_filename = (
        save_annotated_image(
            result=result,
            model_id=model_id,
        )
    )

    return {
        "model_id": model_id,
        "device": device_name,
        "image_width": image_width,
        "image_height": image_height,
        "confidence_threshold": confidence,
        "object_count": len(detections),
        "detections": detections,
        "result_image_filename": (
            result_image_filename
        ),
    }