import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useGetInterviewers } from "../../hooks/useRecruiters";
import { useLiveApplications } from "../../hooks/useApplications";
import { useScheduleInterview } from "../../hooks/useInterviews";

const InterviewScheduleForm = () => {
  const navigate = useNavigate();
  const [application, setApplication] = useState<number | null>(null);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [roundType, setRoundType] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [interviewer, setInterviewer] = useState<number | null>(null);
  const scheduleInterviewMutation = useScheduleInterview();

  const {
    data: interviewers = [],
    isPending: interviewersLoading,
    isError: interviewersError,
  } = useGetInterviewers();

  const {
    data: applications = [],
    isPending: applicationsLoading,
    isError: applicationsError,
  } = useLiveApplications();

  const onApplicationChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setApplication(Number(event.target.value));
  };

  const onRoundNumberChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRoundNumber(Number(event.target.value));
  };

  const onRoundTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setRoundType(event?.target.value);
  };

  const onInterviewerChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setInterviewer(Number(event?.target.value));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    scheduleInterviewMutation.mutate(
      {
        application_id: application,
        round_number: roundNumber,
        round_type: roundType,
        scheduled_at: scheduledAt,
        interviewer_id: interviewer,
      },
      {
        onSuccess: () => {
          navigate("/interviews");
        },
      },
    );
  };

  return (
    <main className="job-form-page schedule-form-page">
      <form className="schedule-form-card" onSubmit={handleSubmit}>
        <header className="schedule-form-header">
          <div>
            <h1 id="schedule-form-title">Schedule interview</h1>
          </div>
          <button
            className="schedule-form-close"
            type="button"
            onClick={() => navigate("/interviews")}
            aria-label="Close schedule form"
          >
            <span aria-hidden="true">×</span> Close
          </button>
        </header>

        <div className="schedule-form-fields">
          <div className="schedule-form-field schedule-form-field-wide">
            <label htmlFor="schedule-application">
              Application<span className="required-field"> *</span>
            </label>

            <select
              id="schedule-application"
              name="applications"
              value={application ?? ""}
              onChange={onApplicationChange}
              disabled={applicationsLoading || applicationsError}
              required
            >
              <option value="" disabled hidden>
                Select Application
              </option>
              {applications &&
                applications.map((application: any) => (
                  <option key={application.id} value={application.id}>
                    {application.candidate_name} — {application.job_title}
                  </option>
                ))}
            </select>
            {applicationsError && (
              <span id="applications-load-error" role="alert">
                Failed to load applications. Please try again.
              </span>
            )}
          </div>
          <div className="schedule-form-field">
            <label htmlFor="schedule-round-number">
              Round number<span className="required-field"> *</span>
            </label>
            <input
              id="schedule-round-number"
              type="number"
              min="1"
              name="roundNumber"
              value={roundNumber}
              onChange={onRoundNumberChange}
              placeholder="2"
              required
            />
          </div>
          <div className="schedule-form-field">
            <label htmlFor="schedule-round-type">
              Round type<span className="required-field"> *</span>
            </label>
            <select
              id="schedule-round-type"
              name="roundType"
              value={roundType}
              onChange={onRoundTypeChange}
              required
            >
              <option value="" disabled hidden>
                Select Round Type
              </option>
              <option value="Technical">Technical</option>
              <option value="HR">HR</option>
              <option value="System_Design">System Design</option>
              <option value="Assignment">Assignment</option>
            </select>
          </div>
          <div className="schedule-form-field">
            <label htmlFor="schedule-date-time">
              Date & time<span className="required-field"> *</span>
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
          <div className="schedule-form-field">
            <label htmlFor="schedule-interviewer">
              Interviewer<span className="required-field"> *</span>
            </label>
            <select
              id="schedule-interviewer"
              name="interviewers"
              value={interviewer ?? ""}
              onChange={onInterviewerChange}
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

        <footer className="schedule-form-actions">
          <button
            className="schedule-form-cancel"
            type="button"
            onClick={() => navigate("/interviews")}
          >
            Cancel
          </button>
          <button
            className="schedule-form-schedule"
            type="submit"
            name="action"
            value="schedule"
          >
            Schedule
          </button>
        </footer>
      </form>
    </main>
  );
};

export default InterviewScheduleForm;
