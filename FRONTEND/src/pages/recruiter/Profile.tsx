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
    name: "Work email",
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
    type: "text",
    placeHolder: "Engineering",
    name: "Department",
    key: "department",
    required: true,
  },
  {
    type: "password",
    placeHolder: "••••••••••",
    name: "Password",
    key: "password",
    required: true,
  },
];

interface UserDetails {
  fullName: string;
  email: string;
  phone: string;
  department: string;
  password: string;
}

const Profile = () => {
  const [isEditable, setIsEditable] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const onClickEditButton = () => {
    if (isEditable) {
      setIsModalOpen(true);
      return;
    }

    setIsEditable(true);
  };

  const onConfirm = () => {
    setIsEditable(false);
    setIsModalOpen(false);
  };

  const onCancel = () => {
    setIsModalOpen(false);
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
    department: "Engineering",
    password: "Ram@1432",
  };

  // useEffect(() => {
  //   setIsEditable(false);
  //   setIsModalOpen(false);
  // });

  return (
    <>
      <Navbar
        leftTitle="My profile"
        rightText={rightText}
        classString="nav-action-button"
      />
      <ProfileForm
        inputFields={inputFieldDetails}
        userData={userData}
        isEditable={isEditable}
      />
      {isModalOpen && (
        <Modal
          title="Save profile changes?"
          message="Your updated profile information will be saved."
          cancelText="Cancel"
          confirmText="Save changes"
          confirmClassString="recruiter-profile"
          icon={
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              color="#8ea0ff"
            />
          }
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )}
    </>
  );
};

export default Profile;
