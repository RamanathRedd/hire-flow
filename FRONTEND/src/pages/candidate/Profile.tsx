import { useState } from "react";
import Navbar from "../../components/layout/Navbar";
import ProfileForm from "../../components/profile/ProfileForm";
import Modal from "../../components/ui/Modal";
import {
  useGetCandidateDetails,
  useUpdateRecruiterDetails,
} from "../../hooks/useCandidates";
import type { CandidateUpdate } from "../../types/candidate";
import { useQueryClient } from "@tanstack/react-query";

const inputFieldDetails = [
  {
    type: "text",
    placeHolder: "Enter you Name",
    name: "Full name",
    key: "name",
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
    placeHolder: "Enter your Phone Number",
    name: "Phone",
    key: "phone",
    required: true,
  },
  {
    type: "number",
    placeHolder: "Enter your Experience",
    name: "Experience (in years)",
    key: "experience_years",
    required: true,
  },
  {
    type: "text",
    placeHolder: "Enter your current Title",
    name: "Current title",
    key: "current_title",
    required: true,
  },
  {
    type: "text",
    placeHolder: "Enter your Current Company",
    name: "Current company",
    key: "current_company",
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
    placeHolder: "Enter your resume link",
    name: "Resume",
    key: "resume_url",
    required: false,
  },
  {
    type: "text",
    placeHolder: "Enter your Linkedin link",
    name: "LinkedIn",
    key: "linkedin_url",
    required: false,
  },
];

interface UserDetails {
  name: string;
  email: string;
  phone: string;
  experience_years: number;
  current_title: string;
  current_company: string;
  resume_url: string;
  linkedin_url: string | null;
  skills: string[];
}

const Profile = () => {
  const [isEditable, setIsEditable] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [candidateDraft, setCandidateDraft] = useState<CandidateUpdate>({});
  const updateCandidateDetailsMutation = useUpdateRecruiterDetails();
  const queryClient = useQueryClient();

  const onCancel = () => {
    setIsModalOpen(false);
  };

  const { data: userData = {} as UserDetails, isError: userDataError } =
    useGetCandidateDetails();

  const onConfirm = () => {
    if (!userData.id || updateCandidateDetailsMutation.isPending) {
      return;
    }

    updateCandidateDetailsMutation.mutate(
      {
        candidate_id: userData.id,
        candidate_details: candidateDraft,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["candidateDetails"] });
          setIsEditable(false);
          setIsModalOpen(false);
        },
      },
    );
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

  return (
    <>
      <Navbar
        leftTitle="My profile"
        rightText={rightText}
        classString="nav-action-button"
        headerClassName="profile-page-header"
      />

      {userData && (
        <ProfileForm
          profileType="candidate"
          inputFields={inputFieldDetails}
          userData={userData}
          isEditable={isEditable}
          onDetailsChange={setCandidateDraft}
        />
      )}

      {userDataError && (
        <span id="user-data-load-error" role="alert">
          Failed to load user data. Please try again.
        </span>
      )}

      {updateCandidateDetailsMutation.isError && (
        <span id="profile-update-error" role="alert">
          {updateCandidateDetailsMutation.error.message}
        </span>
      )}

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
