import { formatDate } from "../../hooks/useReferenceData";

type ApplicationTimelineProps = {
  currentStage: string;
  stageHistory: {
    id: number;
    from_stage: string | null;
    to_stage: string;
    created_at: string;
    days_in_stage: number;
  }[];
};

const APPLICATION_STAGES = [
  "Applied",
  "Screened",
  "Interview_R1",
  "Interview_R2",
  "HR_Round",
  "Offer",
  "Hired",
];

const formatStage = (stage: string) => stage.replaceAll("_", " ");

const ApplicationTimeline = ({
  currentStage,
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
          const previousStageHistoryEntry =
            index > 0
              ? orderedHistory.find(
                  (history) => history.to_stage === stages[index - 1],
                )
              : undefined;
          const isCurrent = index === currentStageIndex;
          const isComplete =
            currentStageIndex >= 0 && index < currentStageIndex;

          return (
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
                  {isCurrent && (
                    <span className="application-timeline-current-label">
                      {" "}
                      · current stage
                    </span>
                  )}
                </span>
                {stageHistoryEntry && (
                  <span className="application-timeline-date">
                    {isCurrent ? "Since " : ""}
                    {formatDate(stageHistoryEntry.created_at)}
                    {stage !== "Applied" &&
                      previousStageHistoryEntry && (
                      <>
                        {" "}
                        - {previousStageHistoryEntry.days_in_stage}{" "}
                        {previousStageHistoryEntry.days_in_stage <= 1
                          ? "day"
                          : "days"}{" "}
                        in {stages[index - 1]}
                      </>
                    )}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default ApplicationTimeline;
