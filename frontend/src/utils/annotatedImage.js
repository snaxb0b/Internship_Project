import {
  colorForClassId,
  labelTextColor,
  rgbString,
} from "./detectionColors";


/*
 * โหลดรูปแบบ cross-origin เพื่อให้วาดลง canvas
 * แล้ว export ได้โดยไม่ติด "tainted canvas"
 *
 * (Backend ส่ง CORS header ให้ /results อยู่แล้ว)
 * ถ้าโหลดไม่สำเร็จจะคืน null เพื่อให้ผู้เรียกใช้
 * fallback ได้อย่างปลอดภัย
 */
function loadCrossOriginImage(src) {
  return new Promise((resolve) => {
    const image = new Image();

    image.crossOrigin = "anonymous";
    image.decoding = "async";

    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);

    image.src = src;
  });
}


function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}


/*
 * ประกอบภาพผลลัพธ์ฝั่ง Client:
 * วาดภาพต้นฉบับ แล้ววาดเฉพาะกล่องของคลาส
 * ที่ผู้ใช้เลือก (detections ที่กรองมาแล้ว)
 *
 * วาดที่ความละเอียดจริงของภาพต้นฉบับ จึงคง
 * ขนาด/สีเดิม และรูปแบบกล่อง/ป้ายให้ตรงกับ
 * render_annotated_image ของ Backend
 *
 * คืน Blob (PNG) หรือ null หากทำไม่สำเร็จ
 */
export async function buildAnnotatedBlob({
  imageUrl,
  detections,
}) {
  if (!imageUrl || typeof document === "undefined") {
    return null;
  }

  const image = await loadCrossOriginImage(imageUrl);

  if (!image) {
    return null;
  }

  const width = image.naturalWidth;
  const height = image.naturalHeight;

  if (!width || !height) {
    return null;
  }

  try {
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      return null;
    }

    context.drawImage(image, 0, 0, width, height);

    const lineWidth = Math.max(
      2,
      Math.round(Math.min(width, height) / 320)
    );

    const fontSize = Math.max(
      13,
      Math.round(Math.min(width, height) / 45)
    );

    const padding = Math.max(2, lineWidth);

    context.font = `700 ${fontSize}px Inter, "Segoe UI", system-ui, sans-serif`;
    context.textBaseline = "top";
    context.lineJoin = "round";

    detections.forEach((detection) => {
      const box = detection.bounding_box ?? {};

      const x1 = Number(box.x1) || 0;
      const y1 = Number(box.y1) || 0;
      const x2 = Number(box.x2) || 0;
      const y2 = Number(box.y2) || 0;

      const rgb = colorForClassId(detection.class_id);
      const color = rgbString(rgb);

      context.lineWidth = lineWidth;
      context.strokeStyle = color;
      context.strokeRect(x1, y1, x2 - x1, y2 - y1);

      const confidence = clampNumber(
        Math.round(Number(detection.confidence) * 100),
        0,
        100
      );

      const label = `${
        detection.class_name ?? detection.class_id
      } ${confidence}%`;

      const textWidth = context.measureText(label).width;
      const labelHeight = fontSize + 2 * padding;

      let labelTop = y1 - labelHeight;

      if (labelTop < 0) {
        labelTop = y1;
      }

      let labelLeft = x1;
      let labelRight = x1 + textWidth + 2 * padding;

      if (labelRight > width) {
        labelRight = width;
        labelLeft = width - (textWidth + 2 * padding);
      }

      context.fillStyle = color;
      context.fillRect(
        labelLeft,
        labelTop,
        labelRight - labelLeft,
        labelHeight
      );

      context.fillStyle = labelTextColor(rgb);
      context.fillText(
        label,
        labelLeft + padding,
        labelTop + padding
      );
    });

    return await new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/png"
      );
    });
  } catch {
    /*
     * เช่น canvas ถูก taint (CORS ไม่ผ่าน)
     * ให้ผู้เรียก fallback ไปโหลดภาพจาก Server แทน
     */
    return null;
  }
}
