import Icon from "./Icon";


function ErrorAlert({
  title = "Something went wrong",
  message,
  onRetry,
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      className="error-message"
      role="alert"
    >
      <span className="error-icon">
        <Icon name="alert" size={20} />
      </span>

      <div className="error-content">
        <strong>{title}</strong>

        <p>{message}</p>

        {onRetry && (
          <button
            type="button"
            className="error-retry-button"
            onClick={onRetry}
          >
            <Icon name="refresh" size={15} />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}


export default ErrorAlert;
