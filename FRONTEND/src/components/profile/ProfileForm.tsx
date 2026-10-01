import { useState } from "react";

interface inputField {
  type: string;
  placeHolder: string;
  name: string;
  key: string;
  required: boolean;
}

interface UserDetails {
  fullName: string;
  email: string;
  phone: string;
  experience?: number;
  currentTitle?: string;
  currentCompany?: string;
  resume?: string;
  linkedIn?: string;
  department?: string;
  password?: string;
  skills?: string[];
}

interface ProfileFormProps {
  inputFields: inputField[];
  userData: UserDetails;
  isEditable: boolean;
}

const ProfileForm = (props: ProfileFormProps) => {
  const { inputFields, userData, isEditable } = props;
  const [draftUserDetails, setDraftUserDetails] =
    useState<UserDetails>(userData);

  const onFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDraftUserDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
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

        return (
          <div key={inputField.key} className="profile-form-field">
            <label className="profile-form-label">{inputField.name}</label>
            <input
              className="profile-form-input"
              id={inputField.key}
              type={inputField.type}
              name={inputField.key}
              placeholder={inputField.placeHolder}
              value={draftUserDetails[inputField.key as keyof UserDetails]}
              onChange={onFieldChange}
              readOnly={inputField.type != "email" ? !isEditable : true}
              required={inputField.required}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ProfileForm;
