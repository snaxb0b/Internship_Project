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
    "rtdetr-l": {
        "id": "rtdetr-l",
        "name": "RT-DETR Large",
        "description": (
            "The standard RT-DETR model. A real-time "
            "detection transformer that balances speed "
            "and accuracy, suitable for most detection tasks."
        ),
        "weight_path": (
            WEIGHTS_DIR / "rtdetr-l.pt"
        ),
    },

    "rtdetr-x": {
        "id": "rtdetr-x",
        "name": "RT-DETR Extra Large",
        "description": (
            "The larger RT-DETR model with higher "
            "detection accuracy. It needs more compute "
            "and GPU memory but produces the strongest results."
        ),
        "weight_path": (
            WEIGHTS_DIR / "rtdetr-x.pt"
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
    get_model_config("rtdetr-l")
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