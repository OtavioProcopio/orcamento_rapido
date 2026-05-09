import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export const Card = ({ title, children, className = "" }: CardProps) => {
  return (
    <section className={`card ${className}`.trim()}>
      {title ? <h3>{title}</h3> : null}
      {children}
    </section>
  );
};
