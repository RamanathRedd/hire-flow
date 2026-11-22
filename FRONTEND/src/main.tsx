import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import "./styles/index.css";
import "./styles/error-handling.css";
import App from "./App.tsx";
import { getApiErrorMessage, notifyApiError } from "./api/errors";
import AppErrorBoundary from "./components/layout/AppErrorBoundary";
import ErrorNotifications from "./components/layout/ErrorNotifications";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      notifyApiError({
        message: getApiErrorMessage(error),
        retry: () =>
          queryClient.refetchQueries({
            queryKey: query.queryKey,
            exact: true,
          }),
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.errorHandled === true) return;
      notifyApiError({ message: getApiErrorMessage(error) });
    },
  }),
  defaultOptions: {
    queries: { retry: 1 },
    mutations: { retry: false },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>
        <ErrorNotifications />
        <App />
      </AppErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
);
