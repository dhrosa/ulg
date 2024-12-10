import React from "react";
export default function Tag({
  className,
  ...rest
}: { className?: string } & React.ComponentProps<"div">) {
  return <div className={`tag ${className || ""}`} {...rest} />;
}
