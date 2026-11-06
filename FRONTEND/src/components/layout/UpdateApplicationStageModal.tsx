import { useState } from "react";
import { useGetInterviewers } from "../../hooks/useRecruiters";

interface UpdateApplicationStageModalProps {
  stage: string;
  candidateName?: string;
  onCancel: () => void;
  onConfirm: (
    stage: string,
    scheduledAt: string,
    interviewer: number | null,
  ) => void;
}

const UpdateApplicationStageModal = ({
  stage,
  candidateName,
  onCancel,
  onConfirm,
}: UpdateApplicationStageModalProps) => {
  const formattedStage = stage.replace(/_/g, " ");
  const isInterviewStage = !["Applied", "Screened", "Offer"].includes(stage);

  const {
    data: interviewers = [],
    isPending: interviewersLoading,
    isError: interviewersError,
  } = useGetInterviewers();

  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [interviewer, setInterviewer] = useState<number | null>(null);

  return (
    <div className="modal-backdrop">
      <section
        className="save-modal update-application-stage-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-application-stage-title"
        aria-describedby="update-application-stage-description"
      >
        <button
          className="modal-close"
          type="button"
          onClick={onCancel}
          aria-label="Close stage update dialog"
        >
          <span aria-hidden="true">×</span> Close
        </button>

        <div className="save-modal-copy update-application-stage-copy">
          <span className="update-application-stage-eyebrow">
            Application stage
          </span>
          <h2 id="update-application-stage-title">
            Move {candidateName} to {formattedStage}?
          </h2>

          <p id="update-application-stage-description">
            Review the next stage and interview details before continuing.
          </p>
          {isInterviewStage && (
            <div className="update-application-interview-fields">
              <div className="update-application-interview-heading">
                <span>Interview details</span>
                <span>Required</span>
              </div>
              <div className="update-application-interview-field">
                <label htmlFor="schedule-date-time">
                  Date and time<span className="required-field"> *</span>
                </label>
                <input
                  id="schedule-date-time"
                  type="datetime-local"
                  name="scheduledAt"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  required
                />
              </div>
              <div className="update-application-interview-field">
                <label htmlFor="schedule-interviewer">
                  Interviewer<span className="required-field"> *</span>
                </label>
                <select
                  id="schedule-interviewer"
                  name="interviewers"
                  value={interviewer ?? ""}
                  onChange={(event) =>
                    setInterviewer(Number(event.target.value))
                  }
                  disabled={interviewersLoading || interviewersError}
                  required
                >
                  <option value="" disabled hidden>
                    Select Interviewer
                  </option>
                  {interviewers &&
                    interviewers.map(
                      (interviewer: { id: number; name: string }) => (
                        <option key={interviewer.id} value={interviewer.id}>
                          {interviewer.name}
                        </option>
                      ),
                    )}
                </select>
                {interviewersError && (
                  <span id="interviewers-load-error" role="alert">
                    Failed to load interviewers. Please try again.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="update-application-stage-actions">
          <button
            className="modal-button modal-button-secondary"
            type="button"
            onClick={onCancel}
          >
            No
          </button>
          <button
            className="modal-button modal-button-primary"
            type="button"
            onClick={() => onConfirm(stage, scheduledAt, interviewer)}
            disabled={isInterviewStage && (!scheduledAt || !interviewer)}
          >
            Yes
          </button>
        </div>
      </section>
    </div>
  );
};

export default UpdateApplicationStageModal;
