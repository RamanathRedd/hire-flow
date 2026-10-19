import { useEffect, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import {
  useDeleteJob,
  useGetJobs,
  useUpdateJob,
  useUpdateJobStatus,
} from "../../hooks/useJobs";
import type { Job } from "../../types/job";
import { useDepartments, useLocations } from "../../hooks/useReferenceData";
import { useQueryClient } from "@tanstack/react-query";
import Modal from "../../components/ui/Modal";

const Dashboard = () => {
  const button = { text: "+ New job", navigation: "/jobForm" };
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalData, setModalData] = useState<{
    id: number;
    mode: string;
    title: string;
    message: string;
    confirmText: string;
    confirmClassString: string;
    iconColor: string;
  } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null,
  );
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [originalEditJob, setOriginalEditJob] = useState<Job | null>(null);

  const { data: jobs = [] } = useGetJobs({
    department: selectedDepartment,
    status: selectedStatus,
    location: selectedLocation,
  });

  const deleteJobMutation = useDeleteJob();
  const updateJobMutation = useUpdateJob();
  const updateJobStatusMutation = useUpdateJobStatus();

  const hasJobChanges =
    editJob !== null &&
    originalEditJob !== null &&
    (editJob.location !== originalEditJob.location ||
      editJob.job_type !== originalEditJob.job_type ||
      editJob.status !== originalEditJob.status ||
      editJob.openings_count !== originalEditJob.openings_count ||
      editJob.description !== originalEditJob.description ||
      editJob.requirements !== originalEditJob.requirements);

  const [openJobMenu, setOpenJobMenu] = useState<{
    id: number;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (openJobMenu === null) return;

    const closeMenuOnOutsideClick = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        !event.target.closest(".job-actions-cell")
      ) {
        setOpenJobMenu(null);
      }
    };

    document.addEventListener("mousedown", closeMenuOnOutsideClick);
    return () =>
      document.removeEventListener("mousedown", closeMenuOnOutsideClick);
  }, [openJobMenu]);

  const deleteJob = () => {
    if (!openJobMenu) return;
    setIsModalOpen(true);
    setModalData({
      id: openJobMenu.id,
      mode: "delete",
      title: "Delete this job posting?",
      message: `This will permanently delete job "${openJobMenu?.title}"`,
      confirmText: "Delete Job",
      confirmClassString: "job-delete",
      iconColor: "#b91c1c",
    });
  };

  const {
    data: departments = [],
    isPending: departmentsLoading,
    isError: departmentsError,
  } = useDepartments();

  const status = [
    { id: 1, name: "Draft" },
    { id: 2, name: "Open" },
    { id: 3, name: "Closed" },
    { id: 4, name: "On-hold" },
  ];

  const resetModal = () => {
    setIsModalOpen(false);
    setModalData(null);
    setOpenJobMenu(null);
  };

  const onConfirm = () => {
    if (!modalData) return;

    if (modalData.mode === "delete") {
      deleteJobMutation.mutate(modalData.id, {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["jobs"],
          });
          resetModal();
        },
      });
    } else if (modalData.mode === "update") {
      if (!editJob || !originalEditJob) return;

      if (editJob.status != originalEditJob.status) {
        updateJobStatusMutation.mutate(
          {
            job_id: editJob.id,
            status: editJob.status,
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["jobs"],
              });
              resetModal();
              setIsDrawerOpen(false);
            },
          },
        );
      }
      if (
        editJob.location != originalEditJob.location ||
        editJob.job_type != originalEditJob.job_type ||
        editJob.openings_count != originalEditJob.openings_count ||
        editJob.description != originalEditJob.description ||
        editJob.requirements != originalEditJob.requirements
      ) {
        updateJobMutation.mutate(
          {
            job_id: editJob.id,
            jobUpdateDetails: {
              location: editJob.location,
              job_type: editJob.job_type,
              openings_count: editJob.openings_count,
              description: editJob.description,
              requirements: editJob.requirements,
            },
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["jobs"],
              });
              resetModal();
              setIsDrawerOpen(false);
            },
          },
        );
      }
    }
  };

  const {
    data: locations,
    isPending: locationsLoading,
    isError: locationsError,
  } = useLocations();

  const clearFilters = () => {
    setSelectedDepartment(null);
    setSelectedLocation(null);
    setSelectedStatus(null);
  };

  const updateJob = () => {
    if (!editJob) return;
    setIsModalOpen(true);
    setModalData({
      id: editJob.id,
      mode: "update",
      title: "Update this job posting?",
      message: `This will update job "${editJob?.title}"`,
      confirmText: "Update Job",
      confirmClassString: "job-update",
      iconColor: "#4b67f5",
    });
  };

  return (
    <>
      <section>
        <Navbar
          leftTitle="Jobs"
          rightText={button}
          classString="nav-action-button"
        />
        <div className="filter-toolbar">
          <select
            className="filter-select"
            value={selectedDepartment ?? "department-placeholder"}
            onChange={(event) => setSelectedDepartment(event.target.value)}
            disabled={departmentsLoading || departmentsError}
          >
            <option value="department-placeholder" disabled hidden>
              Department
            </option>
            {departments &&
              departments.map((department) => (
                <option key={department.id} value={department.name}>
                  {department.name}
                </option>
              ))}
          </select>
          {departmentsError && (
            <span id="department-load-error" role="alert">
              Failed to load departments. Please try again.
            </span>
          )}
          <select
            className="filter-select"
            value={selectedStatus ?? "status-placeholder"}
            onChange={(event) => setSelectedStatus(event.target.value)}
          >
            <option value="status-placeholder" disabled hidden>
              Status
            </option>
            {status.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={selectedLocation ?? "location-placeholder"}
            onChange={(event) => setSelectedLocation(event.target.value)}
            disabled={locationsLoading || locationsError}
          >
            <option value="location-placeholder" disabled hidden>
              Location
            </option>
            {locations &&
              locations.map((location: { id: number; name: string }) => (
                <option key={location.id} value={location.name}>
                  {location.name}
                </option>
              ))}
          </select>
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
        <div className="content-panel">
          <table className="jobs-table">
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
                <th scope="col">Status</th>
                <th scope="col">Applicants</th>
                <th scope="col">Openings</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length > 0 ? (
                jobs.map((job: Job) => (
                  <tr key={job.id}>
                    <td>{job.title}</td>
                    <td>{job.department}</td>
                    <td>{job.location}</td>
                    <td>
                      <span className={`status-badge ${job.status}`}>
                        {job.status}
                      </span>
                    </td>
                    <td>{job.applicant_count}</td>
                    <td>{job.openings_count - job.filled_count}</td>
                    <td className="job-actions-cell">
                      <button
                        className="job-actions-trigger"
                        type="button"
                        aria-label={`Actions for ${job.title}`}
                        aria-haspopup="menu"
                        aria-expanded={openJobMenu?.id === job.id}
                        onClick={() =>
                          setOpenJobMenu((currentJob) =>
                            currentJob?.id === job.id
                              ? null
                              : { id: job.id, title: job.title },
                          )
                        }
                      >
                        <span aria-hidden="true">⋮</span>
                      </button>
                      {openJobMenu && openJobMenu.id === job.id && (
                        <div className="job-actions-menu" role="menu">
                          <button
                            className="job-actions-menu-item"
                            type="button"
                            role="menuitem"
                            aria-controls="side-bar-navigation"
                            aria-expanded={isDrawerOpen}
                            onClick={() => {
                              setEditJob(job);
                              setOriginalEditJob(job);
                              setIsDrawerOpen(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="job-actions-menu-item job-actions-delete"
                            type="button"
                            role="menuitem"
                            onClick={deleteJob}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>No jobs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
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
              d={
                modalData?.mode === "update"
                  ? "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3"
                  : "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-6 5v6m4-6v6"
              }
              color={modalData?.iconColor ?? ""}
            />
          }
          onConfirm={onConfirm}
          onCancel={resetModal}
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
            Edit Job
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
            <label htmlFor="job-title">Title</label>
            <input
              id="job-title"
              type="text"
              value={editJob?.title ?? ""}
              disabled
            />
          </div>
          <div className="job-edit-field">
            <label htmlFor="job-department">Department</label>
            <input
              id="job-department"
              type="text"
              value={editJob?.department ?? ""}
              disabled
            />
          </div>
          <div className="job-edit-field">
            <label htmlFor="job-location">Location</label>
            <select
              id="job-location"
              name="location"
              value={editJob?.location}
              onChange={(event) =>
                setEditJob((currentJob) =>
                  currentJob
                    ? { ...currentJob, location: event.target.value }
                    : currentJob,
                )
              }
              required
              disabled={locationsLoading || locationsError}
            >
              {locations &&
                locations.map((location: { id: number; name: string }) => (
                  <option key={location.id} value={location.name}>
                    {location.name}
                  </option>
                ))}
            </select>
            {locationsError && (
              <span id="location-load-error" role="alert">
                Failed to load locations. Please try again.
              </span>
            )}
          </div>
          <div className="job-edit-field">
            <label htmlFor="job-status">Status</label>
            <select
              id="job-status"
              name="status"
              value={editJob?.status}
              onChange={(event) =>
                setEditJob((currentJob) =>
                  currentJob
                    ? { ...currentJob, status: event.target.value }
                    : currentJob,
                )
              }
              required
            >
              {status.map((item) => (
                <option key={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="job-edit-field">
            <label htmlFor="job-type">Job Type</label>
            <select
              id="job-type"
              name="jobType"
              value={editJob?.job_type}
              onChange={(event) => {
                setEditJob((currentJob) =>
                  currentJob
                    ? {
                        ...currentJob,
                        job_type: event.target.value,
                      }
                    : currentJob,
                );
              }}
              required
            >
              <option value="Full-time">Full-time</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
          <div className="job-edit-field">
            <label htmlFor="job-openings_count">Opening Count</label>
            <input
              id="job-openings_count"
              name="openings_count"
              type="number"
              value={editJob?.openings_count ?? ""}
              onChange={(event) => {
                setEditJob((currentJob) =>
                  currentJob
                    ? {
                        ...currentJob,
                        openings_count: Number(event.target.value),
                      }
                    : currentJob,
                );
              }}
              placeholder="0"
              required
            />
          </div>
          <div className="job-edit-field">
            <label htmlFor="job-description">Description</label>
            <textarea
              id="job-description"
              name="description"
              value={editJob?.description ?? ""}
              onChange={(event) =>
                setEditJob((currentJob) =>
                  currentJob
                    ? { ...currentJob, description: event.target.value }
                    : currentJob,
                )
              }
              rows={3}
              placeholder="Describe the role and responsibilities"
              required
            />
          </div>
          <div className="job-edit-field">
            <label htmlFor="job-requirements">Requirements</label>
            <textarea
              id="job-requirements"
              name="requirements"
              value={editJob?.requirements ?? ""}
              onChange={(event) =>
                setEditJob((currentJob) =>
                  currentJob
                    ? { ...currentJob, requirements: event.target.value }
                    : currentJob,
                )
              }
              rows={3}
              placeholder="Describe the requirements for this role"
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
              onClick={updateJob}
              disabled={!hasJobChanges}
            >
              Update Job
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
