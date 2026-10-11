import Navbar from "../../components/layout/Navbar";
import { useGetJobs } from "../../hooks/useJobs";
import { useDepartments } from "../../hooks/useReferenceData";
import type { Job } from "../../types/job";

const BrowseJobs = () => {
  const { data: jobs = [] } = useGetJobs({
    department: null,
    status: null,
    location: null,
  });

  const {
    data: departments,
    isPending: departmentsLoading,
    isError: departmentsError,
  } = useDepartments();

  const locations = [
    { id: 1, name: "Hyderabad" },
    { id: 2, name: "Remote" },
    { id: 3, name: "Bengaluru" },
  ];
  const applyJob = (id: number) => {
    console.log(id);
  };
  return (
    <>
      <Navbar leftTitle="Open roles" rightText="" classString="" />

      <div className="filter-toolbar browser-job-toolbar">
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
            Location
          </option>
          {locations &&
            locations.map((location) => (
              <option value={location.name}>{location.name}</option>
            ))}
        </select>
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
          {jobs
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
                      onClick={() => applyJob(job.id)}
                    >
                      Apply
                    </button>
                  </td>
                </tr>
              ))
            : "No jobs found"}
        </tbody>
      </table>
    </>
  );
};

export default BrowseJobs;
