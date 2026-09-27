import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import Dashboard from "../pages/recruiter/Dashboard";
import MyApplications from "../pages/candidate/MyApplications";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/my-applications" element={<MyApplications />} />
      <Route path="/register" element={<RegisterPage />} />
    </>,
  ),
);

export default router;
