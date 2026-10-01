import Navbar from "../../components/layout/Navbar";

const BrowseJobs = () => {
  const jobs = [
    {
      id: 1,
      title: "Backend Engineer",
      department: "Engineering",
      location: "Hyderabad",
      type: "Full time",
    },
    {
      id: 2,
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      type: "Full time",
    },
  ];
  const applyJob = () => {};
  return (
    <>
      <Navbar leftTitle="Open roles" rightText="" classString="" />

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
            <th scope="col">Type</th>
            <th scope="col" aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          {jobs.length > 0
            ? jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.title}</td>
                  <td>{job.department}</td>
                  <td>{job.location}</td>
                  <td>{job.type}</td>
                  <td>
                    <button className="apply-button" type="button" onClick={applyJob}>
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
