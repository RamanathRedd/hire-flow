const LoadingPage = (props: { page: string }) => {
  const { page } = props;
  return (
    <div
      className="data-loading"
      role="status"
      aria-live="polite"
      aria-label={`Loading ${page}`}
    >
      <div className="data-loading-toolbar" aria-hidden="true">
        <span className="loading-skeleton loading-filter" />
        <span className="loading-skeleton loading-filter" />
        <span className="loading-skeleton loading-filter" />
        <span className="loading-skeleton loading-filter loading-clear-button" />
      </div>
      <div className="data-loading-panel" aria-hidden="true">
        <div className="data-loading-header">
          {[0, 1, 2, 3, 4].map((column) => (
            <span
              key={column}
              className="loading-skeleton loading-table-heading"
            />
          ))}
        </div>
        {[0, 1, 2, 3, 4].map((row) => (
          <div className="data-loading-row" key={row}>
            {[0, 1, 2, 3, 4].map((column) => (
              <span
                key={column}
                className={`loading-skeleton loading-table-cell ${
                  column === 3 ? "loading-status" : ""
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingPage;
