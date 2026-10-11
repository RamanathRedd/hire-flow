import { useEffect, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import { useDeleteJob, useGetJobs } from "../../hooks/useJobs";
import type { Job } from "../../types/job";
import { useDepartments, useLocations } from "../../hooks/useReferenceData";
import { useQueryClient } from "@tanstack/react-query";
import Modal from "../../components/ui/Modal";

const Dashboard = () => {
  const button = { text: "+ New job", navigation: "/jobForm" };
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const { data: jobs = [] } = useGetJobs({
    department: null,
    status: null,
    location: null,
  });

  const deleteJobMutation = useDeleteJob();
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
    setIsModalOpen(true);
  };

  const {
    data: departments,
    isPending: departmentsLoading,
    isError: departmentsError,
  } = useDepartments();

  const status = [
    { id: 1, name: "Draft" },
    { id: 2, name: "Open" },
    { id: 3, name: "Closed" },
    { id: 4, name: "On-hold" },
  ];

  const onConfirm = () => {
    deleteJobMutation.mutate(Number(openJobMenu?.id), {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["jobs"],
        });
        setIsModalOpen(false);
        setOpenJobMenu(null);
      },
    });
  };

  const onCancel = () => {
    setIsModalOpen(false);
    setOpenJobMenu(null);
  };

  const {
    data: locations,
    isPending: locationsLoading,
    isError: locationsError,
  } = useLocations();

  [
    { id: 1, name: "Hyderabad" },
    { id: 2, name: "Remote" },
    { id: 3, name: "Bengaluru" },
  ];
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
            defaultValue=""
            disabled={departmentsLoading || departmentsError}
          >
            <option value="" disabled hidden>
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
          <select className="filter-select" defaultValue="">
            <option value="" disabled hidden>
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
            defaultValue=""
            disabled={locationsLoading || locationsError}
          >
            <option value="" disabled hidden>
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
              {jobs ? (
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
                            onClick={() => setOpenJobMenu(null)}
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
          title="Delete this job posting?"
          message={`This will permanently delete "${openJobMenu?.title}"`}
          cancelText="Cancel"
          confirmText="Delete Job"
          confirmClassString="job-delete"
          icon={
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-6 5v6m4-6v6"
              color="#b91c1c"
            />
          }
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )}
    </>
  );
};

export default Dashboard;
