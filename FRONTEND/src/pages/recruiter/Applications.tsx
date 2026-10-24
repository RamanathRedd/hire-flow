import { useEffect, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import { useGetJobApplications, useGetJobs } from "../../hooks/useJobs";
import type { Job } from "../../types/job";
import EmptyPage from "../../components/layout/EmptyPage";
import UpdateApplicationStageModal from "../../components/layout/UpdateApplicationStageModal";

const Applications = () => {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedJobApplications, setSelectedJobApplications] = useState<
    "all" | "needs_attention" | "this_week" | "interview_round" | "offer_stage"
  >("all");
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedCandidateApplication, setSelectedCandidateApplication] =
    useState<any | null>(null);
  const [isUpdateApplicationModalOpen, setIsUpdateApplicationModalOpen] =
    useState<boolean>(false);

  const {
    data: jobs = [],
    isPending: jobsLoading,
    isError: jobsError,
  } = useGetJobs({ department: null, status: null, location: null });

  useEffect(() => {
    if (jobs.length === 0) {
      setSelectedJobId(null);
      return;
    }

    setSelectedJobId(
      (currentSelectedJobId) => currentSelectedJobId ?? jobs[0].id,
    );
  }, [jobs]);

  const convertTime = (time: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(time));
  };

  const {
    data: jobApplications = {
      total_active: 0,
      this_week: 0,
      interview_count: 0,
      offers_pending: 0,
      total_rejected: 0,
      total_hired: 0,
      job_location: "",
      job_department: "",
      applications: [],
    },
    isError: jobApplicationsError,
  } = useGetJobApplications(selectedJobId, {
    this_week: selectedJobApplications === "this_week",
    needs_attention: selectedJobApplications === "needs_attention",
    interview_round: selectedJobApplications === "interview_round",
    offer_stage: selectedJobApplications === "offer_stage",
    stage_filter: stageFilter || null,
    date_applied_filter: dateFilter || null,
  });

  const selectedJob = jobs.find((job: Job) => job.id === selectedJobId);

  const applicationRows = jobApplications.applications
    ? jobApplications.applications
    : [];

  const showNoApplicants =
    jobApplications.total_active === 0 &&
    jobApplications.needs_attention === 0 &&
    jobApplications.this_week === 0 &&
    jobApplications.interview_count === 0 &&
    jobApplications.offers_pending === 0;

  const showEmptyState =
    applicationRows.length === 0 &&
    !stageFilter &&
    !dateFilter &&
    selectedJobApplications === "all" &&
    selectedJobId == jobs[0]?.id;

  const onViewClick = (application: any) => {
    setSelectedCandidateApplication(application);
    setIsDrawerOpen(true);
  };

  return (
    <>
      <div
        className={`recruiter-applications-page${showEmptyState ? " is-empty" : ""}${showNoApplicants && !showEmptyState ? " is-no-applicants" : ""}`}
      >
        <Navbar leftTitle="Applications" rightText="" />
        {showEmptyState ? (
          <EmptyPage
            icon="M9 4.75h-2A1.75 1.75 0 0 0 5.25 6.5v12A1.75 1.75 0 0 0 7 20.25h10a1.75 1.75 0 0 0 1.75-1.75v-12A1.75 1.75 0 0 0 17 4.75h-2M9 4.75A1.75 1.75 0 0 1 10.75 3h2.5A1.75 1.75 0 0 1 15 4.75v1.5H9zM9 11h6M9 14.5h6M9 18h3"
            title="No open jobs to show applicants for"
            subTitle="Publish a job first. Applicants appear here as soon as candidates apply."
            button={{ text: "Go to Jobs", navigation: "/jobs" }}
          />
        ) : (
          <>
            <section
              className="recruiter-applications-job-bar"
              aria-label="Selected job"
            >
              <label htmlFor="applications-job-select">Select Job</label>
              <select
                id="applications-job-select"
                value={selectedJobId ?? ""}
                onChange={(event) => {
                  setSelectedJobId(Number(event.target.value));
                  setSelectedJobApplications("all");
                  setStageFilter(null);
                  setDateFilter(null);
                }}
                disabled={jobsLoading || jobsError || jobs.length === 0}
              >
                {jobs.map((job: Job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
              {selectedJob && (
                <div className="recruiter-applications-job-meta">
                  <span>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 20V8l8-4 8 4v12M8 20v-5h8v5M8 9h.01M12 9h.01M16 9h.01" />
                    </svg>
                    {selectedJob.department}
                  </span>
                  <span>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                    {selectedJob.location}
                  </span>
                  <span>
                    <svg viewBox="0 0 24 24" aria-hidden="true" stroke="none">
                      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.2 0-8 1.6-8 4v2h16v-2c0-2.4-4.8-4-8-4Zm7-2a3.5 3.5 0 1 0-2.1-6.3 5.9 5.9 0 0 1 0 5.6A3.5 3.5 0 0 0 19 12Zm0 2c-.6 0-1.3.1-2 .2 1.3.8 2 1.8 2 2.8v2h4v-2c0-1.8-2-3-4-3Z" />
                    </svg>
                    {selectedJob.applicant_count}{" "}
                    {selectedJob.applicant_count > 1
                      ? "applications"
                      : "application"}
                  </span>
                </div>
              )}
              {jobsError && (
                <span id="jobs-load-error" role="alert">
                  Failed to load jobs. Please try again.
                </span>
              )}
            </section>
            <section
              className="recruiter-application-stats"
              aria-label="Application summary"
            >
              <article
                onClick={() => setSelectedJobApplications("all")}
                className="recruiter-application-stat stat-total"
              >
                <div>
                  <p className="recruiter-application-stat-value">
                    {jobApplications.total_active}
                  </p>
                  <p className="recruiter-application-stat-label">
                    Total applications
                  </p>
                </div>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </article>
              <article
                onClick={() => setSelectedJobApplications("needs_attention")}
                className="recruiter-application-stat stat-attention"
              >
                <div>
                  <p className="recruiter-application-stat-value">
                    {jobApplications.needs_attention}
                  </p>
                  <p className="recruiter-application-stat-label">
                    Needs attention
                  </p>
                </div>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 2.25c.7 0 1.35.37 1.7.98l9.1 15.75c.76 1.31-.19 2.95-1.7 2.95H2.9c-1.51 0-2.46-1.64-1.7-2.95l9.1-15.75c.35-.61 1-.98 1.7-.98Z"
                    stroke="none"
                  />
                  <path
                    d="M11 8h2v6h-2zM11 16h2v2h-2z"
                    fill="#2b171d"
                    stroke="none"
                  />
                </svg>
              </article>
              <article
                onClick={() => setSelectedJobApplications("this_week")}
                className="recruiter-application-stat stat-new"
              >
                <div>
                  <p className="recruiter-application-stat-value">
                    {jobApplications.this_week}
                  </p>
                  <p className="recruiter-application-stat-label">
                    New this week
                  </p>
                </div>
                <span className="recruiter-application-stat-tag">NEW</span>
              </article>
              <article
                onClick={() => setSelectedJobApplications("interview_round")}
                className="recruiter-application-stat stat-interviewing"
              >
                <div>
                  <p className="recruiter-application-stat-value">
                    {jobApplications.interview_count}
                  </p>
                  <p className="recruiter-application-stat-label">
                    Interviewing
                  </p>
                </div>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </article>
              <article
                onClick={() => setSelectedJobApplications("offer_stage")}
                className="recruiter-application-stat stat-offers"
              >
                <div onClick={() => setSelectedJobApplications("offer_stage")}>
                  <p className="recruiter-application-stat-value">
                    {jobApplications.offers_pending}
                  </p>
                  <p className="recruiter-application-stat-label">
                    Offers pending
                  </p>
                </div>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 12h8v1.5H8zm0 4h6v1.5H8z" />
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    stroke="none"
                  />
                  <path d="M14 2v6h6" fill="#2b171d" stroke="none" />
                  <path
                    d="M8 12h8v1.5H8zm0 4h6v1.5H8z"
                    fill="#2b171d"
                    stroke="none"
                  />
                </svg>
              </article>
              {jobApplicationsError && (
                <span id="job-applications-load-error" role="alert">
                  Failed to load job applications. Please try again.
                </span>
              )}
            </section>
            {showNoApplicants ? (
              <EmptyPage
                icon="M9 4.75h-2A1.75 1.75 0 0 0 5.25 6.5v12A1.75 1.75 0 0 0 7 20.25h10a1.75 1.75 0 0 0 1.75-1.75v-12A1.75 1.75 0 0 0 17 4.75h-2M9 4.75A1.75 1.75 0 0 1 10.75 3h2.5A1.75 1.75 0 0 1 15 4.75v1.5H9zM9 11h6M9 14.5h6M9 18h3"
                title="No applicants yet"
                subTitle="Applicants will appear here as soon as candidates apply."
                button={{ text: "Go to Jobs", navigation: "/jobs" }}
              />
            ) : (
              <>
                <section
                  className="recruiter-application-filters"
                  aria-label="Filter applications"
                >
                  <label className="recruiter-application-filter">
                    <span>
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M3 3.5h10M3 8h10M3 12.5h10" />
                        <circle cx="6" cy="3.5" r="1.25" />
                        <circle cx="10" cy="8" r="1.25" />
                        <circle cx="7" cy="12.5" r="1.25" />
                      </svg>
                      Stage
                    </span>
                    <select
                      value={stageFilter ?? ""}
                      onChange={(event) =>
                        setStageFilter(event.target.value || null)
                      }
                    >
                      <option value="">All stages</option>
                      <option value="Applied">Applied</option>
                      <option value="Screened">Screened</option>
                      <option value="Interview_R1">Interview R1</option>
                      <option value="Interview_R2">Interview R2</option>
                      <option value="HR_Round">HR Round</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </label>
                  <label className="recruiter-application-filter">
                    <span>
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
                        <path d="M5 2v3M11 2v3M2.5 6.5h11" />
                      </svg>
                      Date applied
                    </span>
                    <select
                      value={dateFilter ?? ""}
                      onChange={(event) =>
                        setDateFilter(Number(event.target.value) || null)
                      }
                    >
                      <option value="">Any time</option>
                      <option value="1">Today</option>
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                    </select>
                  </label>
                </section>
                <section className="recruiter-application-table-wrap">
                  <table className="recruiter-application-table">
                    <colgroup>
                      <col className="application-column-candidate" />
                      <col className="application-column-stage" />
                      <col className="application-column-applied" />
                      <col className="application-column-duration" />
                      <col className="application-column-action" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th className="application-column-centered">Stage</th>
                        <th>Applied on</th>
                        <th className="application-column-centered">
                          In stage
                        </th>
                        <th className="application-column-centered">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applicationRows.length > 0 ? (
                        applicationRows.map((application: any) => (
                          <tr key={application.id}>
                            <td>
                              <strong className="candidate-name">
                                {application.candidate_name}
                              </strong>
                            </td>
                            <td className="application-column-centered">
                              <span
                                className={`stage-badge stage-${application.stage
                                  .toLowerCase()
                                  .replace(/_/g, "-")}`}
                              >
                                {application.stage.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td>{convertTime(application.applied_at)}</td>
                            <td className="application-column-centered">
                              {application.in_stage} d
                            </td>
                            <td className="application-column-centered">
                              <button
                                type="button"
                                className="application-view-button"
                                aria-label="View application"
                                onClick={() => onViewClick(application)}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="application-empty-state">
                            No job applications found for this job.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </section>
              </>
            )}
          </>
        )}
      </div>

      <div
        id="side-bar-navigation"
        className={`candidate-application-drawer${isDrawerOpen ? " is-open" : ""}`}
        tabIndex={-1}
        aria-labelledby="side-bar-navigation-label"
        aria-hidden={!isDrawerOpen}
      >
        <div className="candidate-application-drawer-header">
          <h2 id="side-bar-navigation-label">Candidate application</h2>
          <button
            type="button"
            aria-controls="side-bar-navigation"
            aria-label="Close candidate application"
            className="candidate-application-close"
            onClick={() => setIsDrawerOpen(false)}
          >
            &times;
          </button>
        </div>
        <div className="candidate-application-content">
          <section
            className="candidate-application-summary"
            aria-label="Application summary"
          >
            <div className="candidate-application-identity">
              <span className="candidate-application-avatar" aria-hidden="true">
                {selectedCandidateApplication?.candidate_name
                  ?.trim()
                  ?.charAt(0)
                  ?.toUpperCase() || "?"}
              </span>
              <div>
                <h3>{selectedCandidateApplication?.candidate_name}</h3>
                <p>
                  {jobApplications.job_department}
                  <span aria-hidden="true"> · </span>
                  {jobApplications.job_location}
                </p>
                <span className="candidate-application-id">
                  APP-
                  {String(selectedCandidateApplication?.id ?? "").padStart(
                    3,
                    "0",
                  )}
                </span>
              </div>
            </div>
            <span
              className={`candidate-application-stage stage-${String(
                selectedCandidateApplication?.stage ?? "",
              )
                .toLowerCase()
                .replace(/_/g, "-")}`}
            >
              {selectedCandidateApplication?.stage.replace(/_/g, " ")}
            </span>
          </section>

          <section
            className="candidate-application-card"
            aria-labelledby="candidate-application-overview"
          >
            <h3 id="candidate-application-overview">Application overview</h3>
            <dl className="candidate-application-overview">
              <div className="candidate-application-detail">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3.5" y="5" width="17" height="16" rx="2" />
                  <path d="M8 3v4M16 3v4M3.5 10h17" />
                </svg>
                <div>
                  <dt>Applied on</dt>
                  <dd>
                    {selectedCandidateApplication?.applied_at
                      ? convertTime(selectedCandidateApplication?.applied_at)
                      : "NA"}
                  </dd>
                </div>
              </div>
              <div className="candidate-application-detail">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                <div>
                  <dt>Time in stage</dt>
                  <dd>
                    {selectedCandidateApplication?.in_stage}{" "}
                    {selectedCandidateApplication?.in_stage === 1
                      ? "day"
                      : "days"}
                  </dd>
                </div>
              </div>
              <div className="candidate-application-detail">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="7" width="18" height="14" rx="2" />
                  <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
                </svg>
                <div>
                  <dt>Job</dt>
                  <dd>{jobApplications.job_department}</dd>
                </div>
              </div>
              <div className="candidate-application-detail">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                <div>
                  <dt>Location</dt>
                  <dd>{jobApplications.job_location}</dd>
                </div>
              </div>
            </dl>
          </section>

          <section
            className="candidate-application-card"
            aria-labelledby="candidate-application-details"
          >
            <h3 id="candidate-application-details">Candidate details</h3>
            <dl className="candidate-application-contact">
              <div>
                <dt>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m4 7 8 6 8-6" />
                  </svg>
                  Email
                </dt>
                <dd>{selectedCandidateApplication?.email}</dd>
              </div>
              <div>
                <dt>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.5 3h3l1.5 4-2 1.5a16 16 0 0 0 6.5 6.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17.8 17.8 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z" />
                  </svg>
                  Phone
                </dt>
                <dd>{selectedCandidateApplication?.phone}</dd>
              </div>
              <div>
                <dt>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="7" width="18" height="14" rx="2" />
                    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
                  </svg>
                  Experience
                </dt>
                <dd>
                  {`${selectedCandidateApplication?.experience_years} ${
                    selectedCandidateApplication?.experience_years === 1
                      ? "year"
                      : "years"
                  }`}
                </dd>
              </div>
              <div>
                <dt>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8" />
                  </svg>
                  Resume
                </dt>
                <dd>
                  <a
                    href={selectedCandidateApplication?.resume_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View resume
                  </a>
                </dd>
              </div>
            </dl>
          </section>

          <section className="candidate-application-notes">
            <h3>Recruiter notes</h3>
            <div className="candidate-application-notes-field">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5" />
              </svg>
              <textarea
                rows={3}
                placeholder="Enter your notes here..."
                required
                aria-label="Recruiter notes"
              />
            </div>
          </section>
        </div>
        {selectedCandidateApplication?.stage != "Applied" && (
          <div className="candidate-application-actions">
            <button type="button" className="candidate-application-reject">
              Reject
            </button>
            <button
              type="button"
              className="candidate-application-update-stage"
              onClick={() => setIsUpdateApplicationModalOpen(true)}
            >
              Update Stage
            </button>
          </div>
        )}
      </div>

      {isUpdateApplicationModalOpen && (
        <UpdateApplicationStageModal
          applicationDetails={selectedCandidateApplication}
          job_department={jobApplications.job_department}
          job_location={jobApplications.job_location}
        />
      )}
    </>
  );
};

export default Applications;
