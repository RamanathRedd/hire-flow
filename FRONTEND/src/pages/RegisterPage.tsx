import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthBrandPanel from "../components/auth/AuthBrandPanel";
import { useRegister } from "../hooks/useAuth";
import { useDepartments } from "../hooks/useReferenceData";

const RegisterPage = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const [linkedinUrl, setLinkedinUrl] = useState<string>("");
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [currentTitle, setCurrentTitle] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [skill, setSkill] = useState<string>("");
  const [skills, setSkills] = useState<string[]>([]);
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const registerMutation = useRegister();
  const navigate = useNavigate();

  const onRoleChange = (e: MouseEvent<HTMLButtonElement>) => {
    setIsAdmin(e.currentTarget.name === "recruiter");
    resetForm();
  };

  const onNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const onEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const onPhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
  };

  const {
    data: departments = [],
    isPending: departmentsLoading,
    isError: departmentsError,
  } = useDepartments();

  const onDepartmentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setDepartment(e.target.value);
  };

  const onResumeUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setResumeUrl(e.target.value);
  };

  const onLinkedinUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLinkedinUrl(e.target.value);
  };

  const onExperienceYearsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setExperienceYears(Number(e.target.value));
  };

  const onCurrentTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCurrentTitle(e.target.value);
  };

  const onCompanyNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCompanyName(e.target.value);
  };

  const onSkillChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSkill(e.target.value);
  };

  const addSkill = () => {
    const trimmedSkill = skill.trim().toLowerCase();

    if (!trimmedSkill || skills.includes(trimmedSkill)) {
      return;
    }

    setSkills((currentSkills) => [...currentSkills, trimmedSkill]);
    setSkill("");
  };

  const onPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const onConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setDepartment("");
    setResumeUrl("");
    setLinkedinUrl("");
    setExperienceYears(0);
    setCurrentTitle("");
    setCompanyName("");
    setSkill("");
    setSkills([]);
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    registerMutation.mutate(
      {
        email,
        password,
        isAdmin,
        name,
        phone,
        department,
        resume_url: resumeUrl,
        linkedin_url: linkedinUrl,
        experience_years: experienceYears,
        skills,
        current_title: currentTitle,
        current_company: companyName,
      },
      {
        onSuccess: () => {
          navigate("/");
          resetForm();
          setIsAdmin(true);
        },
      },
    );
  };

  return (
    <main className="auth-page">
      <AuthBrandPanel tagLine="Set up your account to start posting roles and managing your pipeline." />
      <section className="auth-panel" aria-labelledby="register-title">
        <form className="auth-form" onSubmit={handleSubmit}>
          <header className="auth-heading register-heading">
            <h1 id="register-title">Create your account</h1>
            <p>
              Already have one?{" "}
              <Link to="/" className="login-link">
                Sign in instead
              </Link>
            </p>
          </header>
          <div className="role-switch" aria-label="Choose account type">
            <button
              className={isAdmin ? "role-option is-active" : "role-option"}
              type="button"
              onClick={onRoleChange}
              name="recruiter"
              aria-pressed={isAdmin}
            >
              Recruiter
            </button>
            <button
              className={
                !isAdmin ? "role-option is-active candidate" : "role-option"
              }
              type="button"
              onClick={onRoleChange}
              name="candidate"
              aria-pressed={!isAdmin}
            >
              Candidate
            </button>
          </div>
          <div className="register-fields">
            <div className="auth-field">
              <label htmlFor="name">
                Full name<span className="required-field"> *</span>
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={name}
                onChange={onNameChange}
                placeholder="Ramanath Reddy"
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="register-email">
                Email<span className="required-field"> *</span>
              </label>
              <input
                id="register-email"
                type="email"
                name="email"
                value={email}
                onChange={onEmailChange}
                placeholder="ram@example.com"
                required
              />
              <span></span>
            </div>
            <div className="auth-field">
              <label htmlFor="phone">
                Phone<span className="required-field"> *</span>
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={phone}
                onChange={onPhoneChange}
                placeholder="9391233969"
                inputMode="numeric"
                required
              />
            </div>
            {isAdmin && (
              <div className="auth-field">
                <label htmlFor="department">
                  Department<span className="required-field"> *</span>
                </label>
                <select
                  id="department"
                  name="department"
                  value={department}
                  onChange={onDepartmentChange}
                  required
                  disabled={departmentsLoading || departmentsError}
                >
                  <option value="" disabled hidden>
                    {departmentsLoading
                      ? "Loading departments..."
                      : "Select department"}
                  </option>
                  {departments.map((department) => (
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
            )}
            {!isAdmin && (
              <>
                <div className="auth-field">
                  <label htmlFor="resumeUrl">
                    Resume Url<span className="required-field"> *</span>
                  </label>
                  <input
                    id="resumeUrl"
                    type="text"
                    name="resumeUrl"
                    value={resumeUrl}
                    onChange={onResumeUrlChange}
                    placeholder="drive.google.com/ram-resume"
                    required
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="linkedinUrl">Linkedin Url</label>
                  <input
                    id="linkedinUrl"
                    type="text"
                    name="linkedinUrl"
                    value={linkedinUrl}
                    onChange={onLinkedinUrlChange}
                    placeholder="linkedin.com/in/ram"
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="experienceYears">
                    Experience Years<span className="required-field"> *</span>
                  </label>
                  <input
                    id="experienceYears"
                    type="number"
                    name="experienceYears"
                    value={experienceYears}
                    onChange={onExperienceYearsChange}
                    required
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="currentTitle">
                    Current Title<span className="required-field"> *</span>
                  </label>
                  <input
                    id="currentTitle"
                    type="text"
                    name="currentTitle"
                    value={currentTitle}
                    onChange={onCurrentTitleChange}
                    placeholder="Software Engineer"
                    required
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="companyName">
                    Company Name<span className="required-field"> *</span>
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    name="companyName"
                    value={companyName}
                    onChange={onCompanyNameChange}
                    placeholder="TCS"
                    required
                  />
                </div>
                <div className="auth-field skills-field">
                  <label htmlFor="skill">
                    Skills<span className="required-field"> *</span>
                  </label>
                  <div className="skill-input-row">
                    <input
                      id="skill"
                      type="text"
                      name="skill"
                      value={skill}
                      onChange={onSkillChange}
                      placeholder="React, Python, SQL"
                    />

                    <button
                      type="button"
                      className="add-skill-button"
                      onClick={addSkill}
                      disabled={!skill.trim() || skills.includes(skill.trim())}
                    >
                      Add Skill
                    </button>
                  </div>
                  {skills.length > 0 && (
                    <div className="profile-form-skill-list ">
                      {skills.map((skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          className="profile-form-skill"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() =>
                              setSkills((current) =>
                                current.filter((value) => value !== skill),
                              )
                            }
                            style={{ cursor: "pointer" }}
                            aria-label={`Remove ${skill}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            <div className="auth-field">
              <label htmlFor="register-password">
                Password<span className="required-field"> *</span>
              </label>
              <input
                id="register-password"
                type="password"
                name="password"
                value={password}
                onChange={onPasswordChange}
                placeholder="••••••••••"
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="confirm-password">
                Confirm password<span className="required-field"> *</span>
              </label>
              <input
                id="confirm-password"
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={onConfirmPasswordChange}
                placeholder="••••••••••"
                required
              />
            </div>
          </div>
          <button
            className={`auth-submit ${isAdmin ? `recruiter-account` : `candidate-account`}`}
            type="submit"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending
              ? "Creating account..."
              : "Create account"}
          </button>
          {registerMutation.isError && (
            <p className="auth-message is-error" role="alert">
              {registerMutation.error.message}
            </p>
          )}
        </form>
      </section>
    </main>
  );
};

export default RegisterPage;
