import Navbar from "../../components/layout/Navbar";

const Dashboard = () => {
  const button = { text: "+ New job", navigation: "/jobForm" };
  const jobs = [
    {
      id: 1,
      title: "Backend Engineer",
      department: "Engineering",
      location: "Hyderabad",
      status: "Open",
      applicants: 18,
      openings: "2 / 3",
    },
    {
      id: 2,
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      status: "Open",
      applicants: 9,
      openings: "0 / 1",
    },
    {
      id: 3,
      title: "QA Analyst",
      department: "Engineering",
      location: "Bengaluru",
      status: "Draft",
      applicants: 0,
      openings: "0 / 2",
    },
  ];
  return (
    <section>
      <Navbar
        leftTitle="Jobs"
        rightText={button}
        classString="nav-action-button"
      />
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
              jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.title}</td>
                  <td>{job.department}</td>
                  <td>{job.location}</td>
                  <td>
                    <span className={`status-badge ${job.status}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>{job.applicants}</td>
                  <td>{job.openings}</td>
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
