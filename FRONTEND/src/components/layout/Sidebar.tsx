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

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">HireFlow</div>
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
