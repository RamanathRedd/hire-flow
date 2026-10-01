import { useState } from "react";
import Navbar from "../../components/layout/Navbar";
import ProfileForm from "../../components/profile/ProfileForm";
import Modal from "../../components/ui/Modal";

const inputFieldDetails = [
  {
    type: "text",
    placeHolder: "Ramanath Reddy",
    name: "Full name",
    key: "fullName",
    required: true,
  },
  {
    type: "email",
    placeHolder: "ram@example.com",
    name: "Email",
    key: "email",
    required: true,
  },
  {
    type: "tel",
    placeHolder: "9391233969",
    name: "Phone",
    key: "phone",
    required: true,
  },
  {
    type: "number",
    placeHolder: "3.10",
    name: "Experience (in years)",
    key: "experience",
    required: true,
  },
  {
    type: "text",
    placeHolder: "Software Engineer",
    name: "Current title",
    key: "currentTitle",
    required: true,
  },
  {
    type: "text",
    placeHolder: "TCS",
    name: "Current company",
    key: "currentCompany",
    required: true,
  },
  {
    type: "skills",
    placeHolder: "",
    name: "Skills",
    key: "skills",
    required: false,
  },
  {
    type: "text",
    placeHolder: "drive.google.com/ram-resume",
    name: "Resume",
    key: "resume",
    required: false,
  },
  {
    type: "text",
    placeHolder: "linkedin.com/in/ram",
    name: "LinkedIn",
    key: "linkedIn",
    required: false,
  },
];

interface UserDetails {
  fullName: string;
  email: string;
  phone: string;
  experience: number;
  currentTitle: string;
  currentCompany: string;
  resume: string;
  linkedIn: string;
  skills: string[];
}

const Profile = () => {
  const [isEditable, setIsEditable] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const onCancel = () => {
    setIsModalOpen(false);
  };

  const onConfirm = () => {
    setIsModalOpen(false);
    setIsEditable(false);
  };

  const onClickEditButton = () => {
    if (isEditable) {
      setIsModalOpen(true);
      return;
    }
    setIsEditable((prev) => !prev);
  };
  const rightText = {
    text: "Edit profile",
    isEditable: isEditable,
    onClickEditButton: onClickEditButton,
  };
  const userData: UserDetails = {
    fullName: "Ramanath Reddy",
    email: "ram@example.com",
    phone: "9391233969",
    experience: 3.09,
    currentTitle: "Software Engineer",
    currentCompany: "TCS",
    resume: "drive.google.com/ram-resume",
    linkedIn: "linkedin.com/in/ram",
    skills: ["Python", "FastAPI", "PostgreSQL", "Docker"],
  };

  return (
    <>
      <Navbar
        leftTitle="My profile"
        rightText={rightText}
        classString="nav-action-candidate-button"
      />
      <ProfileForm
        inputFields={inputFieldDetails}
        userData={userData}
        isEditable={isEditable}
      />
      {isModalOpen && (
        <Modal
          onConfirm={onConfirm}
          onCancel={onCancel}
          title="Save profile changes?"
          message="Your updated profile information will be saved."
          cancelText="Cancel"
          confirmText="Save changes"
          confirmClassString="candidate-profile"
          icon={
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              color="#0e9f8f"
            />
          }
        />
      )}
    </>
  );
};

export default Profile;
