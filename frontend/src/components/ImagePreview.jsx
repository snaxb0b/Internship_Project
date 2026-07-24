import Icon from "./Icon";


/*
 * พื้นที่พรีวิวภาพหลักของ Step 1
 *
 * แสดงผลเสมอ (ไม่คืน null) เพื่อให้เป็นจุดโฟกัส
 * หลักของหน้าจอ เมื่อยังไม่มีภาพจะแสดง Empty
 * state บอกให้ผู้ใช้อัปโหลดจากแผงตั้งค่าด้านซ้าย
 */
function ImagePreview({
  previewUrl,
  filename,
}) {
  const hasImage = Boolean(previewUrl);

  return (
    <div
      className={
        hasImage
          ? "image-preview has-image"
          : "image-preview is-empty"
      }
    >
      <div className="image-preview-header">
        <span className="image-preview-title">
          <Icon name="image" size={17} />
          Image Preview
        </span>

        {hasImage && (
          <span className="preview-ready-badge">
            <Icon name="check" size={13} />
            Ready
          </span>
        )}
      </div>

      <div className="image-preview-canvas">
        {hasImage ? (
          <img
            src={previewUrl}
            alt={`Preview of ${filename}`}
          />
        ) : (
          <div className="image-preview-empty">
            <div
              className="image-preview-empty-visual"
              aria-hidden="true"
            >
              <span className="image-preview-empty-ring" />
              <span className="image-preview-empty-icon">
                <Icon name="image" size={30} />
              </span>
            </div>

            <div className="image-preview-empty-copy">
              <strong>
                Your image preview appears here
              </strong>
              <p>
                Add an image from the panel on the left
                to see it before running a prediction.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export default ImagePreview;
