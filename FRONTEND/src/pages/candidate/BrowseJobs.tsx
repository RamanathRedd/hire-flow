import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import { useGetJobs } from "../../hooks/useJobs";
import { useDepartments, useLocations } from "../../hooks/useReferenceData";
import type { Job } from "../../types/job";
import { useApplyJob } from "../../hooks/useApplications";
import Modal from "../../components/ui/Modal";
import { useQueryClient } from "@tanstack/react-query";
import EmptyPage from "../../components/layout/EmptyPage";
import LoadingPage from "../../components/layout/LoadingPage";

const BrowseJobs = () => {
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const departmentFilterRef = useRef<HTMLDetailsElement>(null);
  const locationFilterRef = useRef<HTMLDetailsElement>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [applyingJob, setApplyingJob] = useState<{
    id: number;
    title: string;
  } | null>(null);

  const queryClient = useQueryClient();
  const applyJobMutation = useApplyJob();

  const { data: jobs = [], isPending: jobsLoading } = useGetJobs({
    departments: selectedDepartments,
    statuses: null,
    locations: selectedLocations,
  });

  const {
    data: departments,
    isPending: departmentsLoading,
    isError: departmentsError,
  } = useDepartments();

  const {
    data: locations,
    isPending: locationsLoading,
    isError: locationsError,
  } = useLocations();

  useEffect(() => {
    const closeFiltersOnOutsideClick = (event: PointerEvent) => {
      [departmentFilterRef, locationFilterRef].forEach((filterRef) => {
        if (
          event.target instanceof Node &&
          !filterRef.current?.contains(event.target)
        ) {
          filterRef.current?.removeAttribute("open");
        }
      });
    };

    document.addEventListener("pointerdown", closeFiltersOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeFiltersOnOutsideClick);
  }, []);

  const applyJob = (id: number, title: string) => {
    setApplyingJob({ id, title });
    setIsModalOpen(true);
  };

  const clearFilters = () => {
    setSelectedDepartments([]);
    setSelectedLocations([]);
  };

  const resetDate = () => {
    setIsModalOpen(false);
    setApplyingJob(null);
  };

  const onConfirm = () => {
    applyJobMutation.mutate(Number(applyingJob?.id), {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["jobs"],
        });
        resetDate();
      },
    });
  };

  const showEmptyState =
    jobs.length === 0 &&
    selectedDepartments.length === 0 &&
    selectedLocations.length === 0;

  return (
    <section className="candidate-browse-page">
      <Navbar leftTitle="Open roles" rightText="" classString="" />
      {jobsLoading ? (
        <LoadingPage page="Browse Jobs" />
      ) : (
        <>
          {showEmptyState ? (
            <EmptyPage
              icon="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm-2 0 18 18"
              title="No open roles right now"
              subTitle="New roles are posted regularly. Check back soon, and keep your profile up to date so you are ready."
              button={{
                text: "Update my profile",
                navigation: "/candidate-profile",
              }}
            />
          ) : (
            <>
              <div className="filter-toolbar browser-job-toolbar">
                <details
                  className="department-filter"
                  ref={departmentFilterRef}
                >
                  <summary
                    className="filter-select filter-trigger"
                    aria-label={
                      selectedDepartments.length
                        ? `Departments: ${selectedDepartments.join(", ")}`
                        : "Filter by department"
                    }
                    onClick={(event) => {
                      if (departmentsLoading || departmentsError) {
                        event.preventDefault();
                      }
                    }}
                  >
                    {selectedDepartments.length === 0
                      ? "Department"
                      : `${selectedDepartments.length} selected`}
                  </summary>
                  <div className="department-filter-options">
                    {departments?.map((department) => (
                      <label key={department.id}>
                        <input
                          type="checkbox"
                          checked={selectedDepartments.includes(
                            department.name,
                          )}
                          onChange={(event) => {
                            setSelectedDepartments((current) =>
                              event.target.checked
                                ? [...current, department.name]
                                : current.filter(
                                    (name) => name !== department.name,
                                  ),
                            );
                          }}
                          disabled={departmentsLoading || departmentsError}
                        />
                        {department.name}
                      </label>
                    ))}
                  </div>
                </details>
                {departmentsError && (
                  <span id="department-load-error" role="alert">
                    Failed to load departments. Please try again.
                  </span>
                )}
                <details className="department-filter" ref={locationFilterRef}>
                  <summary
                    className="filter-select filter-trigger"
                    aria-label={
                      selectedLocations.length
                        ? `Locations: ${selectedLocations.join(", ")}`
                        : "Filter by location"
                    }
                    onClick={(event) => {
                      if (locationsLoading || locationsError) {
                        event.preventDefault();
                      }
                    }}
                  >
                    {selectedLocations.length === 0
                      ? "Location"
                      : `${selectedLocations.length} selected`}
                  </summary>
                  <div className="department-filter-options">
                    {locations?.map((location) => (
                      <label key={location.id}>
                        <input
                          type="checkbox"
                          checked={selectedLocations.includes(location.name)}
                          onChange={(event) => {
                            setSelectedLocations((current) =>
                              event.target.checked
                                ? [...current, location.name]
                                : current.filter(
                                    (name) => name !== location.name,
                                  ),
                            );
                          }}
                          disabled={locationsLoading || locationsError}
                        />
                        {location.name}
                      </label>
                    ))}
                  </div>
                </details>
                {locationsError && (
                  <span id="location-load-error" role="alert">
                    Failed to load locations. Please try again.
                  </span>
                )}

                <button
                  type="button"
                  className="filter-button"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
              {jobs.length === 0 ? (
                <EmptyPage
                  icon="M4 5h16l-6.5 7.5v5l-3-1.5v-3.5L4 5zM4 4l16 16"
                  title="No roles match your filters"
                  subTitle="Try a different location or department."
                  button={{ text: "Clear filters", onClick: clearFilters }}
                />
              ) : (
                <div className="responsive-table-wrap">
                  <table className="jobs-table interviews-table">
                    <thead>
                      <tr>
                        <th scope="col">
                          <button
                            className="table-sort-button"
                            type="button"
                            // onClick={"sortDirection"}
                          >
                            Title{" "}
                            <span aria-hidden="true">
                              {"ascending" === "ascending" ? "↑" : "↓"}
                            </span>
                          </button>
                        </th>
                        <th scope="col">Department</th>
                        <th scope="col">Location</th>
                        <th scope="col">Type</th>
                        <th scope="col" aria-label="Actions"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.length > 0
                        ? jobs.map((job: Job) => (
                            <tr key={job.id}>
                              <td>{job.title}</td>
                              <td>{job.department}</td>
                              <td>{job.location}</td>
                              <td>{job.job_type}</td>
                              <td>
                                <button
                                  className="apply-button"
                                  type="button"
                                  onClick={() => applyJob(job.id, job.title)}
                                >
                                  Apply
                                </button>
                              </td>
                            </tr>
                          ))
                        : "No jobs found"}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {isModalOpen && (
        <Modal
          title="Apply for this job?"
          message={`Are you sure you want to submit your application for "${applyingJob?.title}"`}
          cancelText="Cancel"
          confirmText="Apply Job"
          confirmClassString=""
          icon={
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Zm5-2V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 11h18m-8 5 2 2 4-4"
              color="#8ea0ff"
            />
          }
          onConfirm={onConfirm}
          onCancel={resetDate}
        />
      )}
    </section>
  );
};

export default BrowseJobs;
