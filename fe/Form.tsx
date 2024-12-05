import React, { ReactNode } from "react";

export function ErrorList({ errors }: { errors?: string[] }) {
  if (!errors) {
    return false;
  }
  return (
    <ul className="has-text-danger">
      {errors.map((e, i) => (
        <li key={i} className="help">
          {e}
        </li>
      ))}
    </ul>
  );
}

export function Field({
  className,
  ...rest
}: {
  className?: string;
} & React.ComponentProps<"div">) {
  return <div className={"field " + (className ?? "")} {...rest} />;
}

export function Control({
  className,
  ...rest
}: {
  className?: string;
} & React.ComponentProps<"div">) {
  return <div className={"control " + (className ?? "")} {...rest} />;
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="label">{children}</label>;
}

export function SubmitButton({
  children = "Submit",
  className,
  ...rest
}: {
  children: ReactNode;
  className?: string;
} & React.ComponentPropsWithRef<"button">) {
  return (
    <button
      type="submit"
      className={"button is-primary " + (className ?? "")}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Input({
  type,
  ...rest
}: { type?: string } & React.ComponentProps<"input">) {
  return <input className="input" type={type ?? "text"} {...rest} />;
}

export function Help({ children }: { children: ReactNode }) {
  return <p className="help">{children}</p>;
}
