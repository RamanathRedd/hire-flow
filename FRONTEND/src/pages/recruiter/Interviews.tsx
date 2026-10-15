import { useEffect, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import { useGetJobs } from "../../hooks/useJobs";
import {
  useGetInterviews,
  useUpcomingInterviews,
} from "../../hooks/useInterviews";
import { useGetInterviewers } from "../../hooks/useRecruiters";

const Interviews = () => {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedRoundType, setSelectedRoundType] = useState<string | null>(
    null,
  );
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [allJobs, setAllJobs] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [openInterviewMenu, setOpenInterviewMenu] = useState<any | null>(null);
  const [sideBarTitle, setSideBarTitle] = useState<string>("");
  const [editInterview, setEditInterview] = useState<any>(null);
  const [mode, setMode] = useState<string>("");

  const { data: interviews = [], isError: interviewsError } = allJobs
    ? useGetInterviews({
        status: selectedStatus ?? null,
        round_type: selectedRoundType ?? null,
        job_id: selectedJob ?? null,
      })
    : useUpcomingInterviews({
        status: selectedStatus ?? null,
        round_type: selectedRoundType ?? null,
        job_id: selectedJob ?? null,
      });

  useEffect(() => {
    if (openInterviewMenu === null) return;

    const closeMenuOnOutsideClick = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        !event.target.closest(".job-actions-cell")
      ) {
        setOpenInterviewMenu(null);
      }
    };

    document.addEventListener("mousedown", closeMenuOnOutsideClick);
    return () =>
      document.removeEventListener("mousedown", closeMenuOnOutsideClick);
  }, [openInterviewMenu]);

  const {
    data: jobs = [],
    isPending: jobsLoading,
    isError: jobsError,
  } = useGetJobs({
    department: null,
    status: null,
    location: null,
  });

  const {
    data: interviewers = [],
    isPending: interviewersLoading,
    isError: interviewersError,
  } = useGetInterviewers();

  const clearFilters = () => {
    setAllJobs(true);
    setSelectedStatus(null);
    setSelectedRoundType(null);
    setSelectedJob(null);
  };

  const convertTime = (time: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(time));
  };

  const toDateTimeLocal = (time: string | null | undefined) => {
    if (!time) return "";

    const date = new Date(time);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const allInterviews = () => {
    setAllJobs(true);
  };
  const nextSevenDaysInterviews = () => {
    setAllJobs(false);
  };

  const updateInterview = () => {};

  const button = {
    text: "+ Schedule interview",
    navigation: "/interviewScheduleForm",
  };

  return (
    <>
      <Navbar
        leftTitle="Interviews"
        rightText={button}
        classString="nav-action-button"
      />
      <div className="filter-toolbar interview-toolbar">
        <button
          type="button"
          className="filter-select interview-period-button"
          aria-pressed={allJobs}
          onClick={allInterviews}
        >
          All
        </button>
        <button
          type="button"
          className="filter-select interview-period-button"
          aria-pressed={!allJobs}
          onClick={nextSevenDaysInterviews}
        >
          Next 7 Days
        </button>
        <select
          className="filter-select"
          value={selectedStatus ?? "status-placeholder"}
          onChange={(event) => setSelectedStatus(event.target.value)}
        >
          <option value="status-placeholder" disabled hidden>
            Status
          </option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Rescheduled">Rescheduled</option>
        </select>
        <select
          className="filter-select"
          value={selectedRoundType ?? "round-type-placeholder"}
          onChange={(event) => setSelectedRoundType(event.target.value)}
        >
          <option value="round-type-placeholder" disabled hidden>
            Round Type
          </option>
          <option value="Technical">Technical</option>
          <option value="HR">HR</option>
          <option value="System_Design">System Design</option>
          <option value="Assignment">Assignment</option>
        </select>
        <select
          className="filter-select"
          value={selectedJob?.toString() ?? "job-placeholder"}
          onChange={(event) => setSelectedJob(Number(event.target.value))}
          disabled={jobsLoading || jobsError}
        >
          <option value="job-placeholder" disabled hidden>
            Job
          </option>
          {jobs &&
            jobs.map((job: { id: number; title: string }) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
        </select>
        {jobsError && (
          <span id="location-load-error" role="alert">
            Failed to load jobs. Please try again.
          </span>
        )}
        <button type="button" className="filter-button" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>
      <table className="jobs-table interviews-table">
        <thead>
          <tr>
            <th scope="col">
              <button
                className="table-sort-button"
                type="button"
                // onClick={"sortDirection"}
              >
                Candidate{" "}
                <span aria-hidden="true">
                  {"ascending" === "ascending" ? "↑" : "↓"}
                </span>
              </button>
            </th>
            <th scope="col">Job</th>
            <th scope="col">Round</th>
            <th scope="col">Type</th>
            <th scope="col">Scheduled</th>
            <th scope="col">Interviewer</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {interviews.length > 0
            ? interviews.map((interview: any) => (
                <tr key={interview.id}>
                  <td>{interview.candidate_name}</td>
                  <td>{interview.job_title}</td>
                  <td>R{interview.round_number}</td>
                  <td>{interview.round_type}</td>
                  <td>{convertTime(interview.scheduled_at)}</td>
                  <td>{interview.interviewer_name}</td>
                  <td>
                    <span
                      className={`status-badge ${interview.status} interview-badge`}
                    >
                      {interview.status}
                    </span>
                  </td>
                  <td className="job-actions-cell">
                    <button
                      className="job-actions-trigger"
                      type="button"
                      aria-label={`Actions for ${interview.candidate_name} - ${interview.job_title}`}
                      aria-haspopup="menu"
                      aria-expanded={openInterviewMenu?.id === interview.id}
                      onClick={() =>
                        setOpenInterviewMenu((currentInterview: any) =>
                          currentInterview?.id === interview.id
                            ? null
                            : {
                                id: interview.id,
                                interview_details: `${interview.candidate_name} - ${interview.job_title}`,
                              },
                        )
                      }
                    >
                      <span aria-hidden="true">⋮</span>
                    </button>
                    {openInterviewMenu &&
                      openInterviewMenu.id === interview.id && (
                        <div className="job-actions-menu" role="menu">
                          {interview.status != "Completed" && (
                            <button
                              className="job-actions-menu-item"
                              type="button"
                              role="menuitem"
                              aria-controls="side-bar-navigation"
                              aria-expanded={isDrawerOpen}
                              onClick={() => {
                                setEditInterview(interview);
                                setMode("Rescheduled");
                                //   setOriginalEditJob(job);
                                setSideBarTitle("Reschedule Interview");
                                setIsDrawerOpen(true);
                              }}
                            >
                              Reschedule
                            </button>
                          )}
                          {["Scheduled", "Rescheduled"].includes(
                            interview.status,
                          ) && (
                            <>
                              <button
                                className="job-actions-menu-item"
                                type="button"
                                role="menuitem"
                                aria-controls="side-bar-navigation"
                                aria-expanded={isDrawerOpen}
                                onClick={() => {
                                  setEditInterview(interview);
                                  setMode("Cancelled");
                                  setSideBarTitle("Cancel Interview");
                                  setIsDrawerOpen(true);
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                className="job-actions-menu-item"
                                type="button"
                                role="menuitem"
                                aria-controls="side-bar-navigation"
                                aria-expanded={isDrawerOpen}
                                onClick={() => {
                                  setEditInterview(interview);
                                  setMode("Completed");
                                  setSideBarTitle("Submit Feedback");
                                  setIsDrawerOpen(true);
                                }}
                              >
                                Close
                              </button>
                            </>
                          )}
                        </div>
                      )}
                  </td>
                </tr>
              ))
            : !interviewsError && "No interviews Found"}
          {interviewsError && (
            <span id="interview-load-error" role="alert">
              Failed to load interviews. Please try again.
            </span>
          )}
        </tbody>
      </table>

      <div
        id="side-bar-navigation"
        className={`fixed top-0 right-0 z-40 h-screen w-85 overflow-y-auto border-s border-default bg-[#11161d] p-4 transition-transform ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        tabIndex={-1}
        aria-labelledby="side-bar-navigation-label"
        aria-hidden={!isDrawerOpen}
      >
        <div className="border-b border-default pb-4 flex items-center">
          <span
            id="side-bar-navigation-label"
            className="self-center text-lg font-semibold whitespace-nowrap text-heading"
          >
            {sideBarTitle}
          </span>
          <button
            type="button"
            aria-controls="side-bar-navigation"
            aria-label="Close navigation"
            className="text-body bg-transparent hover:text-heading hover:bg-neutral-tertiary rounded-base w-9 h-9 absolute top-2.5 end-2.5 flex items-center justify-center"
            onClick={() => setIsDrawerOpen(false)}
            style={{ cursor: "pointer" }}
          >
            x
          </button>
        </div>
        <div className="job-edit-form">
          <div className="job-edit-field">
            <label htmlFor="job-title">Candidate Name</label>
            <input
              id="job-title"
              type="text"
              value={editInterview?.candidate_name ?? ""}
              disabled
            />
          </div>
          <div className="job-edit-field">
            <label htmlFor="job-title">Job Title</label>
            <input
              id="job-title"
              type="text"
              value={editInterview?.job_title ?? ""}
              disabled
            />
          </div>
          <div className="job-edit-field">
            <label htmlFor="job-title">Round Number</label>
            <input
              id="job-title"
              type="text"
              value={`R ${editInterview?.round_number ?? ""}`}
              disabled
            />
          </div>
          <div className="job-edit-field">
            <label htmlFor="job-title">Round Type</label>
            <input
              id="job-title"
              type="text"
              value={editInterview?.round_type ?? ""}
              disabled
            />
          </div>
          <div className="job-edit-field">
            <label htmlFor="job-title">Interview Status</label>
            <input id="job-title" type="text" value={mode} disabled />
            {/* <select
              id="job-title"
              name="status"
              value={editInterview?.status ?? ""}
              onChange={(event) =>
                setEditInterview((currentInterview: any) =>
                  currentInterview
                    ? { ...currentInterview, status: event.target.value }
                    : currentInterview,
                )
              }
              required
              disabled={mode == "Reschedule"}
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Rescheduled">Rescheduled</option>
            </select> */}
          </div>
          <div className="schedule-form-field">
            <label htmlFor="schedule-interviewer">
              Interviewer<span className="required-field"> *</span>
            </label>
            <select
              id="schedule-interviewer"
              name="interviewers"
              value={editInterview?.interviewer_name ?? ""}
              onChange={(event) =>
                setEditInterview((currentInterview: any) =>
                  currentInterview
                    ? {
                        ...currentInterview,
                        interviewer_name: event.target.value,
                      }
                    : currentInterview,
                )
              }
              disabled={interviewersLoading || interviewersError}
              required
            >
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
          <div className="schedule-form-field">
            <label htmlFor="schedule-date-time">
              Date & time<span className="required-field"> *</span>
            </label>
            <input
              id="schedule-date-time"
              type="datetime-local"
              name="scheduledAt"
              value={toDateTimeLocal(editInterview?.scheduled_at)}
              onChange={(event) =>
                setEditInterview((currentInterview: any) =>
                  currentInterview
                    ? {
                        ...currentInterview,
                        scheduled_at: event.target.value,
                      }
                    : currentInterview,
                )
              }
              required
            />
          </div>
          <div className="job-edit-actions">
            <button
              className="job-edit-cancel"
              type="button"
              onClick={() => setIsDrawerOpen(false)}
            >
              Cancel
            </button>
            <button
              className="job-edit-submit"
              type="submit"
              onClick={updateInterview}
              // disabled={!hasJobChanges}
            >
              Update Interview
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Interviews;
