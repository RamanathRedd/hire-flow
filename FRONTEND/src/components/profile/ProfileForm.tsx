import { useEffect, useState } from "react";

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
  experience?: number;
  currentTitle?: string;
  currentCompany?: string;
  resume?: string;
  linkedIn?: string;
  department?: string;
  skills?: string[];
}

interface ProfileDetails {
  name: string;
  phone: string;
  department: string;
}

interface ProfileFormProps {
  inputFields: inputField[];
  userData: UserDetails;
  isEditable: boolean;
  onDetailsChange?: (details: ProfileDetails) => void;
}

const ProfileForm = (props: ProfileFormProps) => {
  const { inputFields, userData, isEditable, onDetailsChange } = props;
  const [draftUserDetails, setDraftUserDetails] =
    useState<UserDetails>(userData);

  useEffect(() => {
    setDraftUserDetails(userData);
  }, [userData]);

  const onFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const updatedDetails = {
      ...draftUserDetails,
      [name]: value,
    };
    setDraftUserDetails(updatedDetails);
    onDetailsChange?.({
      name: updatedDetails.name,
      phone: updatedDetails.phone,
      department: updatedDetails.department ?? "",
    });
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
                value={value}
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
