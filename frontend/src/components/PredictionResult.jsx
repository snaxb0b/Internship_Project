import { useMemo, useState } from "react";

import Icon from "./Icon";


function formatCoordinate(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue.toFixed(1)
    : value;
}


function PredictionResult({
  result,
  predicting,
}) {
  const [classQuery, setClassQuery] = useState("");
  const [sortBy, setSortBy] = useState("confidence-desc");

  const detections = useMemo(
    () => result?.detections ?? [],
    [result]
  );

  const visibleDetections = useMemo(() => {
    const normalizedQuery = classQuery.trim().toLocaleLowerCase();

    const filteredDetections = detections
      .map((detection, sourceIndex) => ({
        detection,
        sourceIndex,
      }))
      .filter(({ detection }) => (
        String(detection.class_name ?? "")
          .toLocaleLowerCase()
          .includes(normalizedQuery)
      ));

    return filteredDetections.sort((first, second) => {
      const firstConfidence =
        Number(first.detection.confidence) || 0;
      const secondConfidence =
        Number(second.detection.confidence) || 0;
      const classComparison = String(
        first.detection.class_name ?? ""
      ).localeCompare(
        String(second.detection.class_name ?? ""),
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        }
      );

      if (sortBy === "confidence-asc") {
        return firstConfidence - secondConfidence;
      }

      if (sortBy === "class-asc") {
        return classComparison;
      }

      if (sortBy === "class-desc") {
        return -classComparison;
      }

      return secondConfidence - firstConfidence;
    });
  }, [classQuery, detections, sortBy]);

  const hasClassFilter = classQuery.trim().length > 0;

  return (
    <section
      className="panel result-panel"
      id="result"
      aria-labelledby="result-title"
      aria-busy={predicting}
    >
      <div className="section-heading">
        <span className="step-number">
          <Icon name="sparkles" size={22} />
        </span>

        <div className="section-heading-copy">
          <span className="section-kicker">
            Step 02
          </span>

          <h2 id="result-title">
            Review the prediction
          </h2>

          <p>
            Your annotated image and every detected
            object will appear together below.
          </p>
        </div>

        {result && !predicting && (
          <span className="result-count-badge">
            {result.object_count} detected
          </span>
        )}
      </div>

      {!result && !predicting && (
        <div className="empty-result">
          <div className="empty-visual" aria-hidden="true">
            <span className="empty-visual-ring empty-visual-ring--one" />
            <span className="empty-visual-ring empty-visual-ring--two" />
            <span className="empty-icon">
              <Icon name="image" size={34} />
            </span>
          </div>

          <div className="empty-result-copy">
            <strong>Your result will appear here</strong>
          </div>
        </div>
      )}

      {predicting && (
        <div
          className="loading-result"
          role="status"
          aria-live="polite"
        >
          <div className="processing-visual">
            <span className="spinner" />
            <Icon name="logo" size={30} />
          </div>

          <div>
            <strong>Analyzing your image...</strong>
            <p>
              YOLO is finding objects and drawing
              the result. This should only take a moment.
            </p>
          </div>

          <div className="loading-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}

      {result && !predicting && (
        <div
          className="prediction-content"
          aria-live="polite"
        >
          <div className="summary-grid">
            <article className="summary-card">
              <span className="summary-icon">
                <Icon name="model" size={19} />
              </span>

              <div>
                <span>Model</span>
                <strong title={result.model_id}>
                  {result.model_id}
                </strong>
              </div>
            </article>

            <article className="summary-card">
              <span className="summary-icon">
                <Icon name="sparkles" size={19} />
              </span>

              <div>
                <span>Objects</span>
                <strong>
                  {result.object_count}
                </strong>
              </div>
            </article>

            <article className="summary-card">
              <span className="summary-icon">
                <Icon name="device" size={19} />
              </span>

              <div>
                <span>Device</span>
                <strong>
                  {result.device}
                </strong>
              </div>
            </article>

            <article className="summary-card">
              <span className="summary-icon">
                <Icon name="maximize" size={19} />
              </span>

              <div>
                <span>Image size</span>
                <strong>
                  {result.image_width}
                  {"\u00D7"}
                  {result.image_height}
                </strong>
              </div>
            </article>
          </div>

          {result.result_image_url && (
            <div className="result-image">
              <div className="result-image-header">
                <div>
                  <span className="result-image-icon">
                    <Icon name="check" size={17} />
                  </span>

                  <div>
                    <strong>Annotated result</strong>
                    <span>Bounding boxes are ready to review</span>
                  </div>
                </div>

                <div className="result-image-actions">
                  <a
                    className="image-action-link image-action-link--secondary"
                    href={result.result_image_url}
                    download
                  >
                    <Icon name="download" size={16} />
                    Download
                  </a>

                  <a
                    className="image-action-link"
                    href={result.result_image_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open full size
                    <Icon name="external" size={16} />
                  </a>
                </div>
              </div>

              <div className="result-image-canvas">
                <img
                  src={result.result_image_url}
                  alt="YOLO prediction result with object annotations"
                />
              </div>
            </div>
          )}

          <div className="detections-section">
            <div className="detections-heading">
              <div>
                <h3>Detected objects</h3>
                <p>Confidence and bounding box for each result.</p>
              </div>

              <span>
                {hasClassFilter && detections.length > 0
                  ? `${visibleDetections.length} of ${detections.length}`
                  : detections.length}
                {" "}
                {detections.length === 1
                  ? "item"
                  : "items"}
              </span>
            </div>

            {detections.length > 0 ? (
              <>
                <div className="detection-controls">
                  <label className="detection-search">
                    <span className="detection-control-label">
                      Search by class
                    </span>

                    <input
                      type="search"
                      value={classQuery}
                      onChange={(event) => {
                        setClassQuery(event.target.value);
                      }}
                      placeholder="e.g. person, car"
                      autoComplete="off"
                    />
                  </label>

                  <label className="detection-sort">
                    <span className="detection-control-label">
                      Sort objects
                    </span>

                    <select
                      value={sortBy}
                      onChange={(event) => {
                        setSortBy(event.target.value);
                      }}
                    >
                      <option value="confidence-desc">
                        Confidence: high to low
                      </option>
                      <option value="confidence-asc">
                        Confidence: low to high
                      </option>
                      <option value="class-asc">
                        Class: A to Z
                      </option>
                      <option value="class-desc">
                        Class: Z to A
                      </option>
                    </select>
                  </label>
                </div>

                {visibleDetections.length > 0 ? (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Class</th>
                          <th>Confidence</th>
                          <th>Bounding box</th>
                        </tr>
                      </thead>

                      <tbody>
                        {visibleDetections.map(
                          ({ detection, sourceIndex }, index) => {
                        const confidencePercentage =
                          Math.min(
                            100,
                            Math.max(
                              0,
                              Number(detection.confidence) * 100
                            )
                          );

                        const filledSegments =
                          Math.round(
                            confidencePercentage / 10
                          );

                        return (
                          <tr
                            key={
                              `${detection.class_id}-${sourceIndex}`
                            }
                          >
                            <td data-label="#">
                              <span className="detection-index">
                                {index + 1}
                              </span>
                            </td>

                            <td data-label="Class">
                              <strong className="detection-class">
                                {detection.class_name}
                              </strong>
                            </td>

                            <td data-label="Confidence">
                              <div className="confidence-cell">
                                <strong>
                                  {confidencePercentage.toFixed(1)}%
                                </strong>

                                <span
                                  className="confidence-meter"
                                  aria-hidden="true"
                                >
                                  {Array.from(
                                    { length: 10 },
                                    (_, segmentIndex) => (
                                      <span
                                        key={segmentIndex}
                                        className={
                                          segmentIndex < filledSegments
                                            ? "confidence-segment--active"
                                            : ""
                                        }
                                      />
                                    )
                                  )}
                                </span>
                              </div>
                            </td>

                            <td data-label="Bounding box">
                              <div className="bounding-box">
                                <span className="bounding-point">
                                  <small>Top-left</small>

                                  <strong>
                                    <span className="axis-label">X</span>
                                    {formatCoordinate(
                                      detection.bounding_box.x1
                                    )}

                                    <span className="coordinate-divider" />

                                    <span className="axis-label">Y</span>
                                    {formatCoordinate(
                                      detection.bounding_box.y1
                                    )}
                                  </strong>
                                </span>

                                <span
                                  className="bounding-arrow"
                                  aria-hidden="true"
                                >
                                  <Icon name="arrow" size={14} />
                                </span>

                                <span className="bounding-point bounding-point--end">
                                  <small>Bottom-right</small>

                                  <strong>
                                    <span className="axis-label">X</span>
                                    {formatCoordinate(
                                      detection.bounding_box.x2
                                    )}

                                    <span className="coordinate-divider" />

                                    <span className="axis-label">Y</span>
                                    {formatCoordinate(
                                      detection.bounding_box.y2
                                    )}
                                  </strong>
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div
                    className="no-detections no-detections--filtered"
                    role="status"
                  >
                    <span>
                      <Icon name="info" size={20} />
                    </span>

                    <div>
                      <strong>No matching objects</strong>
                      <p>
                        Try another class name or clear the search.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="clear-detection-filter"
                      onClick={() => {
                        setClassQuery("");
                      }}
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-detections">
                <span>
                  <Icon name="info" size={20} />
                </span>

                <div>
                  <strong>No objects passed the threshold</strong>
                  <p>
                    Try a lower confidence value or another image.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}


export default PredictionResult;
