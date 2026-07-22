from pathlib import Path

from ultralytics import YOLO


weight_path = Path("weights/yolo26n.pt")

print("Weight path:", weight_path.resolve())
print("Weight exists:", weight_path.exists())

if not weight_path.exists():
    raise FileNotFoundError(
        f"Model weight not found: {weight_path.resolve()}"
    )

model = YOLO(str(weight_path))

print("YOLO model loaded successfully")
print("Model type:", type(model))