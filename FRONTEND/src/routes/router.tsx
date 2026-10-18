import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import MyApplications from "../pages/candidate/MyApplications";
import AppLayout from "../components/layout/AppLayout";
import Analytics from "../pages/recruiter/Analytics";
import Interviews from "../pages/recruiter/Interviews";
import JobForm from "../pages/recruiter/JobForm";
import BrowseJobs from "../pages/candidate/BrowseJobs";
import CandidateProfile from "../pages/candidate/Profile";
import RecruiterProfile from "../pages/recruiter/Profile";
import Dashboard from "../pages/recruiter/Dashboard";
import InterviewScheduleForm from "../pages/recruiter/InterviewScheduleForm";
import Applications from "../pages/recruiter/Applications";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<AppLayout />}>
        <Route path="/jobs" element={<Dashboard />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/interviews" element={<Interviews />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/profile" element={<RecruiterProfile />} />
        <Route path="/browseJobs" element={<BrowseJobs />} />
        <Route path="/my-applications" element={<MyApplications />} />
        <Route path="/candidate-profile" element={<CandidateProfile />} />
      </Route>
      <Route path="/jobForm" element={<JobForm />} />
      <Route
        path="/interviewScheduleForm"
        element={<InterviewScheduleForm />}
      />
    </>,
  ),
);

export default router;
