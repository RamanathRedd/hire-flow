import axios from "axios";

const NETWORK_ERROR_MESSAGE =
  "Unable to connect to the server. Check your connection and try again.";
const DEFAULT_ERROR_MESSAGE = "The request failed. Please try again.";
const API_ERROR_EVENT = "hireflow:api-error";

export interface ApiErrorNotification {
  message: string;
  retry?: () => Promise<unknown>;
}

export class ApiRequestError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "ApiRequestError";
  }
}

export const notifyApiError = (notification: ApiErrorNotification): void => {
  window.dispatchEvent(
    new CustomEvent<ApiErrorNotification>(API_ERROR_EVENT, {
      detail: notification,
    }),
  );
};

export const apiErrorEventName = API_ERROR_EVENT;

const getValidationMessage = (details: unknown[]): string =>
  details
    .map((detail) => {
      if (typeof detail !== "object" || detail === null || !("msg" in detail)) {
        return null;
      }

      const location =
        "loc" in detail && Array.isArray(detail.loc)
          ? detail.loc
              .filter(
                (part): part is string | number =>
                  typeof part === "string" || typeof part === "number",
              )
              .filter((part) => !["body", "query", "path"].includes(String(part)))
              .join(".")
          : "";
      const message = typeof detail.msg === "string" ? detail.msg : null;

      if (!message) return null;
      return location ? `${location}: ${message}` : message;
    })
    .filter((message): message is string => message !== null)
    .join("; ");

export const getApiErrorMessage = (
  error: unknown,
  fallback = DEFAULT_ERROR_MESSAGE,
): string => {
  if (!axios.isAxiosError(error)) {
    return error instanceof ApiRequestError ? error.message : fallback;
  }

  if (!error.response) return NETWORK_ERROR_MESSAGE;

  const data: unknown = error.response.data;
  if (typeof data === "object" && data !== null) {
    if ("detail" in data) {
      if (typeof data.detail === "string" && data.detail) return data.detail;
      if (Array.isArray(data.detail)) {
        const validationMessage = getValidationMessage(data.detail);
        if (validationMessage) return validationMessage;
      }
    }

    if ("message" in data && typeof data.message === "string" && data.message) {
      return data.message;
    }
    if ("error" in data && typeof data.error === "string" && data.error) {
      return data.error;
    }
  }

  return fallback;
};

export const createApiError = (error: unknown, fallback?: string): Error =>
  new ApiRequestError(getApiErrorMessage(error, fallback), error);

export const createUserFacingError = (message: string): ApiRequestError =>
  new ApiRequestError(message);
