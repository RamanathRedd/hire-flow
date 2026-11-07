import {
  formatDateDayMonth,
  formatDateDayMonthTime,
} from "../../hooks/useReferenceData";
import { APPLICATION_STAGES } from "../../common";

type ApplicationTimelineProps = {
  currentStage: string;
  interviewer_name?: string | null;
  scheduledAt?: string | null;
  roundType?: string | null;
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
  stageHistory,
  interviewer_name,
  roundType,
  scheduledAt,
}: ApplicationTimelineProps) => {
  const isRejected = currentStage === "Rejected";
  const stages = isRejected
    ? [...APPLICATION_STAGES, "Rejected"]
    : APPLICATION_STAGES;

  const currentStageIndex = stages.indexOf(currentStage);
  const orderedHistory = [...stageHistory].sort(
    (first, second) =>
      new Date(first.created_at).getTime() -
      new Date(second.created_at).getTime(),
  );
  const visibleStages = isRejected
    ? stages.filter((stage) =>
        orderedHistory.some((history) => history.to_stage === stage),
      )
    : stages;

  const round =
    currentStage === "Interview_R1"
      ? "Round 1 · "
      : currentStage === "Interview_R2"
        ? "Round 2 · "
        : "";

  return (
    <section className="application-timeline" aria-label="Application timeline">
      <h3>Application timeline</h3>
      {["Interview_R1", "Interview_R2", "HR_Round"].includes(currentStage) &&
        scheduledAt && (
          <div className="application-upcoming-interview">
            <h4>Upcoming interview</h4>
            <p>
              {round}
              {roundType} · {formatDateDayMonthTime(scheduledAt)}
              {interviewer_name && ` · with ${interviewer_name}`}
            </p>
          </div>
        )}
      <ol className="application-timeline-track">
        {visibleStages.map((stage) => {
          const stageHistoryEntry = orderedHistory.find(
            (history) => history.to_stage === stage,
          );
          const index = stages.indexOf(stage);
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
                  {isCurrent && stage !== "Rejected" && (
                    <span className="application-timeline-current-label">
                      {" "}
                      · current stage
                    </span>
                  )}
                </span>
                {stageHistoryEntry ? (
                  <span className="application-timeline-date">
                    {isCurrent && stage !== "Rejected" ? "Since " : ""}
                    {formatDateDayMonth(stageHistoryEntry.created_at)}{" "}
                    {!["Rejected", "Hired"].includes(stage) && (
                      <>
                        · {stageHistoryEntry.days_in_stage}{" "}
                        {stageHistoryEntry.days_in_stage <= 1 ? "day" : "days"}{" "}
                        in this stage
                      </>
                    )}
                  </span>
                ) : (
                  <span className="application-timeline-date">Not reached</span>
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
