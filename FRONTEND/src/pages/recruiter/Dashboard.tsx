import Navbar from "../../components/layout/Navbar";

const Dashboard = () => {
  const button = { text: "+ New job", navigation: "/jobForm" };
  return (
    <section>
      <Navbar left="Jobs" right={button} classString="nav-action-button" />
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
          <tbody />
        </table>
      </div>
    </section>
  );
};

export default Dashboard;
