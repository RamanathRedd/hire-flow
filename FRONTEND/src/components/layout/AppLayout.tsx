import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const RecruiterNavItems = [
  { to: "/jobs", title: "Jobs" },
  { to: "/kanbanBoard", title: "Applications" },
  { to: "/interviews", title: "Interviews" },
  { to: "/analytics", title: "Analytics" },
  { to: "/profile", title: "Profile" },
];

const CandidateNavItems = [
  { to: "/browseJobs", title: "BrowseJobs" },
  { to: "/my-applications", title: "My Applications" },
  { to: "/candidate-profile", title: "Profile" },
];

const AppLayout = () => {
  const role = sessionStorage.getItem("role");
  const navItems = role === "Admin" ? RecruiterNavItems : CandidateNavItems;

  return (
    <div className="app-shell">
      <Sidebar navItems={navItems} />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
