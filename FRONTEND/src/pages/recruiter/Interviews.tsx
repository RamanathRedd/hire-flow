import { useState } from "react";
import Navbar from "../../components/layout/Navbar";
import { useGetJobs } from "../../hooks/useJobs";
import {
  useGetInterviews,
  useUpcomingInterviews,
} from "../../hooks/useInterviews";

const Interviews = () => {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedRoundType, setSelectedRoundType] = useState<string | null>(
    null,
  );
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [allJobs, setAllJobs] = useState<boolean>(true);

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

  const {
    data: jobs = [],
    isPending: jobsLoading,
    isError: jobsError,
  } = useGetJobs({
    department: null,
    status: null,
    location: null,
  });

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

  const allInterviews = () => {
    setAllJobs(true);
  };
  const nextSevenDaysInterviews = () => {
    setAllJobs(false);
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
    </>
  );
};

export default Interviews;
