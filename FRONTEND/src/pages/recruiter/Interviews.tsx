import { useState } from "react";
import Navbar from "../../components/layout/Navbar";
import { useGetJobs } from "../../hooks/useJobs";

const Interviews = () => {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedRoundType, setSelectedRoundType] = useState<string | null>(
    null,
  );
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const interviews = [
    {
      id: 1,
      candidate: "Ramanath Reddy",
      job: "Backend Engineer",
      round: "R1",
      type: "Technical",
      scheduledTime: "Jun 10, 10:00 AM",
      interviewer: "Arjun",
      status: "Scheduled",
    },
    {
      id: 2,
      candidate: "Arjun Patel",
      job: "Backend Engineer",
      round: "R2",
      type: "System Design",
      scheduledTime: "Jun 12, 2:00 PM",
      interviewer: "Riya",
      status: "Scheduled",
    },
    {
      id: 3,
      candidate: "Sameer Iqbal",
      job: "Backend Engineer",
      round: "HR",
      type: "HR",
      scheduledTime: "Jun 6, 11:00 AM",
      interviewer: "Priya",
      status: "Completed",
    },
    {
      id: 4,
      candidate: "Divya Menon",
      job: "Product Designer",
      round: "R1",
      type: "Assignment",
      scheduledTime: "Jun 14, 4:00 PM",
      interviewer: "Karan",
      status: "Scheduled",
    },
  ];
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
    setSelectedStatus(null);
    setSelectedRoundType(null);
    setSelectedJob(null);
  };

  const rightText = "Next 7 days: " + interviews.length;

  return (
    <>
      <Navbar
        leftTitle="Interviews"
        rightText={rightText}
        classString="nav-meta"
      />
      <div className="filter-toolbar interview-toolbar">
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
          value={selectedJob ?? "job-placeholder"}
          onChange={(event) => setSelectedJob(event.target.value)}
          disabled={jobsLoading || jobsError}
        >
          <option value="job-placeholder" disabled hidden>
            Job
          </option>
          {jobs &&
            jobs.map((job: { id: number; title: string }) => (
              <option value={job.title}>{job.title}</option>
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
            ? interviews.map((interview) => (
                <tr key={interview.id}>
                  <td>{interview.candidate}</td>
                  <td>{interview.job}</td>
                  <td>{interview.round}</td>
                  <td>{interview.type}</td>
                  <td>{interview.scheduledTime}</td>
                  <td>{interview.interviewer}</td>
                  <td>
                    <span className={`status-badge ${interview.status}`}>
                      {interview.status}
                    </span>
                  </td>
                </tr>
              ))
            : "No interviews Found"}
        </tbody>
      </table>
    </>
  );
};

export default Interviews;
