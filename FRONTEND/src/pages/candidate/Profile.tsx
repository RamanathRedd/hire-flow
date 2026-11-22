import { useRef, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import ProfileForm from "../../components/profile/ProfileForm";
import Modal from "../../components/ui/Modal";
import {
  useGetCandidateDetails,
  useUpdateRecruiterDetails,
} from "../../hooks/useCandidates";
import type { CandidateUpdate } from "../../types/candidate";
import { useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../api/errors";

const inputFieldDetails = [
  {
    type: "text",
    placeHolder: "Enter you Name",
    name: "Full name",
    minLength: 3,
    maxLength: 100,
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
    min: "0.1",
    max: "30",
    step: "any",
    key: "experience_years",
    required: true,
  },
  {
    type: "text",
    placeHolder: "Enter your current Title",
    name: "Current title",
    minLength: 1,
    maxLength: 100,
    key: "current_title",
    required: true,
  },
  {
    type: "text",
    placeHolder: "Enter your Current Company",
    name: "Current company",
    minLength: 1,
    maxLength: 100,
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
    type: "url",
    placeHolder: "Enter your resume link",
    name: "Resume",
    key: "resume_url",
    required: true,
    invalidMessage: "Enter a valid resume URL with http:// or https://.",
  },
  {
    type: "url",
    placeHolder: "Enter your Linkedin link",
    name: "LinkedIn",
    key: "linkedin_url",
    required: false,
    invalidMessage: "Enter a valid resume URL with http:// or https://.",
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
  const profileFormRef = useRef<HTMLFormElement>(null);
  const [isEditable, setIsEditable] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [candidateDraft, setCandidateDraft] = useState<CandidateUpdate>({});
  const updateCandidateDetailsMutation = useUpdateRecruiterDetails();
  const queryClient = useQueryClient();

  const onCancel = () => {
    setIsModalOpen(false);
  };

  const {
    data: userData = {} as UserDetails,
    isPending: userDataLoading,
    isError: userDataError,
  } = useGetCandidateDetails();

  const updateErrorMessage = updateCandidateDetailsMutation.error
    ? getApiErrorMessage(updateCandidateDetailsMutation.error)
    : "";
  const resumeUrlError = updateErrorMessage.startsWith("resume_url:")
    ? updateErrorMessage.slice("resume_url:".length).trim()
    : undefined;
  const linkedInUrlError = updateErrorMessage.startsWith("linkedin_url:")
    ? updateErrorMessage.slice("linkedin_url:".length).trim()
    : undefined;
  const profileInputFields = inputFieldDetails.map((field) =>
    field.key === "resume_url"
      ? { ...field, error: resumeUrlError }
      : field.key === "linkedin_url"
        ? { ...field, error: linkedInUrlError }
        : field,
  );

  const onConfirm = () => {
    if (
      !profileFormRef.current?.reportValidity() ||
      !userData.id ||
      updateCandidateDetailsMutation.isPending
    ) {
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
        onError: () => setIsModalOpen(false),
      },
    );
  };

  const onClickEditButton = () => {
    if (isEditable) {
      if (!profileFormRef.current?.reportValidity()) {
        return;
      }
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
      {userDataLoading ? (
        <div
          className="profile-loading-grid"
          role="status"
          aria-live="polite"
          aria-label="Loading profile"
        >
          {[0, 1, 2, 3, 4, 5].map((field) => (
            <div
              className="profile-loading-field"
              key={field}
              aria-hidden="true"
            >
              <span className="loading-skeleton profile-loading-label" />
              <span className="loading-skeleton profile-loading-input" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {userData && (
            <ProfileForm
              profileType="candidate"
              inputFields={profileInputFields}
              userData={userData}
              isEditable={isEditable}
              formRef={profileFormRef}
              onDetailsChange={(details) => {
                updateCandidateDetailsMutation.reset();
                setCandidateDraft(details);
              }}
            />
          )}

          {userDataError && (
            <span id="user-data-load-error" role="alert">
              Failed to load user data. Please try again.
            </span>
          )}

          {updateCandidateDetailsMutation.isError && !resumeUrlError && (
            <span id="profile-update-error" role="alert">
              {updateErrorMessage}
            </span>
          )}
        </>
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
              color="#4261ee"
            />
          }
        />
      )}
    </>
  );
};

export default Profile;
