import {
  useCallback,
  useMemo,
  useState,
} from "react";

import Icon from "./Icon";
import ClassFilterDropdown from "./ClassFilterDropdown";

import {
  colorForClassId,
  labelTextColor,
  rgbString,
} from "../utils/detectionColors";

import { buildAnnotatedBlob } from "../utils/annotatedImage";


function formatCoordinate(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue.toFixed(1)
    : value;
}


function detectionClassName(detection) {
  return detection.class_name != null &&
    detection.class_name !== ""
    ? String(detection.class_name)
    : String(detection.class_id);
}


function clampPercent(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}


const SORT_DESCRIPTIONS = {
  confidence: {
    asc: "confidence, low to high",
    desc: "confidence, high to low",
  },
  class: {
    asc: "class name, A to Z",
    desc: "class name, Z to A",
  },
};


function triggerDownloadLink(href, filename) {
  const link = document.createElement("a");

  link.href = href;
  link.download = filename;
  link.rel = "noopener";

  document.body.appendChild(link);
  link.click();
  link.remove();
}


/*
 * ปุ่มจัดเรียงข้าง Heading ของคอลัมน์
 *
 * แสดงลูกศรขึ้น/ลง โดยไฮไลต์ทิศทางที่กำลัง
 * ใช้งานอยู่ให้เห็นชัด คลิกซ้ำเพื่อสลับ asc/desc
 */
function SortControl({
  column,
  label,
  sort,
  onSort,
  disabled,
}) {
  const isActive = sort.column === column;
  const direction = isActive ? sort.direction : null;

  const description = isActive
    ? `Sorted by ${
        SORT_DESCRIPTIONS[column][sort.direction]
      }. Activate to reverse the order.`
    : `Sort by ${label.toLowerCase()}.`;

  return (
    <button
      type="button"
      className={
        isActive
          ? "sort-control is-active"
          : "sort-control"
      }
      onClick={() => onSort(column)}
      disabled={disabled}
      aria-label={description}
      title={description}
    >
      <span className="sort-control-label">
        {label}
      </span>

      <span
        className="sort-control-arrows"
        aria-hidden="true"
      >
        <Icon
          name="chevronUp"
          size={11}
          className={
            direction === "asc"
              ? "sort-arrow is-active"
              : "sort-arrow"
          }
        />
        <Icon
          name="chevronDown"
          size={11}
          className={
            direction === "desc"
              ? "sort-arrow is-active"
              : "sort-arrow"
          }
        />
      </span>
    </button>
  );
}


function PredictionResult({
  result,
  predicting,
}) {
  const [imageStatus, setImageStatus] =
    useState("loading");

  const [exporting, setExporting] =
    useState(false);

  const [sort, setSort] = useState({
    column: "confidence",
    direction: "desc",
  });

  const detections = useMemo(
    () => result?.detections ?? [],
    [result]
  );

  /*
   * คลาสทั้งหมดที่ตรวจพบ (สร้างจากผลจริงแบบ
   * dynamic) พร้อมสีและจำนวนของแต่ละคลาส
   */
  const classSummary = useMemo(() => {
    const summary = new Map();

    detections.forEach((detection) => {
      const name = detectionClassName(detection);
      const existing = summary.get(name);

      if (existing) {
        existing.count += 1;
      } else {
        summary.set(name, {
          name,
          color: colorForClassId(
            detection.class_id
          ),
          count: 1,
        });
      }
    });

    return Array.from(summary.values()).sort(
      (first, second) =>
        first.name.localeCompare(
          second.name,
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          }
        )
    );
  }, [detections]);

  /*
   * แหล่งความจริงเดียวของ "คลาสที่ถูกเลือก"
   *
   * เริ่มต้นเลือกทุกคลาส และเพราะ Component นี้
   * ถูก remount ใหม่ทุกครั้งที่ผลลัพธ์เปลี่ยน
   * (parent ใส่ key ตามผลลัพธ์) state จึงรีเซ็ต
   * เป็น "เลือกทั้งหมด" ให้เองในแต่ละผลลัพธ์
   */
  const [selectedClasses, setSelectedClasses] =
    useState(
      () =>
        new Set(
          (result?.detections ?? []).map(
            detectionClassName
          )
        )
    );

  const handleToggleClass = useCallback(
    (name) => {
      setSelectedClasses((current) => {
        const next = new Set(current);

        if (next.has(name)) {
          next.delete(name);
        } else {
          next.add(name);
        }

        return next;
      });
    },
    []
  );

  const handleSetAll = useCallback(
    (selectAll) => {
      setSelectedClasses(
        selectAll
          ? new Set(
              classSummary.map(
                (item) => item.name
              )
            )
          : new Set()
      );
    },
    [classSummary]
  );

  const handleSort = useCallback((column) => {
    setSort((current) => {
      if (current.column === column) {
        return {
          column,
          direction:
            current.direction === "asc"
              ? "desc"
              : "asc",
        };
      }

      return {
        column,
        direction:
          column === "confidence"
            ? "desc"
            : "asc",
      };
    });
  }, []);

  /*
   * กล่องที่ "มองเห็นได้" = กรองตามคลาสที่เลือก
   *
   * ใช้ชุดเดียวกันนี้ทั้งกับ overlay บนภาพและ
   * ตารางด้านล่าง ทั้งสองจึงตรงกันเสมอ (sync)
   * และไม่แตะต้อง detections ต้นฉบับ (ไม่ mutate)
   */
  const filteredDetections = useMemo(
    () =>
      detections
        .map((detection, sourceIndex) => ({
          detection,
          sourceIndex,
        }))
        .filter(({ detection }) =>
          selectedClasses.has(
            detectionClassName(detection)
          )
        ),
    [detections, selectedClasses]
  );

  /*
   * ลำดับของ "ตาราง" เท่านั้น — การจัดเรียงไม่
   * กระทบว่ากล่องใดถูกแสดงบนภาพ (แสดงจากชุด
   * filteredDetections ตามเดิม)
   */
  const sortedDetections = useMemo(() => {
    const rows = filteredDetections.slice();
    const factor =
      sort.direction === "asc" ? 1 : -1;

    rows.sort((first, second) => {
      let primary;

      if (sort.column === "confidence") {
        primary =
          (Number(first.detection.confidence) ||
            0) -
          (Number(second.detection.confidence) ||
            0);
      } else {
        primary = detectionClassName(
          first.detection
        ).localeCompare(
          detectionClassName(second.detection),
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          }
        );
      }

      if (primary !== 0) {
        return primary * factor;
      }

      return first.sourceIndex - second.sourceIndex;
    });

    return rows;
  }, [filteredDetections, sort]);

  const totalCount = detections.length;
  const visibleCount = filteredDetections.length;
  const isFiltered = visibleCount !== totalCount;

  const imageWidth = Number(result?.image_width) || 0;
  const imageHeight =
    Number(result?.image_height) || 0;

  const originalImageUrl =
    result?.original_image_url ?? null;
  const annotatedImageUrl =
    result?.result_image_url ?? null;
  const baseImageUrl =
    originalImageUrl ?? annotatedImageUrl;

  /*
   * วาด overlay ฝั่ง Client ได้ก็ต่อเมื่อมีภาพ
   * ต้นฉบับ (ไม่มีกล่อง) และรู้ขนาดภาพจริง
   */
  const canOverlay =
    Boolean(originalImageUrl) &&
    imageWidth > 0 &&
    imageHeight > 0;

  const downloadFilename = useMemo(() => {
    const source = result?.filename ?? "";
    const base =
      source.replace(/\.[^./\\]+$/, "") ||
      "annotated-result";

    return `${base}-annotated.png`;
  }, [result]);

  const handleDownload = useCallback(async () => {
    if (exporting || !baseImageUrl) {
      return;
    }

    /*
     * ไม่มีภาพต้นฉบับ (เช่น history เก่า) จึง
     * ดาวน์โหลดภาพผลลัพธ์จาก Server ตามเดิม
     */
    if (!canOverlay) {
      triggerDownloadLink(
        annotatedImageUrl,
        downloadFilename
      );
      return;
    }

    setExporting(true);

    try {
      const blob = await buildAnnotatedBlob({
        imageUrl: baseImageUrl,
        detections: filteredDetections.map(
          (entry) => entry.detection
        ),
      });

      if (blob) {
        const objectUrl =
          URL.createObjectURL(blob);

        triggerDownloadLink(
          objectUrl,
          downloadFilename
        );

        window.setTimeout(
          () => URL.revokeObjectURL(objectUrl),
          2000
        );
      } else if (annotatedImageUrl) {
        triggerDownloadLink(
          annotatedImageUrl,
          downloadFilename
        );
      }
    } finally {
      setExporting(false);
    }
  }, [
    exporting,
    baseImageUrl,
    canOverlay,
    annotatedImageUrl,
    downloadFilename,
    filteredDetections,
  ]);

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
              RT-DETR is finding objects and drawing
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
                  {"×"}
                  {result.image_height}
                </strong>
              </div>
            </article>
          </div>

          {baseImageUrl && (
            <div className="result-image">
              <div className="result-image-header">
                <div>
                  <span className="result-image-icon">
                    <Icon name="check" size={17} />
                  </span>

                  <div>
                    <strong>Annotated result</strong>
                    <span>
                      {canOverlay
                        ? "Use the Filter to choose which classes are drawn"
                        : "Bounding boxes are ready to review"}
                    </span>
                  </div>
                </div>

                <div className="result-image-actions">
                  <button
                    type="button"
                    className="image-action-link"
                    onClick={handleDownload}
                    disabled={exporting}
                  >
                    <Icon name="download" size={16} />
                    {exporting
                      ? "Preparing…"
                      : "Download"}
                  </button>

                  <a
                    className="image-action-link image-action-link--secondary"
                    href={baseImageUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View original
                    <Icon name="external" size={16} />
                  </a>
                </div>
              </div>

              <div className="result-image-canvas">
                {imageStatus === "error" ? (
                  <div
                    className="result-image-unavailable"
                    role="status"
                  >
                    <Icon name="image" size={30} />
                    <strong>Preview unavailable</strong>
                    <p>
                      The image could not be loaded.
                      It may have expired on the server.
                    </p>
                  </div>
                ) : (
                  <>
                    {imageStatus === "loading" && (
                      <span
                        className="skeleton result-image-skeleton"
                        aria-hidden="true"
                      />
                    )}

                    <div className="detection-viewport">
                      <img
                        src={baseImageUrl}
                        alt={
                          canOverlay
                            ? "Original image with detection overlay"
                            : "RT-DETR prediction result with object annotations"
                        }
                        className={
                          imageStatus === "loaded"
                            ? "detection-base-image is-loaded"
                            : "detection-base-image"
                        }
                        ref={(node) => {
                          /*
                           * รูปที่ cache ไว้อาจ load
                           * เสร็จก่อน onLoad จะผูก
                           * จึงเช็ค complete ตรงนี้ด้วย
                           */
                          if (
                            node &&
                            node.complete &&
                            node.naturalWidth > 0 &&
                            imageStatus === "loading"
                          ) {
                            setImageStatus("loaded");
                          }
                        }}
                        onLoad={() =>
                          setImageStatus("loaded")
                        }
                        onError={() =>
                          setImageStatus("error")
                        }
                      />

                      {imageStatus === "loaded" &&
                        canOverlay && (
                          <div
                            className="detection-overlay"
                            aria-hidden="true"
                          >
                            {filteredDetections.map(
                              ({
                                detection,
                                sourceIndex,
                              }) => {
                                const box =
                                  detection.bounding_box ??
                                  {};

                                const rgb =
                                  colorForClassId(
                                    detection.class_id
                                  );
                                const color =
                                  rgbString(rgb);

                                const left =
                                  clampPercent(
                                    (Number(box.x1) /
                                      imageWidth) *
                                      100
                                  );
                                const top =
                                  clampPercent(
                                    (Number(box.y1) /
                                      imageHeight) *
                                      100
                                  );
                                const boxWidth =
                                  clampPercent(
                                    ((Number(box.x2) -
                                      Number(box.x1)) /
                                      imageWidth) *
                                      100
                                  );
                                const boxHeight =
                                  clampPercent(
                                    ((Number(box.y2) -
                                      Number(box.y1)) /
                                      imageHeight) *
                                      100
                                  );

                                const confidence =
                                  Math.round(
                                    clampPercent(
                                      Number(
                                        detection.confidence
                                      ) * 100
                                    )
                                  );

                                return (
                                  <div
                                    key={`${detection.class_id}-${sourceIndex}`}
                                    className="detection-box"
                                    style={{
                                      left: `${left}%`,
                                      top: `${top}%`,
                                      width: `${boxWidth}%`,
                                      height: `${boxHeight}%`,
                                      borderColor: color,
                                    }}
                                  >
                                    <span
                                      className="detection-box-label"
                                      style={{
                                        background: color,
                                        color:
                                          labelTextColor(
                                            rgb
                                          ),
                                      }}
                                    >
                                      {detectionClassName(
                                        detection
                                      )}{" "}
                                      {confidence}%
                                    </span>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="detections-section">
            <div className="detections-heading">
              <div className="detections-heading-copy">
                <h3>Detected objects</h3>
                <p>Confidence and bounding box for each result.</p>
              </div>

              <div className="detections-heading-tools">
                <span className="detections-count">
                  {isFiltered
                    ? `${visibleCount} of ${totalCount}`
                    : totalCount}
                  {" "}
                  {totalCount === 1
                    ? "item"
                    : "items"}
                </span>

                {totalCount > 0 && (
                  <ClassFilterDropdown
                    classes={classSummary}
                    selected={selectedClasses}
                    onToggleClass={handleToggleClass}
                    onSetAll={handleSetAll}
                  />
                )}
              </div>
            </div>

            {totalCount > 0 ? (
              visibleCount > 0 ? (
                <>
                  <div
                    className="detection-sort-mobile"
                    role="group"
                    aria-label="Sort detections"
                  >
                    <span className="detection-sort-mobile-label">
                      Sort by
                    </span>

                    <SortControl
                      column="class"
                      label="Class"
                      sort={sort}
                      onSort={handleSort}
                    />

                    <SortControl
                      column="confidence"
                      label="Confidence"
                      sort={sort}
                      onSort={handleSort}
                    />
                  </div>

                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">#</th>

                          <th
                            scope="col"
                            aria-sort={
                              sort.column === "class"
                                ? sort.direction ===
                                  "asc"
                                  ? "ascending"
                                  : "descending"
                                : "none"
                            }
                          >
                            <SortControl
                              column="class"
                              label="Class"
                              sort={sort}
                              onSort={handleSort}
                            />
                          </th>

                          <th
                            scope="col"
                            aria-sort={
                              sort.column ===
                              "confidence"
                                ? sort.direction ===
                                  "asc"
                                  ? "ascending"
                                  : "descending"
                                : "none"
                            }
                          >
                            <SortControl
                              column="confidence"
                              label="Confidence"
                              sort={sort}
                              onSort={handleSort}
                            />
                          </th>

                          <th scope="col">
                            Bounding box
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {sortedDetections.map(
                          (
                            { detection, sourceIndex },
                            index
                          ) => {
                            const confidencePercentage =
                              Math.min(
                                100,
                                Math.max(
                                  0,
                                  Number(
                                    detection.confidence
                                  ) * 100
                                )
                              );

                            const filledSegments =
                              Math.round(
                                confidencePercentage /
                                  10
                              );

                            return (
                              <tr
                                key={`${detection.class_id}-${sourceIndex}`}
                              >
                                <td data-label="#">
                                  <span className="detection-index">
                                    {index + 1}
                                  </span>
                                </td>

                                <td data-label="Class">
                                  <strong className="detection-class">
                                    <span
                                      className="detection-class-swatch"
                                      style={{
                                        background:
                                          rgbString(
                                            colorForClassId(
                                              detection.class_id
                                            )
                                          ),
                                      }}
                                      aria-hidden="true"
                                    />
                                    {detection.class_name}
                                  </strong>
                                </td>

                                <td data-label="Confidence">
                                  <div className="confidence-cell">
                                    <strong>
                                      {confidencePercentage.toFixed(
                                        1
                                      )}
                                      %
                                    </strong>

                                    <span
                                      className="confidence-meter"
                                      aria-hidden="true"
                                    >
                                      {Array.from(
                                        { length: 10 },
                                        (
                                          _,
                                          segmentIndex
                                        ) => (
                                          <span
                                            key={
                                              segmentIndex
                                            }
                                            className={
                                              segmentIndex <
                                              filledSegments
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
                                          detection
                                            .bounding_box
                                            .x1
                                        )}

                                        <span className="coordinate-divider" />

                                        <span className="axis-label">Y</span>
                                        {formatCoordinate(
                                          detection
                                            .bounding_box
                                            .y1
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
                                          detection
                                            .bounding_box
                                            .x2
                                        )}

                                        <span className="coordinate-divider" />

                                        <span className="axis-label">Y</span>
                                        {formatCoordinate(
                                          detection
                                            .bounding_box
                                            .y2
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
                </>
              ) : (
                <div
                  className="no-detections no-detections--filtered"
                  role="status"
                >
                  <span>
                    <Icon name="filter" size={20} />
                  </span>

                  <div>
                    <strong>No classes selected</strong>
                    <p>
                      Select at least one class in the
                      Filter to see its detections.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="clear-detection-filter"
                    onClick={() => handleSetAll(true)}
                  >
                    Select all
                  </button>
                </div>
              )
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
