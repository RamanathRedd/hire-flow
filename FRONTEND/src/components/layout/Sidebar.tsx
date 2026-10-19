import { useState } from "react";
import { NavLink } from "react-router-dom";

interface NavItem {
  to: string;
  title: string;
}

interface SideBarProps {
  navItems: NavItem[];
}

const Sidebar = (props: SideBarProps) => {
  const { navItems } = props;
  const [sideBarOpen, setSideBarOpen] = useState<boolean>(true);

  return (
    <aside className={`sidebar${sideBarOpen ? "" : " is-collapsed"}`}>
      <div className="sidebar-brand">
        <span className="sidebar-brand-name">HireFlow</span>
        <button
          className="sidebar-toggle"
          type="button"
          aria-label={sideBarOpen ? "Collapse sidebar" : "Expand sidebar"}
          onClick={() => setSideBarOpen((prev) => !prev)}
        >
          {sideBarOpen ? "«" : "»"}
        </button>
      </div>
      <nav className="sidebar-nav" aria-label="Sidebar navigation">
        {navItems.map((navItem) => (
          <NavLink
            key={navItem.title}
            to={navItem.to}
            className={({ isActive }) =>
              isActive ? "sidebar-link is-active" : "sidebar-link"
            }
          >
            {navItem.title}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
