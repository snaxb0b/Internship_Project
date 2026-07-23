from io import BytesIO
from pathlib import Path
from typing import Any
from uuid import uuid4
import warnings

import numpy as np
import torch
from PIL import (
    Image,
    ImageDraw,
    ImageFont,
    UnidentifiedImageError,
)
from ultralytics import RTDETR

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


_MODEL_CACHE: dict[str, RTDETR] = {}

# Cache สำหรับ SAHI detection model (แยกจาก RTDETR ปกติ)
_SAHI_MODEL_CACHE: dict[str, Any] = {}


# โหลด SAHI แบบ optional เพื่อให้ระบบยังทำงานได้
# แม้เครื่องยังไม่ได้ติดตั้ง sahi
try:
    from sahi import AutoDetectionModel
    from sahi.predict import get_sliced_prediction

    _SAHI_AVAILABLE = True
    _SAHI_IMPORT_ERROR = ""
except Exception as _sahi_import_error:  # pragma: no cover
    AutoDetectionModel = None
    get_sliced_prediction = None
    _SAHI_AVAILABLE = False
    _SAHI_IMPORT_ERROR = str(_sahi_import_error)


# ค่าพารามิเตอร์การแบ่งภาพของ SAHI
SAHI_SLICE_SIZE = 512
SAHI_OVERLAP_RATIO = 0.2


class ModelLoadError(RuntimeError):
    """เกิดขึ้นเมื่อโหลด RT-DETR model ไม่สำเร็จ."""


class InvalidImageError(ValueError):
    """เกิดขึ้นเมื่อข้อมูลไม่ใช่รูปที่ระบบรองรับ."""


class SahiUnavailableError(RuntimeError):
    """เกิดขึ้นเมื่อร้องขอ SAHI แต่ระบบใช้ SAHI ไม่ได้."""


def get_device() -> int | str:
    if torch.cuda.is_available():
        return 0

    return "cpu"


def load_model(model_id: str) -> RTDETR:
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
        model = RTDETR(
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


# ชุดสีสำหรับกล่อง/ป้ายกำกับแต่ละคลาส (RGB)
_BOX_PALETTE: tuple[tuple[int, int, int], ...] = (
    (37, 136, 255),
    (22, 133, 91),
    (222, 90, 130),
    (245, 158, 11),
    (139, 92, 246),
    (14, 165, 183),
    (234, 88, 12),
    (99, 102, 241),
    (16, 185, 129),
    (219, 39, 119),
    (59, 130, 246),
    (168, 85, 247),
)


def _load_font(
    size: int,
) -> ImageFont.ImageFont:
    """
    โหลดฟอนต์ TrueType สำหรับป้ายกำกับ

    ลองหลายชื่อ/พาธเพื่อรองรับหลาย OS
    ถ้าหาไม่เจอจะใช้ฟอนต์เริ่มต้นของ PIL
    """
    for candidate in (
        "arial.ttf",
        "DejaVuSans.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ):
        try:
            return ImageFont.truetype(
                candidate,
                size,
            )

        except OSError:
            continue

    return ImageFont.load_default()


def render_annotated_image(
    *,
    image_array: np.ndarray,
    detections: list[dict[str, Any]],
) -> Image.Image:
    """
    วาดกล่อง/คลาส/ค่าความมั่นใจ ทับลงบน
    ภาพต้นฉบับโดยตรง

    ภาพผลลัพธ์จึงมีความละเอียดและสีตรงกับ
    ภาพต้นฉบับทุกประการ (RGB, ไม่ย่อ/ขยาย/
    ครอป/สลับ channel) มีเพียงกล่องและป้าย
    กำกับที่ถูกวาดเพิ่มเท่านั้น
    """
    image = Image.fromarray(
        image_array,
        mode="RGB",
    )

    draw = ImageDraw.Draw(image)

    height, width = image_array.shape[:2]

    line_width = max(
        2,
        round(min(width, height) / 320),
    )

    font = _load_font(
        max(13, round(min(width, height) / 45))
    )

    padding = max(2, line_width)

    for detection in detections:
        box = detection["bounding_box"]

        x1 = float(box["x1"])
        y1 = float(box["y1"])
        x2 = float(box["x2"])
        y2 = float(box["y2"])

        color = _BOX_PALETTE[
            detection["class_id"]
            % len(_BOX_PALETTE)
        ]

        draw.rectangle(
            (x1, y1, x2, y2),
            outline=color,
            width=line_width,
        )

        label = (
            f"{detection['class_name']} "
            f"{detection['confidence'] * 100:.0f}%"
        )

        text_box = draw.textbbox(
            (0, 0),
            label,
            font=font,
        )

        text_width = text_box[2] - text_box[0]
        text_height = text_box[3] - text_box[1]

        label_height = (
            text_height + 2 * padding
        )

        # วางป้ายไว้เหนือกล่อง ถ้าชนขอบบนให้ย้ายลงมาในกล่อง
        label_top = y1 - label_height
        label_bottom = y1

        if label_top < 0:
            label_top = y1
            label_bottom = y1 + label_height

        label_left = x1
        label_right = (
            x1 + text_width + 2 * padding
        )

        if label_right > width:
            label_right = width
            label_left = (
                width
                - (text_width + 2 * padding)
            )

        draw.rectangle(
            (
                label_left,
                label_top,
                label_right,
                label_bottom,
            ),
            fill=color,
        )

        luminance = (
            0.299 * color[0]
            + 0.587 * color[1]
            + 0.114 * color[2]
        )

        text_color = (
            (17, 24, 39)
            if luminance > 150
            else (255, 255, 255)
        )

        draw.text(
            (
                label_left + padding,
                label_top + padding
                - text_box[1],
            ),
            label,
            fill=text_color,
            font=font,
        )

    return image


def _persist_png_image(
    *,
    image: Image.Image,
    result_filename: str,
) -> str:
    """
    บันทึกภาพเป็น PNG (lossless) เพื่อคงความ
    ละเอียดและสีของภาพต้นฉบับไว้ครบถ้วน
    """
    result_path = (
        RESULTS_DIR / result_filename
    )

    print(
        f"[RESULT] Saving image: "
        f"{result_path}"
    )

    try:
        image.save(
            str(result_path),
            format="PNG",
        )

    except Exception as error:
        raise RuntimeError(
            "Cannot save result image: "
            f"{error}"
        ) from error

    if not result_path.exists():
        raise RuntimeError(
            "Result image was not created: "
            f"{result_path}"
        )

    return result_filename


def save_annotated_image(
    *,
    image: Image.Image,
    model_id: str,
) -> str:
    return _persist_png_image(
        image=image,
        result_filename=(
            f"{model_id}_{uuid4().hex}.png"
        ),
    )


def save_original_image(
    *,
    image: Image.Image,
    model_id: str,
) -> str:
    """
    บันทึกภาพต้นฉบับ (ยังไม่วาดกล่อง) แยกอีกไฟล์

    Frontend ใช้ภาพนี้เป็นฐานในการวาดกรอบ
    ที่ผู้ใช้เลือกกรองเอง โดยไม่ต้องรัน
    inference ใหม่ และคงสี/ความละเอียดเดิม
    """
    return _persist_png_image(
        image=image,
        result_filename=(
            f"{model_id}_original_"
            f"{uuid4().hex}.png"
        ),
    )


def load_sahi_model(
    *,
    model_id: str,
    device_name: str,
):
    """โหลด (และ cache) SAHI detection model สำหรับ model_id."""
    if not _SAHI_AVAILABLE:
        raise SahiUnavailableError(
            "SAHI is not available on the server. "
            f"{_SAHI_IMPORT_ERROR}".strip()
        )

    if model_id in _SAHI_MODEL_CACHE:
        return _SAHI_MODEL_CACHE[model_id]

    model_config = get_model_config(model_id)

    weight_path = Path(
        model_config["weight_path"]
    )

    if not weight_path.exists():
        raise FileNotFoundError(
            f"Weight file not found: "
            f"{weight_path}"
        )

    print(
        f"[SAHI] Loading SAHI model: "
        f"{model_id}"
    )

    try:
        model = AutoDetectionModel.from_pretrained(
            model_type="ultralytics",
            model_path=str(weight_path),
            confidence_threshold=0.25,
            device=device_name,
        )

    except Exception as error:
        raise ModelLoadError(
            f"Cannot load SAHI model "
            f"'{model_id}': {error}"
        ) from error

    _SAHI_MODEL_CACHE[model_id] = model

    return model


def _detections_from_boxes(
    result,
) -> list[dict[str, Any]]:
    """แปลงผลลัพธ์ RTDETR (result.boxes) เป็นรูปแบบมาตรฐาน."""
    detections: list[dict[str, Any]] = []

    if result.boxes is None:
        return detections

    for box in result.boxes:
        class_id = int(box.cls[0].item())

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
                    confidence_score, 4
                ),
                "bounding_box": {
                    "x1": round(x1, 2),
                    "y1": round(y1, 2),
                    "x2": round(x2, 2),
                    "y2": round(y2, 2),
                },
            }
        )

    return detections


def _detections_from_sahi(
    object_prediction_list,
) -> list[dict[str, Any]]:
    """แปลงผลลัพธ์ SAHI เป็นรูปแบบมาตรฐานเดียวกัน."""
    detections: list[dict[str, Any]] = []

    for prediction in object_prediction_list:
        box = prediction.bbox

        detections.append(
            {
                "class_id": int(
                    prediction.category.id
                ),
                "class_name": str(
                    prediction.category.name
                ),
                "confidence": round(
                    float(
                        prediction.score.value
                    ),
                    4,
                ),
                "bounding_box": {
                    "x1": round(
                        float(box.minx), 2
                    ),
                    "y1": round(
                        float(box.miny), 2
                    ),
                    "x2": round(
                        float(box.maxx), 2
                    ),
                    "y2": round(
                        float(box.maxy), 2
                    ),
                },
            }
        )

    return detections


def predict_standard(
    *,
    model_id: str,
    image_array: np.ndarray,
    confidence: float,
    device: int | str,
) -> list[dict[str, Any]]:
    """RT-DETR inference ปกติ (ทั้งภาพในครั้งเดียว)."""
    model = load_model(model_id)

    # Ultralytics ถือว่า np.ndarray ที่รับเข้ามาเป็น BGR
    # แล้วจะสลับเป็น RGB ให้โมเดลเอง (im[..., ::-1])
    # image_array ของเราเป็น RGB จึงต้องส่งเป็น BGR เข้าไป
    # เพื่อให้โมเดลเห็นสี RGB ที่ถูกต้อง (ผลตรวจจับแม่นยำขึ้น)
    bgr_image = np.ascontiguousarray(
        image_array[:, :, ::-1]
    )

    try:
        results = model.predict(
            source=bgr_image,
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
            "RT-DETR returned no prediction result"
        )

    return _detections_from_boxes(results[0])


def predict_with_sahi(
    *,
    model_id: str,
    image_array: np.ndarray,
    confidence: float,
    device_name: str,
) -> list[dict[str, Any]]:
    """RT-DETR inference แบบแบ่งภาพ (sliced) ด้วย SAHI."""
    model = load_sahi_model(
        model_id=model_id,
        device_name=device_name,
    )

    # ตั้ง confidence threshold ตามคำขอปัจจุบัน
    model.confidence_threshold = confidence

    # SAHI รับภาพ RGB (PIL) ได้โดยตรง
    image = Image.fromarray(
        image_array,
        mode="RGB",
    )

    try:
        result = get_sliced_prediction(
            image,
            model,
            slice_height=SAHI_SLICE_SIZE,
            slice_width=SAHI_SLICE_SIZE,
            overlap_height_ratio=(
                SAHI_OVERLAP_RATIO
            ),
            overlap_width_ratio=(
                SAHI_OVERLAP_RATIO
            ),
            verbose=0,
        )

    except Exception as error:
        raise RuntimeError(
            f"SAHI sliced inference failed: "
            f"{error}"
        ) from error

    return _detections_from_sahi(
        result.object_prediction_list
    )


def predict_image(
    *,
    model_id: str,
    image_bytes: bytes,
    confidence: float = 0.25,
    use_sahi: bool = False,
) -> dict[str, Any]:
    if not 0.0 <= confidence <= 1.0:
        raise ValueError(
            "Confidence must be between 0 and 1"
        )

    # ตรวจรูปก่อนโหลดโมเดลเข้า RAM/GPU
    image_array = decode_image(
        image_bytes
    )

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
        f"[PREDICT] SAHI: {use_sahi}"
    )

    print(
        f"[PREDICT] Image shape: "
        f"{image_array.shape}"
    )

    if use_sahi:
        detections = predict_with_sahi(
            model_id=model_id,
            image_array=image_array,
            confidence=confidence,
            device_name=device_name,
        )
    else:
        detections = predict_standard(
            model_id=model_id,
            image_array=image_array,
            confidence=confidence,
            device=device,
        )

    image_height, image_width = (
        image_array.shape[:2]
    )

    annotated_image = render_annotated_image(
        image_array=image_array,
        detections=detections,
    )

    result_image_filename = (
        save_annotated_image(
            image=annotated_image,
            model_id=model_id,
        )
    )

    # เก็บภาพต้นฉบับ (ไม่มีกล่อง) ไว้ให้ Frontend
    # ใช้วาดกรอบเฉพาะคลาสที่ผู้ใช้เลือก โดยไม่
    # ต้อง inference ใหม่ (คงสี/ความละเอียดเดิม)
    original_image = Image.fromarray(
        image_array,
        mode="RGB",
    )

    original_image_filename = (
        save_original_image(
            image=original_image,
            model_id=model_id,
        )
    )

    return {
        "model_id": model_id,
        "device": device_name,
        "used_sahi": use_sahi,
        "image_width": image_width,
        "image_height": image_height,
        "confidence_threshold": confidence,
        "object_count": len(detections),
        "detections": detections,
        "result_image_filename": (
            result_image_filename
        ),
        "original_image_filename": (
            original_image_filename
        ),
    }