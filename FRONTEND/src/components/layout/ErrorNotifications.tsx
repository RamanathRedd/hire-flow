import { useEffect, useState } from "react";
import {
  apiErrorEventName,
  type ApiErrorNotification,
} from "../../api/errors";

const ErrorNotifications = () => {
  const [notification, setNotification] =
    useState<ApiErrorNotification | null>(null);

  useEffect(() => {
    const handleApiError = (event: Event) => {
      const { detail } = event as CustomEvent<ApiErrorNotification>;
      setNotification(detail);
    };

    window.addEventListener(apiErrorEventName, handleApiError);
    return () => window.removeEventListener(apiErrorEventName, handleApiError);
  }, []);

  if (!notification) return null;

  return (
    <aside className="error-notification" role="alert" aria-live="assertive">
      <p>{notification.message}</p>
      <div className="error-notification-actions">
        {notification.retry && (
          <button
            type="button"
            onClick={() => {
              const retry = notification.retry;
              setNotification(null);
              void retry?.();
            }}
          >
            Retry
          </button>
        )}
        <button type="button" onClick={() => setNotification(null)}>
          Dismiss
        </button>
      </div>
    </aside>
  );
};

export default ErrorNotifications;
