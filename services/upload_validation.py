from fastapi import UploadFile

from config.upload_config import (
    ALLOWED_IMAGE_CONTENT_TYPES,
    MAX_UPLOAD_SIZE_BYTES,
    UPLOAD_READ_CHUNK_SIZE_BYTES,
)


class UnsupportedImageContentTypeError(ValueError):
    """เกิดขึ้นเมื่อ MIME type ของไฟล์ไม่ได้รับอนุญาต."""


class UploadTooLargeError(ValueError):
    """เกิดขึ้นเมื่อไฟล์มีขนาดใหญ่เกินกำหนด."""


class EmptyUploadError(ValueError):
    """เกิดขึ้นเมื่อไฟล์ที่ Upload ไม่มีข้อมูล."""


def get_safe_filename(file: UploadFile) -> str:
    """
    คืนชื่อไฟล์อย่างเดียว โดยตัด path ที่อาจติดมากับชื่อไฟล์ออก

    ตัวอย่าง:
    C:\\Users\\test\\image.jpg
    จะเหลือ:
    image.jpg
    """

    filename = file.filename or "uploaded-image"

    normalized_filename = filename.replace(
        "\\",
        "/",
    )

    safe_filename = normalized_filename.rsplit(
        "/",
        maxsplit=1,
    )[-1]

    return safe_filename or "uploaded-image"


def validate_content_type(
    file: UploadFile,
) -> None:
    """
    ตรวจ MIME type ที่ Client ส่งมา

    การตรวจนี้เป็นเพียงชั้นแรก
    ยังต้องตรวจข้อมูลไฟล์จริงด้วย Pillow อีกครั้ง
    """

    content_type = (
        file.content_type or ""
    ).lower()

    if (
        content_type
        not in ALLOWED_IMAGE_CONTENT_TYPES
    ):
        allowed_types = ", ".join(
            sorted(
                ALLOWED_IMAGE_CONTENT_TYPES
            )
        )

        raise UnsupportedImageContentTypeError(
            "Unsupported image content type: "
            f"'{content_type or 'unknown'}'. "
            f"Allowed types: {allowed_types}"
        )


async def read_upload_bytes(
    file: UploadFile,
) -> bytes:
    """
    ตรวจและอ่าน UploadFile แบบแบ่งเป็น Chunk

    ไม่ใช้ await file.read() ครั้งเดียว
    เพราะต้องการหยุดทันทีเมื่อพบว่าไฟล์ใหญ่เกินกำหนด
    """

    validate_content_type(file)

    # ตรวจจากค่า size ที่ Starlette คำนวณไว้ก่อน
    if (
        file.size is not None
        and file.size > MAX_UPLOAD_SIZE_BYTES
    ):
        raise UploadTooLargeError(
            "Uploaded image exceeds "
            "the 10 MB size limit"
        )

    chunks: list[bytes] = []
    total_size = 0

    while True:
        chunk = await file.read(
            UPLOAD_READ_CHUNK_SIZE_BYTES
        )

        if not chunk:
            break

        total_size += len(chunk)

        if (
            total_size
            > MAX_UPLOAD_SIZE_BYTES
        ):
            raise UploadTooLargeError(
                "Uploaded image exceeds "
                "the 10 MB size limit"
            )

        chunks.append(chunk)

    if total_size == 0:
        raise EmptyUploadError(
            "Uploaded image is empty"
        )

    return b"".join(chunks)