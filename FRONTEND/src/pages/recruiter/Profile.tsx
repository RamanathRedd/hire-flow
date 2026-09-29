import { useState } from "react";
import Navbar from "../../components/layout/Navbar";
import ProfileForm from "../../components/profile/ProfileForm";

const inputFieldDetails = [
  {
    type: "text",
    placeHolder: "Ramanath Reddy",
    name: "Full name",
    key: "fullName",
    readonly: true,
    required: true,
  },
  {
    type: "email",
    placeHolder: "ram@example.com",
    name: "Work email",
    key: "email",
    readonly: true,
    required: true,
  },
  {
    type: "tel",
    placeHolder: "9391233969",
    name: "Phone",
    key: "phone",
    readonly: true,
    required: true,
  },
  {
    type: "text",
    placeHolder: "Engineering",
    name: "Department",
    key: "department",
    readonly: true,
    required: true,
  },
  {
    type: "password",
    placeHolder: "••••••••••",
    name: "Password",
    key: "password",
    readonly: true,
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
  const onButtonChange = () => {
    console.log("sample");
    if (button.text === "Edit profile") setButton({ ...button, text: "Save" });
  };
  const [button, setButton] = useState<{
    text: string;
    isEdit: boolean;
    buttonChange: Function;
  }>({
    text: "Edit profile",
    isEdit: true,
    buttonChange: onButtonChange,
  });
  const userData: UserDetails = {
    fullName: "Ramanath Reddy",
    email: "ram@example.com",
    phone: "9391233969",
    department: "Engineering",
    password: "Ram@1432",
  };
  // const [buttonText, setButtonText] = useState<string>("Edit profile");

  return (
    <>
      <Navbar
        left="My profile"
        right={button}
        classString="nav-action-button"
      />
      <ProfileForm inputFields={inputFieldDetails} userData={userData} />
    </>
  );
};

export default Profile;
