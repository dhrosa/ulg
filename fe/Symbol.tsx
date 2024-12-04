import React from "react";

export default function Symbol({
  className,
  name,
}: {
  className?: string;
  name: string;
} & React.ComponentProps<"span">) {
  return (
    <span className={`material-symbols-outlined ${className || ""}`}>
      {name}
    </span>
  );
}
