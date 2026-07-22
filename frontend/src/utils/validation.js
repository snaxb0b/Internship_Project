export const MAX_IMAGE_SIZE_BYTES =
  10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function validateImageFile(file) {
  if (!file) {
    return "Please select an image";
  }

  if (
    file.type &&
    !ALLOWED_IMAGE_TYPES.has(file.type)
  ) {
    return (
      "Only JPG, PNG, and WebP images "
      + "are supported"
    );
  }
  if (
    file.size > MAX_IMAGE_SIZE_BYTES
  ) {
    return (
      "Image size must not exceed 10 MB"
    );
  }

  return "";
}


export function validatePredictionInput({
  modelId,
  confidence,
  file,
}) {
  const errors = {};

  if (!modelId) {
    errors.modelId =
      "Please select a YOLO model";
  }

  const confidenceNumber =
    Number(confidence);

  if (
    confidence === "" ||
    !Number.isFinite(confidenceNumber)
  ) {
    errors.confidence =
      "Confidence must be a number";
  } else if (
    confidenceNumber < 0 ||
    confidenceNumber > 1
  ) {
    errors.confidence =
      "Confidence must be between 0 and 1";
  }

  const fileError =
    validateImageFile(file);

  if (fileError) {
    errors.file = fileError;
  }

  return errors;
}


export function hasValidationErrors(
  errors
) {
  return Object.keys(errors).length > 0;
}