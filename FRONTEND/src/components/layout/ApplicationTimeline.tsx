import { formatDate } from "../../hooks/useReferenceData";
import { APPLICATION_STAGES } from "../../common";

type ApplicationTimelineProps = {
  currentStage: string;
  isRejected: boolean;
  stageHistory: {
    id: number;
    from_stage: string | null;
    to_stage: string;
    created_at: string;
    days_in_stage: number;
  }[];
};

const formatStage = (stage: string) => stage.replaceAll("_", " ");

const ApplicationTimeline = ({
  currentStage,
  isRejected,
  stageHistory,
}: ApplicationTimelineProps) => {
  const stages =
    currentStage === "Rejected"
      ? [...APPLICATION_STAGES, "Rejected"]
      : APPLICATION_STAGES;

  const currentStageIndex = stages.indexOf(currentStage);
  const orderedHistory = [...stageHistory].sort(
    (first, second) =>
      new Date(first.created_at).getTime() -
      new Date(second.created_at).getTime(),
  );

  return (
    <section className="application-timeline" aria-label="Application timeline">
      <h3>Application timeline</h3>
      <ol className="application-timeline-track">
        {stages.map((stage, index) => {
          const stageHistoryEntry = orderedHistory.find(
            (history) => history.to_stage === stage,
          );
          const isCurrent = index === currentStageIndex;
          const isComplete =
            currentStageIndex >= 0 && index < currentStageIndex;

          return (
            <>
              {stageHistoryEntry && (
                <li
                  className={[
                    "application-timeline-stage",
                    isComplete && "is-complete",
                    isCurrent && "is-current",
                    stage === "Rejected" && "is-rejected",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={stage}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <span
                    className="application-timeline-marker"
                    aria-hidden="true"
                  />
                  <div className="application-timeline-entry">
                    <span className="application-timeline-transition">
                      {formatStage(stage)}
                      {isCurrent && stage !== "Rejected" && (
                        <span className="application-timeline-current-label">
                          {" "}
                          · current stage
                        </span>
                      )}
                    </span>
                    <span className="application-timeline-date">
                      {isCurrent && stage !== "Rejected" ? "Since " : ""}
                      {formatDate(stageHistoryEntry.created_at)}{" "}
                      {!["Rejected", "Hired"].includes(stage) && (
                        <>
                          · {stageHistoryEntry.days_in_stage}{" "}
                          {stageHistoryEntry.days_in_stage <= 1
                            ? "day"
                            : "days"}{" "}
                          in this stage
                        </>
                      )}
                    </span>
                  </div>
                </li>
              )}
            </>
          );
        })}
      </ol>
    </section>
  );
};

export default ApplicationTimeline;
