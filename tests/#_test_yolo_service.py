import json
from pathlib import Path

from services.yolo_service import (
    RESULTS_DIR,
    load_model,
    predict_image,
)


PROJECT_ROOT = Path(__file__).resolve().parent.parent

TEST_IMAGE_PATH = (
    PROJECT_ROOT
    / "tests"
    / "images"
    / "test.jpg"
)

MODEL_IDS = [
    "yolo26n",
    "yolo26s",
]


def test_single_model(
    model_id: str,
    image_bytes: bytes,
) -> None:
    print("\n================================")
    print("Testing model:", model_id)
    print("================================")

    first_model = load_model(model_id)
    second_model = load_model(model_id)

    if first_model is not second_model:
        raise RuntimeError(
            f"Cache failed for model: {model_id}"
        )

    prediction = predict_image(
        model_id=model_id,
        image_bytes=image_bytes,
        confidence=0.25,
    )

    result_filename = prediction[
        "result_image_filename"
    ]

    result_path = (
        RESULTS_DIR / result_filename
    )

    print(
        "Result image filename:",
        result_filename,
    )

    print(
        "Result image exists:",
        result_path.exists(),
    )

    if not result_path.exists():
        raise RuntimeError(
            f"Result image was not created: "
            f"{result_path}"
        )

    print(
        json.dumps(
            prediction,
            indent=2,
            ensure_ascii=False,
        )
    )

def main() -> None:
    print("===== Multiple YOLO Models Test =====")

    print("Test image:", TEST_IMAGE_PATH)
    print("Image exists:", TEST_IMAGE_PATH.exists())

    if not TEST_IMAGE_PATH.exists():
        raise FileNotFoundError(
            f"Test image not found: {TEST_IMAGE_PATH}"
        )

    image_bytes = TEST_IMAGE_PATH.read_bytes()

    print("Image bytes:", len(image_bytes))

    for model_id in MODEL_IDS:
        test_single_model(
            model_id=model_id,
            image_bytes=image_bytes,
        )

    print("\nAll YOLO models passed successfully")


if __name__ == "__main__":
    main()