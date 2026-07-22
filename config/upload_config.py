# ขนาดของไฟล์รูปจริงสูงสุด: 10 MiB
MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024

# ขนาดของ HTTP Request ทั้งก้อนสูงสุด: 12 MiB
#
# ต้องมากกว่า MAX_UPLOAD_SIZE_BYTES
# เพื่อเผื่อ multipart metadata และ form fields
MAX_REQUEST_BODY_SIZE_BYTES = 12 * 1024 * 1024

# อ่านไฟล์ครั้งละ 1 MiB
UPLOAD_READ_CHUNK_SIZE_BYTES = 1024 * 1024

# จำนวนพิกเซลสูงสุดของภาพ
MAX_IMAGE_PIXELS = 25_000_000


ALLOWED_IMAGE_CONTENT_TYPES = frozenset(
    {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    }
)


ALLOWED_PIL_FORMATS = (
    "JPEG",
    "PNG",
    "WEBP",
)