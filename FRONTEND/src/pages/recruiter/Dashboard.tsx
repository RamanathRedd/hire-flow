import { useEffect, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import { useDeleteJob, useGetJobs } from "../../hooks/useJobs";
import type { Job } from "../../types/job";

const Dashboard = () => {
  const button = { text: "+ New job", navigation: "/jobForm" };
  const { data: jobs = [] } = useGetJobs({
    department: null,
    status: null,
    location: null,
  });

  const deleteJobMutation = useDeleteJob();
  const [openJobMenuId, setOpenJobMenuId] = useState<Job["id"] | null>(null);

  useEffect(() => {
    if (openJobMenuId === null) return;

    const closeMenuOnOutsideClick = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        !event.target.closest(".job-actions-cell")
      ) {
        setOpenJobMenuId(null);
      }
    };

    document.addEventListener("mousedown", closeMenuOnOutsideClick);
    return () =>
      document.removeEventListener("mousedown", closeMenuOnOutsideClick);
  }, [openJobMenuId]);

  const deleteJob = () => {
    deleteJobMutation.mutate(Number(openJobMenuId), {
      onSuccess: () => {},
    });
    setOpenJobMenuId(null);
  };

  const departments = [
    { id: 1, name: "Engineering" },
    { id: 2, name: "Design" },
  ];
  const locations = [
    { id: 1, name: "Hyderabad" },
    { id: 2, name: "Remote" },
    { id: 3, name: "Bengaluru" },
  ];
  return (
    <section>
      <Navbar
        leftTitle="Jobs"
        rightText={button}
        classString="nav-action-button"
      />
      <div className="filter-toolbar">
        <select className="filter-select" defaultValue="">
          <option value="" disabled hidden>
            Department
          </option>
          {departments &&
            departments.map((department) => (
              <option value={department.name}>{department.name}</option>
            ))}
        </select>
        <select className="filter-select" defaultValue="">
          <option value="" disabled hidden>
            Status
          </option>
          <option value="Draft">Draft</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
          <option value="On_hold">On_hold</option>
        </select>
        <select className="filter-select" defaultValue="">
          <option value="" disabled hidden>
            Location
          </option>
          {locations &&
            locations.map((location) => (
              <option value={location.name}>{location.name}</option>
            ))}
        </select>
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
                      aria-expanded={openJobMenuId === job.id}
                      onClick={() =>
                        setOpenJobMenuId((currentId) =>
                          currentId === job.id ? null : job.id,
                        )
                      }
                    >
                      <span aria-hidden="true">⋮</span>
                    </button>
                    {openJobMenuId === job.id && (
                      <div className="job-actions-menu" role="menu">
                        <button
                          className="job-actions-menu-item"
                          type="button"
                          role="menuitem"
                          onClick={() => setOpenJobMenuId(null)}
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
  );
};

export default Dashboard;
