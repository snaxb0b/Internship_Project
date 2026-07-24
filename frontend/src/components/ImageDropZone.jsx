import {
  useEffect,
  useRef,
  useState,
} from "react";

import ConfirmationDialog from "./ConfirmationDialog";
import Icon from "./Icon";


function formatFileSize(sizeInBytes) {
  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
}


function ImageDropZone({
  selectedFile,
  onFileChange,
  disabled = false,
  error = "",
  confirmRemoval = false,
}) {
  const inputRef = useRef(null);

  const [isDragging, setIsDragging] =
    useState(false);

  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] =
    useState(false);


  useEffect(() => {
    if (
      !selectedFile &&
      inputRef.current
    ) {
      inputRef.current.value = "";
    }
  }, [selectedFile]);


  function preventDefaultBehavior(event) {
    event.preventDefault();
    event.stopPropagation();
  }


  function handleDragEnter(event) {
    preventDefaultBehavior(event);

    if (!disabled) {
      setIsDragging(true);
    }
  }


  function handleDragOver(event) {
    preventDefaultBehavior(event);

    if (!disabled) {
      setIsDragging(true);
    }
  }


  function handleDragLeave(event) {
    preventDefaultBehavior(event);

    if (
      event.currentTarget.contains(
        event.relatedTarget
      )
    ) {
      return;
    }

    setIsDragging(false);
  }


  function handleDrop(event) {
    preventDefaultBehavior(event);
    setIsDragging(false);

    if (disabled) {
      return;
    }

    const droppedFile =
      event.dataTransfer.files?.[0] ??
      null;

    if (droppedFile) {
      onFileChange(droppedFile);
    }
  }


  function handleInputChange(event) {
    const nextFile =
      event.target.files?.[0] ??
      null;

    onFileChange(nextFile);
  }


  function handleBrowseClick() {
    if (!disabled) {
      inputRef.current?.click();
    }
  }


  function handleEmptyKeyDown(event) {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      handleBrowseClick();
    }
  }


  function performRemove() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    onFileChange(null);
  }


  /*
   * ถ้าการลบภาพจะทำให้ผลการทำนายหายไปด้วย
   * (confirmRemoval) ให้ถามยืนยันก่อน — กันข้อมูลหาย
   */
  function handleRemoveFile() {
    if (confirmRemoval) {
      setIsRemoveConfirmOpen(true);
      return;
    }

    performRemove();
  }


  function handleConfirmRemove() {
    setIsRemoveConfirmOpen(false);
    performRemove();
  }


  const dropZoneClassName = [
    "drop-zone",
    isDragging
      ? "drop-zone--active"
      : "",
    error
      ? "drop-zone--error"
      : "",
    disabled
      ? "drop-zone--disabled"
      : "",
    selectedFile
      ? "drop-zone--has-file"
      : "",
  ]
    .filter(Boolean)
    .join(" ");


  return (
    <div className="drop-zone-wrapper">
      <div
        className={dropZoneClassName}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={
          selectedFile
            ? undefined
            : handleBrowseClick
        }
        onKeyDown={
          selectedFile
            ? undefined
            : handleEmptyKeyDown
        }
        role={selectedFile ? undefined : "button"}
        tabIndex={
          selectedFile || disabled
            ? undefined
            : 0
        }
        aria-disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={[
          selectedFile ? "" : "upload-help",
          error ? "upload-error" : "",
        ]
          .filter(Boolean)
          .join(" ") || undefined}
      >
        <input
          ref={inputRef}
          className="drop-zone-input"
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleInputChange}
          disabled={disabled}
          tabIndex={-1}
          aria-label="Choose an image to upload"
        />

        {!selectedFile ? (
          <div className="drop-zone-empty">
            <div className="drop-zone-illustration">
              <span className="drop-zone-ring" />
              <span className="drop-zone-icon">
                <Icon name="upload" size={28} />
              </span>
            </div>

            <div className="drop-zone-copy">
              <strong>
                {isDragging
                  ? "Drop your image here"
                  : "Drag and drop an image here"}
              </strong>

              <p id="upload-help">
                JPG, PNG or WebP &middot; Maximum 10 MB
              </p>
            </div>

            <span className="browse-button">
              <Icon name="image" size={17} />
              Browse image
            </span>
          </div>
        ) : (
          <div className="drop-zone-file">
            <div className="file-information">
              <span className="file-ready-label">
                <Icon name="check" size={13} />
                Ready to predict
              </span>

              <strong title={selectedFile.name}>
                {selectedFile.name}
              </strong>

              <div className="file-meta">
                <span>
                  {formatFileSize(selectedFile.size)}
                </span>

                <span aria-hidden="true">&bull;</span>

                <span>
                  {selectedFile.type ||
                    "Image file"}
                </span>
              </div>
            </div>

            <div className="file-actions">
              <button
                type="button"
                className="change-file-button"
                onClick={handleBrowseClick}
                disabled={disabled}
              >
                <Icon name="refresh" size={15} />
                Change
              </button>

              <button
                type="button"
                className="remove-file-button"
                onClick={handleRemoveFile}
                disabled={disabled}
                aria-label={`Remove ${selectedFile.name} and clear the result`}
                title="Remove image and clear the result"
              >
                <Icon name="close" size={16} />
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <small
          className="field-error"
          id="upload-error"
        >
          {error}
        </small>
      )}

      <ConfirmationDialog
        open={isRemoveConfirmOpen}
        title="Remove the uploaded image?"
        message="This clears the current image and its prediction result. This cannot be undone."
        confirmLabel="Remove image"
        cancelLabel="Cancel"
        onConfirm={handleConfirmRemove}
        onClose={() => {
          setIsRemoveConfirmOpen(false);
        }}
      />
    </div>
  );
}


export default ImageDropZone;
