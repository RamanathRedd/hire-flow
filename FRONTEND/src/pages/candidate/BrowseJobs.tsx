import Navbar from "../../components/layout/Navbar";

const BrowseJobs = () => {
  return (
    <>
      <Navbar left="Open roles" right="" classString="" />

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
          </tr>
        </thead>
        <tbody />
      </table>
    </>
  );
};

export default BrowseJobs;
