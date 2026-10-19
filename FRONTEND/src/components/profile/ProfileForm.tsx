import { useEffect, useState } from "react";
import type { CandidateUpdate } from "../../types/candidate";
import type { RecruiterUpdate } from "../../types/recruiter";

interface inputField {
  type: string;
  placeHolder?: string;
  name: string;
  key: string;
  required: boolean;
  options?: string[];
  disabled?: boolean;
  error?: string;
}

interface UserDetails {
  name: string;
  email: string;
  phone: string;
  experience_years?: number;
  current_title?: string;
  current_company?: string;
  resume_url?: string;
  linkedin_url?: string | null;
  department?: string;
  skills?: string[];
}

interface BaseProfileFormProps {
  inputFields: inputField[];
  userData: UserDetails;
  isEditable: boolean;
}

type ProfileFormProps = BaseProfileFormProps &
  (
    | {
        profileType: "candidate";
        onDetailsChange?: (details: CandidateUpdate) => void;
      }
    | {
        profileType: "recruiter";
        onDetailsChange?: (details: RecruiterUpdate) => void;
      }
  );

const ProfileForm = (props: ProfileFormProps) => {
  const { inputFields, userData, isEditable, profileType, onDetailsChange } =
    props;
  const [skill, setSkill] = useState<string>("");
  const [draftUserDetails, setDraftUserDetails] =
    useState<UserDetails>(userData);

  useEffect(() => {
    setDraftUserDetails(userData);
  }, [userData]);

  const notifyDetailsChange = (details: UserDetails) => {
    if (profileType === "candidate") {
      onDetailsChange?.({
        name: details.name,
        phone: details.phone,
        resume_url: details.resume_url,
        linkedin_url: details.linkedin_url || null,
        experience_years: Number(details.experience_years),
        skills: details.skills,
        current_title: details.current_title,
        current_company: details.current_company,
      });
    } else {
      onDetailsChange?.({
        name: details.name,
        phone: details.phone,
        department: details.department ?? "",
      });
    }
  };

  const addSkill = () => {
    const normalizedSkill = skill.trim();
    const skills = draftUserDetails.skills ?? [];
    if (!normalizedSkill || skills.includes(normalizedSkill)) return;

    const updatedDetails = {
      ...draftUserDetails,
      skills: [...skills, normalizedSkill],
    };
    setDraftUserDetails(updatedDetails);
    notifyDetailsChange(updatedDetails);
    setSkill("");
  };

  const removeSkill = (skillToRemove: string) => {
    const updatedDetails = {
      ...draftUserDetails,
      skills: (draftUserDetails.skills ?? []).filter(
        (existingSkill) => existingSkill !== skillToRemove,
      ),
    };
    setDraftUserDetails(updatedDetails);
    notifyDetailsChange(updatedDetails);
  };

  const onFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const updatedDetails = {
      ...draftUserDetails,
      [name]: value,
    };
    setDraftUserDetails(updatedDetails);
    notifyDetailsChange(updatedDetails);
  };

  return (
    <div className="profile-form-grid">
      {inputFields.map((inputField) => {
        if (inputField.type === "skills") {
          const skills = draftUserDetails.skills ?? [];

          return (
            <div
              key={inputField.key}
              className="profile-form-field profile-form-field-wide"
            >
              <label className="profile-form-label">{inputField.name}</label>
              {!isEditable ? (
                <div className="profile-form-skill-list">
                  {skills.map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="profile-form-skill"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <>
                  <div className="skill-input-row">
                    <input
                      className="profile-form-input"
                      id="skill"
                      type="text"
                      name="skill"
                      value={skill}
                      onChange={(event) => setSkill(event.target.value)}
                      placeholder="Enter Your skill"
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
                  <div className="profile-form-skill-list ">
                    {skills.map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="profile-form-skill"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          style={{ cursor: "pointer" }}
                          aria-label={`Remove ${skill}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        }

        const value = String(
          draftUserDetails[inputField.key as keyof UserDetails] ?? "",
        );
        const fieldId = `profile-${inputField.key}`;

        return (
          <div key={inputField.key} className="profile-form-field">
            <label className="profile-form-label" htmlFor={fieldId}>
              {inputField.name}
            </label>
            {inputField.type === "select" ? (
              <>
                <select
                  className="profile-form-input"
                  id={fieldId}
                  name={inputField.key}
                  value={value}
                  onChange={onFieldChange}
                  disabled={!isEditable || inputField.disabled}
                  required={inputField.required}
                >
                  {inputField.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {inputField.error && (
                  <span role="alert">{inputField.error}</span>
                )}
              </>
            ) : (
              <input
                className="profile-form-input"
                id={fieldId}
                type={inputField.type}
                name={inputField.key}
                placeholder={inputField.placeHolder}
                value={isEditable ? value : value || " — "}
                onChange={onFieldChange}
                readOnly={inputField.type !== "email" ? !isEditable : true}
                required={inputField.required}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProfileForm;
