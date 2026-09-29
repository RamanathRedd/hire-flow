import Navbar from "../../components/layout/Navbar";

const Interviews = () => {
  const right = "Next 7 days: 4";

  return (
    <>
      <Navbar left="Interviews" right={right} classString="nav-meta" />
      <table className="jobs-table">
        <thead>
          <tr>
            <th scope="col">
              <button
                className="table-sort-button"
                type="button"
                // onClick={"sortDirection"}
              >
                Candidate{" "}
                <span aria-hidden="true">
                  {"ascending" === "ascending" ? "↑" : "↓"}
                </span>
              </button>
            </th>
            <th scope="col">Job</th>
            <th scope="col">Round</th>
            <th scope="col">Type</th>
            <th scope="col">Scheduled</th>
            <th scope="col">Interviewer</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody />
      </table>
    </>
  );
};

export default Interviews;
