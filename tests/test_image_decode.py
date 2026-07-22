from io import BytesIO

import numpy as np
import pytest
from PIL import Image

import services.yolo_service as yolo_service

from services.yolo_service import (
    InvalidImageError,
    decode_image,
)


def create_image_bytes(
    *,
    mode: str,
    size: tuple[int, int],
    image_format: str,
) -> bytes:
    image_buffer = BytesIO()

    if mode == "L":
        color = 128
    else:
        color = (255, 255, 255)

    image = Image.new(
        mode=mode,
        size=size,
        color=color,
    )

    image.save(
        image_buffer,
        format=image_format,
    )

    image.close()

    return image_buffer.getvalue()


def test_decode_rgb_png() -> None:
    image_bytes = create_image_bytes(
        mode="RGB",
        size=(20, 12),
        image_format="PNG",
    )

    image_array = decode_image(
        image_bytes
    )

    assert isinstance(
        image_array,
        np.ndarray,
    )

    assert image_array.shape == (
        12,
        20,
        3,
    )

    assert image_array.dtype == np.uint8


def test_decode_grayscale_png_to_rgb() -> None:
    """
    ภาพต้นฉบับมี Channel เดียว

    decode_image() ต้องแปลงเป็น RGB
    ก่อนส่งเข้า YOLO
    """

    image_bytes = create_image_bytes(
        mode="L",
        size=(16, 10),
        image_format="PNG",
    )

    image_array = decode_image(
        image_bytes
    )

    assert image_array.shape == (
        10,
        16,
        3,
    )


def test_decode_corrupted_image() -> None:
    with pytest.raises(
        InvalidImageError,
        match=(
            "Uploaded data is not "
            "a valid"
        ),
    ):
        decode_image(
            b"This is not image data"
        )


def test_decode_rejects_too_many_pixels(
    monkeypatch,
) -> None:
    """
    ไม่ต้องสร้างรูป 25 ล้าน Pixel จริง

    ลดค่า Limit ชั่วคราวเหลือ 4 Pixel
    แล้วสร้างภาพ 3 × 2 = 6 Pixel
    """

    monkeypatch.setattr(
        yolo_service,
        "MAX_IMAGE_PIXELS",
        4,
    )

    image_bytes = create_image_bytes(
        mode="RGB",
        size=(3, 2),
        image_format="PNG",
    )

    with pytest.raises(
        InvalidImageError,
        match=(
            "Image dimensions are too large"
        ),
    ):
        yolo_service.decode_image(
            image_bytes
        )