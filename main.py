from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import (
    CORSMiddleware,
)
from fastapi.staticfiles import (
    StaticFiles,
)

from config.upload_config import (
    MAX_REQUEST_BODY_SIZE_BYTES,
)
from middlewares.request_body_limit import (
    RequestBodyLimitMiddleware,
)
from routes.inference import (
    router as inference_router,
)


PROJECT_ROOT = Path(__file__).resolve().parent

RESULTS_DIR = PROJECT_ROOT / "results"

RESULTS_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


app = FastAPI(
    title="YOLO Image Prediction API",
    description=(
        "Upload an image, select a YOLO model, "
        "and receive object detection results."
    ),
    version="1.0.0",
)


# เพิ่ม Request Body Limit ก่อน
app.add_middleware(
    RequestBodyLimitMiddleware,
    max_body_size=(
        MAX_REQUEST_BODY_SIZE_BYTES
    ),
    protected_paths={
        "/api/predict",
        "/api/predict/",
    },
    protected_methods={
        "POST",
    },
)


# เพิ่ม CORS ทีหลังเพื่อให้เป็น Middleware
# ชั้นนอกและครอบ Response 413 ด้วย
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount(
    "/results",
    StaticFiles(
        directory=str(RESULTS_DIR)
    ),
    name="results",
)


app.include_router(
    inference_router
)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": (
            "YOLO Image Prediction API "
            "is running"
        )
    }


@app.get("/health")
def health_check() -> dict[str, str]:
    return {
        "status": "healthy"
    }