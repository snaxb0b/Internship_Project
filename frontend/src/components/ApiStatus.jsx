import Icon from "./Icon";


function ApiStatus({
  status,
  error,
  onRetry,
}) {
  const statusText = {
    checking: "Connecting...",
    online: "Online",
    offline: "Offline",
  };

  return (
    <div
      className={
        `api-status api-status--${status}`
      }
      title={error || statusText[status]}
    >
      <span
        className="api-status-content"
        role="status"
        aria-live="polite"
      >
        <span className="status-dot" />

        <span>
          {statusText[status]}
        </span>

        {error && (
          <span className="sr-only">
            {error}
          </span>
        )}
      </span>

      {status === "offline" && (
        <button
          type="button"
          className="status-retry-button"
          onClick={onRetry}
        >
          <Icon name="refresh" size={14} />
          Retry
        </button>
      )}
    </div>
  );
}


export default ApiStatus;
