import { useState } from "react";
import Navbar from "../../components/layout/Navbar";
import { useCandidateApplications } from "../../hooks/useApplications";
import ApplicationTimeline from "../../components/layout/ApplicationTimeline";
import { formatDate } from "../../hooks/useReferenceData";
import EmptyPage from "../../components/layout/EmptyPage";

const MyApplications = () => {
  const [allApplications, setAllApplications] = useState<boolean>(true);
  const [activeApplications, setActiveApplications] = useState<boolean>(false);
  const [closedApplications, setClosedApplications] = useState<boolean>(false);
  const [expandedApplicationId, setExpandedApplicationId] = useState<
    number | null
  >(null);

  const getAllApplications = () => {
    setAllApplications(true);
    setActiveApplications(false);
    setClosedApplications(false);
  };

  const getActiveApplications = () => {
    setAllApplications(false);
    setActiveApplications(true);
    setClosedApplications(false);
  };

  const getClosedApplications = () => {
    setAllApplications(false);
    setActiveApplications(false);
    setClosedApplications(true);
  };

  const {
    data: applicationsData = {
      applications: [],
      active_applications: 0,
      closed_applications: 0,
      all_applications: 0,
    },
    isError: applicationsError,
  } = useCandidateApplications(
    activeApplications ? "Active" : closedApplications ? "Closed" : null,
  );

  return (
    <section className="candidate-applications-page">
      <Navbar leftTitle="My applications" rightText="" />
      {applicationsData.applications.length === 0 &&
      !activeApplications &&
      !closedApplications ? (
        <EmptyPage
          icon="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h6"
          title="You have not applied yet"
          subTitle="Roles you apply to show up here with live progress, so you always know where you stand."
          button={{ text: "Browse jobs", navigation: "/browse-jobs" }}
        />
      ) : (
        <>
          <div className="filter-toolbar application-toolbar">
            <button
              type="button"
              className="filter-select application-period-button"
              aria-pressed={allApplications}
              onClick={getAllApplications}
            >
              All - {applicationsData.all_applications}
            </button>
            <button
              type="button"
              className="filter-select application-period-button"
              aria-pressed={activeApplications}
              onClick={getActiveApplications}
            >
              Active - {applicationsData.active_applications}
            </button>
            <button
              type="button"
              className="filter-select application-period-button"
              aria-pressed={closedApplications}
              onClick={getClosedApplications}
            >
              Closed - {applicationsData.closed_applications}
            </button>
            <button
              type="button"
              className="filter-button"
              onClick={getAllApplications}
            >
              Clear Filters
            </button>
          </div>
          {applicationsData.applications.length === 0 ? (
            <EmptyPage
              icon="M3 4h18v4H3zM5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8m-9 4h4"
              title="No closed applications"
              subTitle="Applications that end in an offer accepted or a rejection move here."
              button={{
                text: "Show all",
                onClick: getAllApplications,
              }}
            />
          ) : (
            <>
              <div className="application-list">
                {applicationsData.applications &&
                applicationsData.applications.length > 0
                  ? applicationsData.applications.map((application: any) => {
                      const isRejected = application.stage === "Rejected";
                      const stageStep = Math.min(application.stage_step, 7);

                      const stageLabel = isRejected
                        ? "Closed"
                        : application.stage.replaceAll("_", " ");
                      const isExpanded =
                        expandedApplicationId === application.id;
                      return (
                        <article
                          className="application-card"
                          key={application.id}
                        >
                          <div className="application-card-header">
                            <div>
                              <h2>{application.job_title}</h2>
                              <p className="application-card-meta">
                                {[
                                  application.department,
                                  application.location,
                                  application.job_type,
                                ].join(" · ")}
                              </p>
                            </div>
                            <span
                              className={`application-stage-badge ${
                                isRejected
                                  ? "application-stage-rejected"
                                  : `application-stage-${application.stage.toLowerCase()}`
                              }`}
                            >
                              {stageLabel}
                            </span>
                          </div>

                          {!isRejected ? (
                            <>
                              <div
                                className="application-progress"
                                role="progressbar"
                                aria-label={`Application progress: ${stageLabel}`}
                                aria-valuemin={1}
                                aria-valuemax={7}
                                aria-valuenow={stageStep}
                              >
                                {Array.from({ length: 7 }, (_, index) => (
                                  <span
                                    key={index}
                                    className={
                                      index < stageStep
                                        ? "application-progress-step is-complete"
                                        : "application-progress-step"
                                    }
                                  />
                                ))}
                              </div>
                              <p className="application-step-label">
                                Step {stageStep} of 7
                              </p>
                            </>
                          ) : (
                            <p className="application-step-label">
                              Application closed
                            </p>
                          )}

                          <p className="application-stage-message">
                            {application.rejection_reason ||
                              application.notes ||
                              (isRejected
                                ? "This application has been closed."
                                : `Your application is currently at the ${stageLabel} stage.`)}
                          </p>

                          <div className="application-card-footer">
                            <p>
                              Applied {formatDate(application.applied_at)} ·
                              Updated {formatDate(application.stage_updated_at)}
                            </p>
                            <button
                              type="button"
                              className="application-timeline-button"
                              onClick={() =>
                                setExpandedApplicationId(
                                  isExpanded ? null : application.id,
                                )
                              }
                            >
                              {isExpanded ? "View Less ▲" : "View More ▼"}
                            </button>
                          </div>
                          {isExpanded && (
                            <ApplicationTimeline
                              currentStage={application.stage}
                              stageHistory={application.stage_history}
                            />
                          )}
                        </article>
                      );
                    })
                  : !applicationsError && "No applications Found"}
              </div>
              {applicationsError && (
                <span id="applications-load-error" role="alert">
                  Failed to load applications. Please try again.
                </span>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
};

export default MyApplications;
