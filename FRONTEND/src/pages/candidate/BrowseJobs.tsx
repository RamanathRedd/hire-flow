import { useState } from "react";
import Navbar from "../../components/layout/Navbar";
import { useGetJobs } from "../../hooks/useJobs";
import { useDepartments, useLocations } from "../../hooks/useReferenceData";
import type { Job } from "../../types/job";
import { useApplyJob } from "../../hooks/useApplications";
import Modal from "../../components/ui/Modal";
import { useQueryClient } from "@tanstack/react-query";
import EmptyPage from "../../components/layout/EmptyPage";

const BrowseJobs = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null,
  );
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [applyingJob, setApplyingJob] = useState<{
    id: number;
    title: string;
  } | null>(null);

  const queryClient = useQueryClient();
  const applyJobMutation = useApplyJob();

  const { data: jobs = [] } = useGetJobs({
    department: selectedDepartment,
    status: null,
    location: selectedLocation,
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

  const applyJob = (id: number, title: string) => {
    setApplyingJob({ id, title });
    setIsModalOpen(true);
  };

  const clearFilters = () => {
    setSelectedDepartment(null);
    setSelectedLocation(null);
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

  return (
    <section className="candidate-browse-page">
      <Navbar leftTitle="Open roles" rightText="" classString="" />
      {jobs.length === 0 && !selectedDepartment && !selectedLocation ? (
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
            <select
              className="filter-select"
              defaultValue=""
              disabled={departmentsLoading || departmentsError}
              value={selectedDepartment ?? "department-placeholder"}
              onChange={(event) => setSelectedDepartment(event.target.value)}
            >
              <option value="department-placeholder" disabled hidden>
                Department
              </option>
              {departments &&
                departments.map((department) => (
                  <option value={department.name}>{department.name}</option>
                ))}
            </select>
            {departmentsError && (
              <span id="department-load-error" role="alert">
                Failed to load departments. Please try again.
              </span>
            )}
            <select
              className="filter-select"
              defaultValue=""
              disabled={locationsLoading || locationsError}
              value={selectedLocation ?? "location-placeholder"}
              onChange={(event) => setSelectedLocation(event.target.value)}
            >
              <option value="location-placeholder" disabled hidden>
                Location
              </option>
              {locations &&
                locations.map((location) => (
                  <option value={location.name}>{location.name}</option>
                ))}
            </select>
            {locationsError && (
              <span id="location-load-error" role="alert">
                Failed to load locations. Please try again.
              </span>
            )}

            <button
              type="button"
              className="filter-button browse-jobs"
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
          )}
        </>
      )}

      {isModalOpen && (
        <Modal
          title="Apply for this job?"
          message={`Are you sure you want to submit your application for "${applyingJob?.title}"`}
          cancelText="Cancel"
          confirmText="Apply Job"
          confirmClassString="candidate-profile"
          icon={
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Zm5-2V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 11h18m-8 5 2 2 4-4"
              color="#16b3a1"
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
