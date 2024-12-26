import React from "react";
import { Link } from "react-router-dom";
import Symbol from "./Symbol";

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link to={href} className="navbar-item">
      {label}
    </Link>
  );
}

function HamburgerButton({
  onClick,
  isActive,
}: {
  onClick: () => void;
  isActive: boolean;
}) {
  return (
    <a
      role="button"
      className={"navbar-burger " + (isActive ? "is-active" : "")}
      aria-label="menu"
      aria-expanded="false"
      onClick={onClick}
    >
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
    </a>
  );
}

function ThemeDropDown() {
  const setTheme = (theme: string) => {
    document.documentElement.dataset["theme"] = theme;
  };
  return (
    <div className="dropdown is-hoverable">
      <div className="dropdown-trigger">
        <button className="button">
          <span>Theme</span>
          <span className="icon is-small">
            <Symbol name="arrow_drop_down" />
          </span>
        </button>
      </div>
      <div className="dropdown-menu">
        <div className="dropdown-content">
          {["Light", "Dark"].map((theme) => (
            <a
              key={theme}
              className="dropdown-item"
              onClick={() => {
                setTheme(theme.toLowerCase());
              }}
            >
              {theme}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Nav() {
  const [menuActive, setMenuActive] = React.useState(false);

  return (
    <nav className="navbar" role="navigation">
      <div className="navbar-brand">
        <HamburgerButton
          onClick={() => {
            setMenuActive(!menuActive);
          }}
          isActive={menuActive}
        />
      </div>
      <div className={"navbar-menu " + (menuActive ? "is-active" : "")}>
        <div className="navbar-start"></div>
        <div className="navbar-end">
          <NavLink href="/" label="Home" />
          <NavLink href="/new" label="New Game" />
          <NavLink href="/words" label="Words" />
          <div className="navbar-item">
            <ThemeDropDown />
          </div>
        </div>
      </div>
    </nav>
  );
}
