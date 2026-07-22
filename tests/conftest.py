from collections.abc import Generator
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from main import app


@pytest.fixture
def client() -> Generator[
    TestClient,
    None,
    None,
]:
    """
    สร้าง TestClient สำหรับเรียก FastAPI
    โดยไม่ต้องเปิด Uvicorn จริง
    """

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_png_bytes() -> bytes:
    """
    สร้าง PNG ขนาดเล็กใน Memory

    ไม่ต้องพึ่งไฟล์รูปภายนอก
    และไม่สร้างไฟล์ลง Disk
    """

    image_buffer = BytesIO()

    image = Image.new(
        mode="RGB",
        size=(32, 24),
        color=(255, 255, 255),
    )

    image.save(
        image_buffer,
        format="PNG",
    )

    image.close()

    return image_buffer.getvalue()


@pytest.fixture
def sample_jpeg_bytes() -> bytes:
    """
    สร้าง JPEG ขนาดเล็กใน Memory
    """

    image_buffer = BytesIO()

    image = Image.new(
        mode="RGB",
        size=(40, 30),
        color=(128, 128, 128),
    )

    image.save(
        image_buffer,
        format="JPEG",
    )

    image.close()

    return image_buffer.getvalue()