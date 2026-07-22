from pathlib import Path
from typing import TypedDict


class ModelConfig(TypedDict):
    id: str
    name: str
    description: str
    weight_path: Path


PROJECT_ROOT = (
    Path(__file__).resolve().parent.parent
)

WEIGHTS_DIR = PROJECT_ROOT / "weights"


MODEL_REGISTRY: dict[
    str,
    ModelConfig,
] = {
    "yolo26n": {
        "id": "yolo26n",
        "name": "YOLO26 Nano",
        "description": (
            "The smallest and fastest YOLO26 model. "
            "Suitable for quick predictions and "
            "devices with limited computing resources."
        ),
        "weight_path": (
            WEIGHTS_DIR / "yolo26n.pt"
        ),
    },

    "yolo26s": {
        "id": "yolo26s",
        "name": "YOLO26 Small",
        "description": (
            "A small YOLO26 model that provides "
            "a balance between prediction speed "
            "and detection accuracy."
        ),
        "weight_path": (
            WEIGHTS_DIR / "yolo26s.pt"
        ),
    },

    "yolo26m": {
        "id": "yolo26m",
        "name": "YOLO26 Medium",
        "description": (
            "A medium-sized YOLO26 model with "
            "higher detection capacity than Nano "
            "and Small while maintaining reasonable speed."
        ),
        "weight_path": (
            WEIGHTS_DIR / "yolo26m.pt"
        ),
    },

    "yolo26l": {
        "id": "yolo26l",
        "name": "YOLO26 Large",
        "description": (
            "A large YOLO26 model designed for "
            "higher detection accuracy, but it requires "
            "more processing time and memory."
        ),
        "weight_path": (
            WEIGHTS_DIR / "yolo26l.pt"
        ),
    },

    "yolo26x": {
        "id": "yolo26x",
        "name": "YOLO26 Extra Large",
        "description": (
            "The largest YOLO26 model with the highest "
            "model capacity. It requires the most "
            "computing resources and GPU memory."
        ),
        "weight_path": (
            WEIGHTS_DIR / "yolo26x.pt"
        ),
    },
}


def get_available_models() -> list[
    dict[str, str]
]:
    """
    คืนรายการโมเดลสำหรับส่งให้ Frontend

    ไม่ส่ง weight_path ออกไป เพราะเป็น
    Internal path ของ Backend
    """

    return [
        {
            "id": model_config["id"],
            "name": model_config["name"],
            "description": (
                model_config["description"]
            ),
        }
        for model_config
        in MODEL_REGISTRY.values()
    ]


def get_model_config(
    model_id: str,
) -> ModelConfig:
    """
    รับ model_id และคืน Configuration
    ของโมเดลที่เลือก

    ตัวอย่าง:
    get_model_config("yolo26m")
    """

    normalized_model_id = (
        model_id.strip().lower()
    )

    model_config = MODEL_REGISTRY.get(
        normalized_model_id
    )

    if model_config is None:
        available_model_ids = ", ".join(
            MODEL_REGISTRY.keys()
        )

        raise ValueError(
            f"Unknown model_id: "
            f"'{model_id}'. "
            f"Available models: "
            f"{available_model_ids}"
        )

    return model_config