import { useEffect, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import { useGetJobs } from "../../hooks/useJobs";
import {
  useCancelInterview,
  useGetInterviews,
  useReScheduleInterview,
  useSubmitInterviewFeedback,
  useUpcomingInterviews,
} from "../../hooks/useInterviews";
import { useGetInterviewers } from "../../hooks/useRecruiters";
import Modal from "../../components/ui/Modal";
import { useQueryClient } from "@tanstack/react-query";

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
  const [reason, setReason] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const cancelInterviewMutation = useCancelInterview();
  const submitInterviewFeedbackMutation = useSubmitInterviewFeedback();
  const reScheduleInterviewMutation = useReScheduleInterview();

  const [modalData, setModalData] = useState<{
    id: number;
    mode: string;
    title: string;
    message: string;
    confirmText: string;
    confirmClassString: string;
    iconColor: string;
    icon: string;
  } | null>(null);

  const interviewFilters = {
    status: selectedStatus,
    round_type: selectedRoundType,
    job_id: selectedJob,
  };
  const allInterviewsQuery = useGetInterviews(interviewFilters, allJobs);
  const upcomingInterviewsQuery = useUpcomingInterviews(
    interviewFilters,
    !allJobs,
  );
  const {
    data: allInterviewsData = { upcoming_interviews: 0, interviews: [] },
    isError: allInterviewsError,
  } = allInterviewsQuery;
  const {
    data: upcomingInterviewsData = { interviews: [] },
    isError: upcomingInterviewsError,
  } = upcomingInterviewsQuery;
  const interviews = allJobs
    ? allInterviewsData.interviews
    : upcomingInterviewsData.interviews;
  const interviewsError = allJobs
    ? allInterviewsError
    : upcomingInterviewsError;

  useEffect(() => {
    if (openInterviewMenu === null) return;

    const closeMenuOnOutsideClick = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        !event.target.closest(".interview-actions-cell")
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

  const getAllInterviews = () => {
    setAllJobs(true);
  };

  const nextSevenDaysInterviews = () => {
    setAllJobs(false);
  };

  const reset = () => {
    setMode("");
    setSideBarTitle("");
    setEditInterview(null);
    setReason(null);
    setRating(0);
    setIsModalOpen(false);
    setAllJobs(true);
  };

  const updateInterview = () => {
    if (mode == "Rescheduled") {
      if (!editInterview?.id) return;
      setIsModalOpen(true);
      setModalData({
        id: editInterview.id,
        mode: "reschedule",
        title: "Reschedule this interview?",
        message:
          "This will update the scheduled date and time for this interview.",
        confirmText: "Reschedule Interview",
        confirmClassString: "reschedule-interview",
        iconColor: "#4b67f5",
        icon: "M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
      });
    } else if (mode == "Cancelled") {
      if (!editInterview?.id) return;
      setIsModalOpen(true);
      setModalData({
        id: editInterview.id,
        mode: "cancel",
        title: "Cancel this interview?",
        message:
          "This will cancel the interview. This action cannot be undone.",
        confirmText: "Cancel Interview",
        confirmClassString: "interview-cancel",
        iconColor: "#b91c1c",
        icon: "M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z",
      });
    } else if (mode == "Completed") {
      if (!editInterview?.id) return;
      setIsModalOpen(true);
      setModalData({
        id: editInterview.id,
        mode: "feedback",
        title: "Submit interview feedback?",
        message:
          "This will submit your feedback and rating for this interview.",
        confirmText: "Submit Feedback",
        confirmClassString: "feedback-submit",
        iconColor: "#4b67f5",
        icon: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
      });
    }
  };

  const onConfirm = () => {
    if (mode == "Completed") {
      submitInterviewFeedbackMutation.mutate(
        {
          interview_id: editInterview.id,
          submit_feedback: {
            feedback: reason ?? "",
            rating,
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["interviews"],
            });
            queryClient.invalidateQueries({
              queryKey: ["upcomingInterviews"],
            });
            reset();
            setIsDrawerOpen(false);
          },
        },
      );
    } else if (mode == "Cancelled") {
      cancelInterviewMutation.mutate(
        {
          interview_id: editInterview.id,
          cancellation_data: reason,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["interviews"],
            });
            queryClient.invalidateQueries({
              queryKey: ["upcomingInterviews"],
            });
            reset();
            setIsDrawerOpen(false);
          },
        },
      );
    } else if (mode == "Rescheduled") {
      reScheduleInterviewMutation.mutate(
        {
          interview_id: editInterview.id,
          interview_details: {
            interviewer_id: editInterview.interviewer_id,
            scheduled_at: editInterview.scheduled_at,
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["interviews"],
            });
            queryClient.invalidateQueries({
              queryKey: ["upcomingInterviews"],
            });
            reset();
            setIsDrawerOpen(false);
          },
        },
      );
    }
  };

  const onCancel = () => {
    setIsModalOpen(false);
  };

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
          onClick={getAllInterviews}
        >
          All
        </button>
        <button
          type="button"
          className="filter-select interview-period-button"
          aria-pressed={!allJobs}
          onClick={nextSevenDaysInterviews}
        >
          Next 7 Days: {allInterviewsData.upcoming_interviews}
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
          value={selectedJob?.toString() ?? "interview-job-placeholder"}
          onChange={(event) => setSelectedJob(Number(event.target.value))}
          disabled={jobsLoading || jobsError}
        >
          <option value="interview-job-placeholder" disabled hidden>
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
          {interviews && interviews.length > 0
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
                  <td className="interview-actions-cell">
                    <button
                      className="interview-actions-trigger"
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
                        <div className="interview-actions-menu" role="menu">
                          {["Scheduled", "Rescheduled"].includes(
                            interview.status,
                          ) && (
                            <>
                              <button
                                className="interview-actions-menu-item"
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
                              <button
                                className="interview-actions-menu-item"
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
                                className="interview-actions-menu-item"
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
                          {interview.status == "Completed" && (
                            <button
                              className="interview-actions-menu-item"
                              type="button"
                              role="menuitem"
                              aria-controls="side-bar-navigation"
                              aria-expanded={isDrawerOpen}
                              onClick={() => {
                                setEditInterview(interview);
                                setMode("Completed");
                                setReason(interview.feedback);
                                setRating(interview.rating);
                                setSideBarTitle("View Feedback");
                                setIsDrawerOpen(true);
                              }}
                            >
                              View Feedback
                            </button>
                          )}
                          {interview.status == "Cancelled" && (
                            <button
                              className="interview-actions-menu-item"
                              type="button"
                              role="menuitem"
                              aria-controls="side-bar-navigation"
                              aria-expanded={isDrawerOpen}
                              onClick={() => {
                                setEditInterview(interview);
                                setMode("Cancelled");
                                setSideBarTitle("Cancelled Reason");
                                setIsDrawerOpen(true);
                              }}
                            >
                              Cancel Reason
                            </button>
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

      {isModalOpen && (
        <Modal
          title={modalData?.title ?? ""}
          message={modalData?.message ?? ""}
          cancelText="Cancel"
          confirmText={modalData?.confirmText ?? ""}
          confirmClassString={modalData?.confirmClassString ?? ""}
          icon={
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={modalData?.icon}
              color={modalData?.iconColor ?? ""}
            />
          }
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )}

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
            onClick={() => {
              setIsDrawerOpen(false);
            }}
            style={{ cursor: "pointer" }}
          >
            x
          </button>
        </div>
        <div className="interview-edit-form">
          <div className="interview-edit-field">
            <label htmlFor="candidate-name">Candidate Name</label>
            <input
              id="candidate-name"
              type="text"
              value={editInterview?.candidate_name ?? ""}
              disabled
            />
          </div>
          <div className="interview-edit-field">
            <label htmlFor="job-title">Job Title</label>
            <input
              id="job-title"
              type="text"
              value={editInterview?.job_title ?? ""}
              disabled
            />
          </div>
          <div className="interview-edit-field">
            <label htmlFor="round-number">Round Number</label>
            <input
              id="round-number"
              type="text"
              value={`R ${editInterview?.round_number ?? ""}`}
              disabled
            />
          </div>
          <div className="interview-edit-field">
            <label htmlFor="round-type">Round Type</label>
            <input
              id="round-type"
              type="text"
              value={editInterview?.round_type ?? ""}
              disabled
            />
          </div>
          <div className="interview-edit-field">
            <label htmlFor="interview-status">Interview Status</label>
            <input id="interview-status" type="text" value={mode} disabled />
          </div>
          <div className="interview-edit-field">
            <label htmlFor="interviewer">Interviewer</label>
            {["Cancelled", "Completed"].includes(mode) ? (
              <input
                id="interviewer"
                type="text"
                value={editInterview?.interviewer_name ?? ""}
                disabled
              />
            ) : (
              <>
                <select
                  id="interviewer"
                  name="interviewers"
                  value={
                    editInterview?.interviewer_id ??
                    interviewers.find(
                      (interviewer: { id: number; name: string }) =>
                        interviewer.name === editInterview?.interviewer_name,
                    )?.id ??
                    ""
                  }
                  onChange={(event) =>
                    setEditInterview((currentInterview: any) =>
                      currentInterview
                        ? {
                            ...currentInterview,
                            interviewer_id: Number(event.target.value),
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
              </>
            )}
          </div>
          <div className="interview-edit-field">
            <label htmlFor="date-time">Date & time</label>
            <input
              id="date-time"
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
              required={mode == "Rescheduled"}
              disabled={mode != "Rescheduled"}
            />
          </div>
          {mode !== "Rescheduled" && (
            <>
              {mode === "Completed" && (
                <div className="interview-edit-field">
                  <label>Rating</label>
                  <div className="flex gap-2 ">
                    {[1, 2, 3, 4, 5].map((option) => (
                      <button
                        key={option}
                        type="button"
                        aria-label={`Rate ${option}`}
                        aria-pressed={rating === option}
                        disabled={sideBarTitle === "View Feedback"}
                        onClick={() => setRating(option)}
                        className="interview-rating-option"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="interview-edit-field">
                <label htmlFor="cancel-feedback-reason">
                  {mode === "Cancelled" ? "Reason (optional)" : "Feedback"}
                </label>
                <textarea
                  id="cancel-feedback-reason"
                  name="reason"
                  value={reason ?? ""}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  placeholder={
                    mode === "Cancelled"
                      ? "e.g. Candidate unavailable, interviewer on leave…"
                      : "Clear communicator, strong culture fit, comfortable with the compensation range…"
                  }
                  required={
                    mode === "Completed" && sideBarTitle != "View Feedback"
                  }
                  disabled={sideBarTitle == "View Feedback"}
                />
              </div>
            </>
          )}
          <div className="interview-edit-actions">
            <button
              className="interview-edit-cancel"
              type="button"
              onClick={() => {
                setIsDrawerOpen(false);
                setRating(0);
                setReason(null);
              }}
            >
              Cancel
            </button>
            {!["View Feedback", "Cancelled Reason"].includes(sideBarTitle) && (
              <button
                className="interview-edit-submit"
                type="submit"
                onClick={updateInterview}
                // disabled={!hasJobChanges}
              >
                {sideBarTitle}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Interviews;
