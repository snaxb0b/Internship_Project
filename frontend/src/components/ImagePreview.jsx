import Icon from "./Icon";


function ImagePreview({
  previewUrl,
  filename,
}) {
  if (!previewUrl) {
    return null;
  }

  return (
    <div className="image-preview">
      <div className="image-preview-header">
        <span>
          <Icon name="image" size={17} />
          Original image preview
        </span>

        <span className="preview-ready-badge">
          <Icon name="check" size={13} />
          Ready
        </span>
      </div>

      <div className="image-preview-canvas">
        <img
          src={previewUrl}
          alt={`Preview of ${filename}`}
        />
      </div>
    </div>
  );
}


export default ImagePreview;
