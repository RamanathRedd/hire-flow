import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

const JobForm = () => {
  const [jobTitle, setJobTitle] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [jobType, setJobType] = useState<string>("");
  const [openings, setOpenings] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const navigate = useNavigate();

  const onJobTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setJobTitle(e.target.value);
  };

  const onDepartmentChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDepartment(e.target.value);
  };

  const onLocationChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
  };

  const onJobTypeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setJobType(e.target.value);
  };

  const onOpeningsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setOpenings(e.target.value);
  };

  const onDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(e.target);
  };

  return (
    <main className="job-form-page">
      <form className="job-form-card" onSubmit={handleSubmit}>
        <header className="job-form-header">
          <div>
            <h1 id="job-form-title">New job posting</h1>
            <p>Starts as Draft - publish it from the jobs list when ready</p>
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
              onChange={onJobTitleChange}
              placeholder="e.g. Backend Engineer"
              required
            />
          </div>
          <div className="job-form-field">
            <label htmlFor="job-department">
              Department<span className="required-field"> *</span>
            </label>
            <input
              id="job-department"
              type="text"
              name="department"
              value={department}
              onChange={onDepartmentChange}
              placeholder="Engineering"
              required
            />
          </div>
          <div className="job-form-field">
            <label htmlFor="job-location">
              Location<span className="required-field"> *</span>
            </label>
            <input
              id="job-location"
              type="text"
              name="location"
              value={location}
              onChange={onLocationChange}
              placeholder="Hyderabad"
              required
            />
          </div>
          <div className="job-form-field">
            <label htmlFor="job-type">
              Job type<span className="required-field"> *</span>
            </label>
            <input
              id="job-type"
              type="text"
              name="jobType"
              value={jobType}
              onChange={onJobTypeChange}
              placeholder="Full time"
              required
            />
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
            <label htmlFor="job-description">
              Description<span className="required-field"> *</span>
            </label>
            <textarea
              id="job-description"
              name="description"
              value={description}
              onChange={onDescriptionChange}
              rows={3}
              placeholder="Describe the role and responsibilities"
              required
            />
          </div>
        </div>

        <footer className="job-form-actions">
          <button className="job-form-draft" type="submit">
            Save as draft
          </button>
          <button className="job-form-submit" type="submit">
            Create job
          </button>
        </footer>
      </form>
    </main>
  );
};

export default JobForm;
