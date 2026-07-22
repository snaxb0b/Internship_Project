import os
from pathlib import Path

from ultralytics import YOLO


PROJECT_ROOT = Path(__file__).resolve().parent
WEIGHTS_DIR = PROJECT_ROOT / "weights"

WEIGHTS_DIR.mkdir(exist_ok=True)

original_directory = Path.cwd()

try:
    # ทำให้ Ultralytics ดาวน์โหลดไฟล์เข้ามาใน weights/
    os.chdir(WEIGHTS_DIR)

    print("Downloading YOLO26 Small...")
    print("Destination:", WEIGHTS_DIR)

    model = YOLO("yolo26s.pt")

    weight_path = WEIGHTS_DIR / "yolo26s.pt"

    print("Model object:", type(model))
    print("Weight path:", weight_path)
    print("Weight exists:", weight_path.exists())

    if not weight_path.exists():
        raise FileNotFoundError(
            f"Downloaded weight was not found: {weight_path}"
        )

    print("YOLO26 Small downloaded successfully")

finally:
    # คืนตำแหน่ง Terminal กลับเหมือนเดิม
    os.chdir(original_directory)