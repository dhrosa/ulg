import React from "react";

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
          <a href="/" className="navbar-item">
            Home
          </a>
        </div>
      </div>
    </nav>
  );
}