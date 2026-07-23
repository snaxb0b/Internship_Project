/*
 * ชุดสีของกล่อง/ป้ายกำกับต่อคลาส
 *
 * ต้องเรียงให้ตรงกับ _BOX_PALETTE ใน
 * services/yolo_service.py เพื่อให้สีของกรอบ
 * ที่ Frontend วาด ตรงกับภาพผลลัพธ์ฝั่ง Backend
 * (รวมถึงรูปย่อใน History) — คลาสเดียวกันได้สี
 * เดียวกันเสมอ
 */
export const BOX_PALETTE = [
  [37, 136, 255],
  [22, 133, 91],
  [222, 90, 130],
  [245, 158, 11],
  [139, 92, 246],
  [14, 165, 183],
  [234, 88, 12],
  [99, 102, 241],
  [16, 185, 129],
  [219, 39, 119],
  [59, 130, 246],
  [168, 85, 247],
];


/*
 * เลือกสีจาก class_id เหมือนสูตร Backend
 * (class_id % len(palette)) และกันค่าติดลบ/ไม่ใช่ตัวเลข
 */
export function colorForClassId(classId) {
  const numericId = Number(classId);

  if (!Number.isFinite(numericId)) {
    return BOX_PALETTE[0];
  }

  const paletteSize = BOX_PALETTE.length;

  const index =
    ((Math.trunc(numericId) % paletteSize) +
      paletteSize) %
    paletteSize;

  return BOX_PALETTE[index];
}


export function rgbString(rgb) {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}


/*
 * เลือกสีตัวอักษรบนป้ายให้อ่านง่าย
 * ตามความสว่างของสีพื้น (เหมือน Backend)
 */
export function labelTextColor(rgb) {
  const luminance =
    0.299 * rgb[0] +
    0.587 * rgb[1] +
    0.114 * rgb[2];

  return luminance > 150 ? "#111827" : "#ffffff";
}
