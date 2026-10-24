import Navbar from "../../components/layout/Navbar";
import { useApplicationCounts } from "../../hooks/useApplications";

const Analytics = () => {
  const {
    data: funnelStages = [],
    isPending: stagesLoading,
    isError: stagesError,
  } = useApplicationCounts();

  const totalApplications = funnelStages[funnelStages.length - 1].count || 0;

  const summaryMetrics = [
    { value: totalApplications, label: "Active applications" },
    { value: "37%", label: "Screen → Interview" },
    { value: "6.2d", label: "Avg. time in stage" },
    { value: "64%", label: "Offer acceptance" },
  ];

  return (
    <section className="analytics-card" aria-label="Overall funnel">
      <Navbar leftTitle="Overall funnel" rightText="" classString="" />
      <div className="analytics-summary">
        {summaryMetrics.map((metric) => (
          <div className="analytics-metric" key={metric.label}>
            <p className="analytics-metric-value">{metric.value}</p>
            <p className="analytics-metric-label">{metric.label}</p>
          </div>
        ))}
      </div>

      <div className="analytics-funnel" aria-label="Applications by stage">
        {funnelStages.map((stage: { label: string; count: number }) => {
          const percentage = (stage.count / totalApplications) * 100;

          return (
            <>
              {!["All", "Rejected"].includes(stage.label) && (
                <div className="analytics-stage" key={stage.label}>
                  <span className="analytics-stage-label">{stage.label}</span>
                  <div
                    className="analytics-stage-track"
                    role="progressbar"
                    aria-label={`${stage.label} applications`}
                    aria-valuemin={0}
                    aria-valuemax={totalApplications}
                    aria-valuenow={stage.count}
                  >
                    <span
                      className="analytics-stage-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="analytics-stage-count">{stage.count}</span>
                </div>
              )}
              {stagesLoading && <p>Loading...</p>}
              {stagesError && <p>Error loading data</p>}
            </>
          );
        })}
      </div>
    </section>
  );
};

export default Analytics;
