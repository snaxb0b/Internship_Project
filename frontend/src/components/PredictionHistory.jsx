import { useState } from "react";

import ConfirmationDialog from "./ConfirmationDialog";
import Icon from "./Icon";


function formatPredictionDate(
  isoDate
) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}


function formatFileSize(sizeInBytes) {
  if (
    typeof sizeInBytes !== "number"
  ) {
    return "Unknown size";
  }

  if (sizeInBytes < 1024) {
    return `${sizeInBytes} bytes`;
  }

  const sizeInKilobytes =
    sizeInBytes / 1024;

  if (sizeInKilobytes < 1024) {
    return (
      `${sizeInKilobytes.toFixed(2)} KB`
    );
  }

  const sizeInMegabytes =
    sizeInKilobytes / 1024;

  return (
    `${sizeInMegabytes.toFixed(2)} MB`
  );
}


function HistoryThumbnail({ url }) {
  const [hasFailed, setHasFailed] =
    useState(false);

  if (!url || hasFailed) {
    return <Icon name="image" size={24} />;
  }

  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      onError={() => setHasFailed(true)}
    />
  );
}


function PredictionHistory({
  items,
  selectedId,
  onSelect,
  onRemove,
  onClear,
}) {
  const [isClearDialogOpen, setIsClearDialogOpen] =
    useState(false);
  const [itemPendingRemoval, setItemPendingRemoval] =
    useState(null);


  function handleClearClick() {
    setItemPendingRemoval(null);
    setIsClearDialogOpen(true);
  }


  function handleConfirmClear() {
    onClear();
    setIsClearDialogOpen(false);
  }


  function handleRemoveClick(item) {
    setIsClearDialogOpen(false);
    setItemPendingRemoval(item);
  }


  function handleConfirmRemove() {
    if (!itemPendingRemoval) {
      return;
    }

    onRemove(itemPendingRemoval.id);
    setItemPendingRemoval(null);
  }


  return (
    <>
      <section
        className="panel history-panel"
        id="history"
        aria-labelledby="history-title"
      >
      <div className="history-header">
        <div className="section-heading history-heading">
          <span className="step-number">
            <Icon name="history" size={22} />
          </span>

          <div className="section-heading-copy">
            <span className="section-kicker">
              Step 3
            </span>

            <h2 id="history-title">
              Revisit Recent Predictions
            </h2>

            <p>
              Open your latest results without running
              the same prediction again.
            </p>
          </div>
        </div>

        <div className="history-header-actions">
          <span className="history-count">
            <strong>{items.length}</strong> / 10 saved
          </span>

          <button
            type="button"
            className="clear-history-button"
            onClick={handleClearClick}
            disabled={items.length === 0}
          >
            <Icon name="trash" size={16} />
            Clear all
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-history">
          <span className="empty-history-icon">
            <Icon name="history" size={27} />
          </span>

          <div>
            <strong>No prediction history yet</strong>
            <p>
              Your successful predictions will be saved
              here automatically in this browser.
            </p>
          </div>
        </div>
      ) : (
        <div className="history-list">
          {items.map((item) => {
            const isSelected =
              item.id === selectedId;

            return (
              <article
                key={item.id}
                className={[
                  "history-item",
                  isSelected
                    ? "history-item--selected"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="history-thumbnail">
                  <HistoryThumbnail
                    url={item.result?.result_image_url}
                  />

                  {isSelected && (
                    <span className="history-selected-mark">
                      <Icon name="check" size={13} />
                    </span>
                  )}
                </div>

                <div className="history-item-main">
                  <div className="history-title-row">
                    <div>
                      <strong
                        className="history-filename"
                        title={item.sourceFilename}
                      >
                        {item.sourceFilename}
                      </strong>

                      {isSelected && (
                        <span className="viewing-label">
                          Viewing now
                        </span>
                      )}
                    </div>

                    <time
                      dateTime={item.createdAt}
                    >
                      <Icon name="history" size={14} />
                      {formatPredictionDate(
                        item.createdAt
                      )}
                    </time>
                  </div>

                  <div className="history-meta">
                    <span>
                      <strong>Model</strong>
                      {item.modelName}
                    </span>

                    <span>
                      <strong>Objects</strong>
                      {item.objectCount}
                    </span>

                    <span>
                      <strong>Confidence</strong>
                      {item.confidenceThreshold}
                    </span>

                    <span>
                      <strong>Size</strong>
                      {formatFileSize(
                        item.sourceFileSize
                      )}
                    </span>
                  </div>
                </div>

                <div className="history-actions">
                  <button
                    type="button"
                    className="history-view-button"
                    onClick={() => {
                      onSelect(item);
                    }}
                    disabled={isSelected}
                  >
                    {isSelected ? (
                      <>
                        <Icon name="check" size={16} />
                        Viewing
                      </>
                    ) : (
                      <>
                        View result
                        <Icon name="arrow" size={16} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="history-remove-button"
                    onClick={() => {
                      handleRemoveClick(item);
                    }}
                    aria-label={`Remove ${item.sourceFilename} from history`}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      </section>

      <ConfirmationDialog
        open={isClearDialogOpen}
        title="Clear prediction history?"
        message={
          `This will permanently remove ${items.length} saved prediction${
            items.length === 1 ? "" : "s"
          } from this browser. This action cannot be undone.`
        }
        confirmLabel="Clear all"
        cancelLabel="Cancel"
        onConfirm={handleConfirmClear}
        onClose={() => {
          setIsClearDialogOpen(false);
        }}
      />

      <ConfirmationDialog
        open={Boolean(itemPendingRemoval)}
        title="Remove this prediction?"
        message={
          itemPendingRemoval
            ? `This will permanently remove ${itemPendingRemoval.sourceFilename} from your prediction history. This action cannot be undone.`
            : ""
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={handleConfirmRemove}
        onClose={() => {
          setItemPendingRemoval(null);
        }}
      />
    </>
  );
}


export default PredictionHistory;
