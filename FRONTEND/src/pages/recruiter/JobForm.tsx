import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateJob } from "../../hooks/useJobs";
import { useDepartments, useLocations } from "../../hooks/useReferenceData";

const JobForm = () => {
  const [jobTitle, setJobTitle] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [jobType, setJobType] = useState<string>("");
  const [openings, setOpenings] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [requirements, setRequirements] = useState<string>("");
  const navigate = useNavigate();
  const createJobMutation = useCreateJob();

  const onJobTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setJobTitle(e.target.value);
  };

  const onDepartmentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setDepartment(e.target.value);
  };

  const onLocationChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setLocation(e.target.value);
  };

  const onJobTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setJobType(e.target.value);
  };

  const onOpeningsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setOpenings(e.target.value);
  };

  const onDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const onRequirementsChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setRequirements(e.target.value);
  };

  const {
    data: departments = [],
    isPending: departmentsLoading,
    isError: departmentsError,
  } = useDepartments();

  const {
    data: locations = [],
    isPending: locationsLoading,
    isError: locationsError,
  } = useLocations();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const status =
      submitter instanceof HTMLButtonElement && submitter.value === "draft"
        ? "Draft"
        : "Open";

    createJobMutation.mutate(
      {
        title: jobTitle,
        department,
        location,
        job_type: jobType,
        description,
        status: status,
        openings_count: Number(openings),
        requirements,
      },
      {
        onSuccess: () => {
          navigate("/jobs");
        },
      },
    );
  };

  return (
    <main className="job-form-page">
      <form className="job-form-card" onSubmit={handleSubmit}>
        <header className="job-form-header">
          <div>
            <h1 id="job-form-title">Post Job</h1>
          </div>
          <button
            className="job-form-close"
            type="button"
            onClick={() => navigate("/jobs")}
            aria-label="Close job form"
          >
            <span aria-hidden="true">×</span> Close
          </button>
        </header>

        <div className="job-form-fields">
          <div className="job-form-field job-form-field-wide">
            <label htmlFor="job-title">
              Job title<span className="required-field"> *</span>
            </label>

            <input
              id="job-title"
              type="text"
              name="jobTitle"
              value={jobTitle}
              minLength={5}
              onChange={onJobTitleChange}
              placeholder="e.g. Backend Engineer"
              required
            />
          </div>
          <div className="job-form-field">
            <label htmlFor="job-department">
              Department<span className="required-field"> *</span>
            </label>
            <select
              id="job-department"
              name="department"
              value={department}
              onChange={onDepartmentChange}
              disabled={departmentsLoading || departmentsError}
              required
            >
              <option value="" disabled hidden>
                Select Department
              </option>
              {departments &&
                departments.map((department) => (
                  <option key={department.id} value={department.name}>
                    {department.name}
                  </option>
                ))}
            </select>
            {departmentsError && (
              <span id="department-load-error" role="alert">
                Failed to load departments. Please try again.
              </span>
            )}
          </div>
          <div className="job-form-field">
            <label htmlFor="job-location">
              Location<span className="required-field"> *</span>
            </label>
            <select
              id="job-location"
              name="location"
              value={location}
              onChange={onLocationChange}
              disabled={locationsLoading || locationsError}
              required
            >
              <option value="" disabled hidden>
                Select Location
              </option>
              {locations &&
                locations.map((location) => (
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
          <div className="job-form-field">
            <label htmlFor="job-type">
              Job type<span className="required-field"> *</span>
            </label>
            <select
              id="job-type"
              name="jobType"
              value={jobType}
              onChange={onJobTypeChange}
              required
            >
              <option value="" disabled hidden>
                Select JobType
              </option>
              <option value="Full-time">Full-time</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
          <div className="job-form-field">
            <label htmlFor="job-openings">
              Openings<span className="required-field"> *</span>
            </label>
            <input
              id="job-openings"
              type="number"
              min="1"
              name="openings"
              value={openings}
              onChange={onOpeningsChange}
              placeholder="3"
              required
            />
          </div>
          <div className="job-form-field job-form-field-wide">
            <label htmlFor="job-requirements">
              Requirements<span className="required-field"> *</span>
            </label>
            <textarea
              id="job-requirements"
              name="requirements"
              value={requirements}
              onChange={onRequirementsChange}
              minLength={5}
              rows={3}
              placeholder="Describe the requirements for this role"
              required
            />
          </div>
          <div className="job-form-field job-form-field-wide">
            <label htmlFor="job-description">
              Description<span className="required-field"> *</span>
            </label>
            <textarea
              id="job-description"
              name="description"
              value={description}
              onChange={onDescriptionChange}
              minLength={5}
              rows={3}
              placeholder="Describe the role and responsibilities"
              required
            />
          </div>
        </div>

        <footer className="job-form-actions">
          <button
            className="job-form-draft"
            type="submit"
            name="action"
            value="draft"
          >
            Save as draft
          </button>
          <button
            className="job-form-submit"
            type="submit"
            name="action"
            value="create"
          >
            Create job
          </button>
        </footer>
      </form>
    </main>
  );
};

export default JobForm;
