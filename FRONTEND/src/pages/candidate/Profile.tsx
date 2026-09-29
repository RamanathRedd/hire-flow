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
    name: "Email",
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
    type: "number",
    placeHolder: "3.10",
    name: "Experience (in years)",
    key: "experience",
    readonly: true,
    required: true,
  },
  {
    type: "text",
    placeHolder: "Software Engineer",
    name: "Current title",
    key: "currentTitle",
    readonly: true,
    required: true,
  },
  {
    type: "text",
    placeHolder: "TCS",
    name: "Current company",
    key: "currentCompany",
    readonly: true,
    required: true,
  },
  {
    type: "skills",
    placeHolder: "",
    name: "Skills",
    key: "skills",
    readonly: true,
    required: false,
  },
  {
    type: "text",
    placeHolder: "drive.google.com/ram-resume",
    name: "Resume",
    key: "resume",
    readonly: true,
    required: false,
  },
  {
    type: "text",
    placeHolder: "linkedin.com/in/ram",
    name: "LinkedIn",
    key: "linkedIn",
    readonly: true,
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
  const button = { text: "Edit profile", isEdit: true };
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
        left="My profile"
        right={button}
        classString="nav-action-candidate-button"
      />
      <ProfileForm inputFields={inputFieldDetails} userData={userData} />
    </>
  );
};

export default Profile;
