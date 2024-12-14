import React from "react";
import { Link } from "react-router-dom";

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
        </div>
      </div>
    </nav>
  );
}
