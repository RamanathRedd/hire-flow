const UpdateApplicationStageModal = (props: any) => {
  const { applicationDetails, job_department, job_location } = props;
  return (
    <>
      <h1>Update Application stage</h1>
      <p>
        Change the current stage and add relevant details for this candidate
      </p>
      <button>&times;</button>
      <div>
        <div>
          <span>
            {applicationDetails.candidate_name
              ?.trim()
              ?.charAt(0)
              ?.toUpperCase() || "?"}
          </span>
          <div>
            <h3>{applicationDetails.candidate_name}</h3>
            <p>
              {job_department || "Department not provided"}
              <span aria-hidden="true"> · </span>
              {job_location || "Location not provided"}
            </p>
            <span>
              APP-
              {String(applicationDetails.id ?? "").padStart(3, "0")}
            </span>
          </div>
        </div>
        <span>{applicationDetails.stage?.replace(/_/g, " ") ?? "Unknown"}</span>
      </div>
      <label>Change Stage to</label>
      <select>
        <option>Interview R1</option>
      </select>
      <label>Interview Type</label>
      <select>
        <option>Techincal</option>
      </select>
      <label>Date & time</label>
      <input />
      <label>Interviewer</label>
      <select>
        <option>Ram</option>
      </select>
      <button>Cancel</button>
      <button>Update Stage</button>
    </>
  );
};

export default UpdateApplicationStageModal;
