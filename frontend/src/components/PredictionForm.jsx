import ErrorAlert from "./ErrorAlert";
import Icon from "./Icon";
import ImageDropZone from "./ImageDropZone";
import ImagePreview from "./ImagePreview";


const CONFIDENCE_PRESETS = [
  "0.25",
  "0.50",
  "0.75",
];


function PredictionForm({
  models,
  modelsLoading,
  modelsError,
  onReloadModels,

  modelId,
  onModelChange,

  confidence,
  onConfidenceChange,

  selectedFile,
  onFileChange,

  previewUrl,
  fieldErrors,

  predictionError,
  predicting,

  onSubmit,
  onReset,
}) {
  const selectedModel =
    models.find(
      (model) => model.id === modelId
    ) ?? null;

  const numericConfidence =
    Number(confidence);

  const confidencePercent =
    Number.isFinite(numericConfidence)
      ? Math.round(numericConfidence * 100)
      : 0;


  function handleFormSubmit(event) {
    event.preventDefault();
    onSubmit();
  }


  function adjustConfidence(change) {
    const currentValue =
      Number(confidence);

    const startingValue =
      Number.isFinite(currentValue)
        ? currentValue
        : 0.25;

    const nextValue = Math.min(
      1,
      Math.max(
        0,
        Math.round(
          (startingValue + change) * 100
        ) / 100
      )
    );

    onConfidenceChange(
      nextValue.toFixed(2)
    );
  }


  return (
    <section
      className="panel upload-panel"
      id="configuration"
      aria-labelledby="configuration-title"
    >
      <div className="section-heading">
        <span className="step-number">
          <Icon name="upload" size={22} />
        </span>

        <div className="section-heading-copy">
          <span className="section-kicker">
            Step 01
          </span>

          <h2 id="configuration-title">
            Configure your prediction
          </h2>

          <p>
            Select a model, adjust the confidence threshold,
            then add the image you want to inspect.
          </p>
        </div>
      </div>

      <ErrorAlert
        title="Cannot load YOLO models"
        message={modelsError}
        onRetry={onReloadModels}
      />

      <form
        className="prediction-form"
        onSubmit={handleFormSubmit}
      >
        <div className="control-block model-control-block">
          <div className="control-block-heading">
            <span className="control-icon">
              <Icon name="model" size={20} />
            </span>

            <div>
              <label htmlFor="model-select">
                YOLO model
              </label>
              <p>Choose the detector that fits your image.</p>
            </div>
          </div>

          <div className="form-field">
            <select
              id="model-select"
              value={modelId}
              onChange={(event) => {
                onModelChange(
                  event.target.value
                );
              }}
              disabled={
                modelsLoading ||
                models.length === 0 ||
                predicting
              }
              aria-invalid={Boolean(fieldErrors.modelId)}
              aria-describedby={
                fieldErrors.modelId
                  ? "model-error"
                  : selectedModel
                    ? "model-description"
                    : undefined
              }
            >
              {modelsLoading && (
                <option value="">
                  Loading models...
                </option>
              )}

              {!modelsLoading &&
                models.length === 0 && (
                  <option value="">
                    No models available
                  </option>
                )}

              {models.map((model) => (
                <option
                  key={model.id}
                  value={model.id}
                >
                  {model.name} ({model.id})
                </option>
              ))}
            </select>

            {fieldErrors.modelId && (
              <small
                className="field-error"
                id="model-error"
              >
                {fieldErrors.modelId}
              </small>
            )}
          </div>

          {selectedModel && (
            <div
              className="model-description"
              id="model-description"
            >
              <Icon name="info" size={17} />
              <span>
                {selectedModel.description}
              </span>
            </div>
          )}
        </div>

        <div className="control-block confidence-control-block">
          <div className="control-block-heading">
            <span className="control-icon">
              <Icon name="sliders" size={20} />
            </span>

            <div>
              <label htmlFor="confidence-range">
                Confidence threshold
              </label>
              <p>Set how certain a detection needs to be.</p>
            </div>

            <output
              className="confidence-output"
              htmlFor="confidence-range confidence-number"
            >
              {confidencePercent}%
            </output>
          </div>

          <div className="confidence-control">
            <input
              className="confidence-range"
              id="confidence-range"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={confidence || "0"}
              onChange={(event) => {
                onConfidenceChange(
                  event.target.value
                );
              }}
              disabled={predicting}
              aria-invalid={Boolean(fieldErrors.confidence)}
              aria-describedby={
                fieldErrors.confidence
                  ? "confidence-error"
                  : undefined
              }
              style={{
                "--range-progress": `${confidencePercent}%`,
              }}
            />

            <div className="range-scale" aria-hidden="true">
              <span>More results</span>
              <span>More certainty</span>
            </div>

            <div className="confidence-options">
              <div
                className="confidence-presets"
                aria-label="Confidence presets"
                role="group"
              >
                {CONFIDENCE_PRESETS.map((presetValue) => (
                  <button
                    key={presetValue}
                    type="button"
                    className={
                      presetValue === "0.25"
                        ? "confidence-preset confidence-preset--recommended"
                        : "confidence-preset"
                    }
                    onClick={() => {
                      onConfidenceChange(presetValue);
                    }}
                    aria-pressed={
                      Number(confidence) ===
                      Number(presetValue)
                    }
                    aria-label={
                      presetValue === "0.25"
                        ? "Set confidence to 25%, recommended starting point"
                        : `Set confidence to ${Number(presetValue) * 100}%`
                    }
                    aria-describedby={
                      presetValue === "0.25"
                        ? "confidence-25-tooltip"
                        : undefined
                    }
                    disabled={predicting}
                  >
                    <span className="confidence-preset-value">
                      {Number(presetValue) * 100}%
                    </span>

                    {presetValue === "0.25" && (
                      <>
                        <span
                          className="confidence-recommendation-mark"
                          aria-hidden="true"
                        >
                          *
                        </span>

                        <span
                          className="confidence-recommendation-tooltip"
                          id="confidence-25-tooltip"
                          role="tooltip"
                        >
                          0.25 is a balanced starting point for most images.
                        </span>
                      </>
                    )}
                  </button>
                ))}
              </div>

              <div className="confidence-number-field">
                <label htmlFor="confidence-number">
                  Custom value
                </label>

                <div className="confidence-stepper">
                  <button
                    type="button"
                    onClick={() => {
                      adjustConfidence(-0.01);
                    }}
                    disabled={
                      predicting ||
                      Number(confidence) <= 0
                    }
                    aria-label="Decrease confidence by 0.01"
                  >
                    <Icon name="minus" size={16} />
                  </button>

                  <input
                    id="confidence-number"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={confidence}
                    onChange={(event) => {
                      onConfidenceChange(
                        event.target.value
                      );
                    }}
                    disabled={predicting}
                    aria-invalid={Boolean(fieldErrors.confidence)}
                    aria-describedby={
                      fieldErrors.confidence
                        ? "confidence-error"
                        : undefined
                    }
                  />

                  <button
                    type="button"
                    onClick={() => {
                      adjustConfidence(0.01);
                    }}
                    disabled={
                      predicting ||
                      Number(confidence) >= 1
                    }
                    aria-label="Increase confidence by 0.01"
                  >
                    <Icon name="plus" size={16} />
                  </button>
                </div>
              </div>
            </div>

            {fieldErrors.confidence && (
              <small
                className="field-error"
                id="confidence-error"
              >
                {fieldErrors.confidence}
              </small>
            )}
          </div>
        </div>

        <div className="control-block upload-control-block">
          <div className="control-block-heading">
            <span className="control-icon">
              <Icon name="image" size={20} />
            </span>

            <div>
              <span className="control-label">
                Image file
              </span>
              <p>Upload a clear image for the best result.</p>
            </div>
          </div>

          <ImageDropZone
            selectedFile={selectedFile}
            onFileChange={onFileChange}
            disabled={predicting}
            error={fieldErrors.file}
          />

          <ImagePreview
            previewUrl={previewUrl}
            filename={
              selectedFile?.name ?? "image"
            }
          />
        </div>

        <ErrorAlert
          title="Prediction failed"
          message={predictionError}
        />

        <div className="form-actions">
          <div className="form-action-buttons">
            <button
              className="reset-button"
              type="button"
              onClick={onReset}
              disabled={predicting}
            >
              <Icon name="refresh" size={18} />
              Reset
            </button>

            <button
              className="predict-button"
              type="submit"
              disabled={
                predicting ||
                modelsLoading ||
                models.length === 0
              }
            >
              {predicting ? (
                <>
                  <span className="button-spinner" />
                  Predicting...
                </>
              ) : (
                <>
                  Upload and predict
                  <Icon name="arrow" size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}


export default PredictionForm;
