import Navbar from "../../components/layout/Navbar";

const Interviews = () => {
  const rightText = "Next 7 days: 4";
  const interviews = [
    {
      id: 1,
      candidate: "Ramanath Reddy",
      job: "Backend Engineer",
      round: "R1",
      type: "Technical",
      scheduledTime: "Jun 10, 10:00 AM",
      interviewer: "Arjun",
      status: "Scheduled",
    },
    {
      id: 2,
      candidate: "Arjun Patel",
      job: "Backend Engineer",
      round: "R2",
      type: "System Design",
      scheduledTime: "Jun 12, 2:00 PM",
      interviewer: "Riya",
      status: "Scheduled",
    },
    {
      id: 3,
      candidate: "Sameer Iqbal",
      job: "Backend Engineer",
      round: "HR",
      type: "HR",
      scheduledTime: "Jun 6, 11:00 AM",
      interviewer: "Priya",
      status: "Completed",
    },
    {
      id: 4,
      candidate: "Divya Menon",
      job: "Product Designer",
      round: "R1",
      type: "Assignment",
      scheduledTime: "Jun 14, 4:00 PM",
      interviewer: "Karan",
      status: "Scheduled",
    },
  ];

  return (
    <>
      <Navbar
        leftTitle="Interviews"
        rightText={rightText}
        classString="nav-meta"
      />
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
        <tbody>
          {interviews.length > 0
            ? interviews.map((interview) => (
                <tr key={interview.id}>
                  <td>{interview.candidate}</td>
                  <td>{interview.job}</td>
                  <td>{interview.round}</td>
                  <td>{interview.type}</td>
                  <td>{interview.scheduledTime}</td>
                  <td>{interview.interviewer}</td>
                  <td>
                    <span className={`status-badge ${interview.status}`}>
                      {interview.status}
                    </span>
                  </td>
                </tr>
              ))
            : "No interviews Found"}
        </tbody>
      </table>
    </>
  );
};

export default Interviews;
