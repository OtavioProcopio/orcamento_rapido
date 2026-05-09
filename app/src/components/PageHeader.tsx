import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => {
  return (
    <header className="page-header">
      <div>
        <p className="page-eyebrow">Orca Rapido</p>
        <h1>{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
};
