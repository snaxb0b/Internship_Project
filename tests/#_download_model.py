import os
from pathlib import Path

from ultralytics import YOLO


PROJECT_ROOT = (
    Path(__file__).resolve().parent.parent
)

WEIGHTS_DIR = PROJECT_ROOT / "weights"


MODEL_FILENAMES = (
    "yolo26n.pt",
    "yolo26s.pt",
    "yolo26m.pt",
    "yolo26l.pt",
    "yolo26x.pt",
)


def download_model(
    model_filename: str,
) -> None:
    destination = (
        WEIGHTS_DIR / model_filename
    )

    if destination.is_file():
        size_in_megabytes = (
            destination.stat().st_size
            / (1024 * 1024)
        )

        print(
            "[SKIP] "
            f"{model_filename} already exists "
            f"({size_in_megabytes:.2f} MiB)"
        )

        return

    print(
        "[DOWNLOAD] "
        f"Downloading {model_filename}..."
    )

    model = YOLO(model_filename)

    del model

    if not destination.is_file():
        raise RuntimeError(
            "Ultralytics finished loading "
            f"'{model_filename}', but the file "
            f"was not found at: {destination}"
        )

    size_in_megabytes = (
        destination.stat().st_size
        / (1024 * 1024)
    )

    print(
        "[SUCCESS] "
        f"{model_filename} downloaded "
        f"({size_in_megabytes:.2f} MiB)"
    )


def main() -> None:
    WEIGHTS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    original_working_directory = (
        Path.cwd()
    )

    print(
        f"[WEIGHTS] Directory: "
        f"{WEIGHTS_DIR}"
    )

    print(
        f"[WEIGHTS] Models: "
        f"{len(MODEL_FILENAMES)}"
    )

    try:
        # Ultralytics จะดาวน์โหลดไฟล์
        # ลง Current Working Directory
        os.chdir(WEIGHTS_DIR)

        for model_filename in (
            MODEL_FILENAMES
        ):
            download_model(
                model_filename
            )

    finally:
        os.chdir(
            original_working_directory
        )

    print()
    print(
        "[COMPLETE] All YOLO26 "
        "detection weights are ready."
    )


if __name__ == "__main__":
    main()