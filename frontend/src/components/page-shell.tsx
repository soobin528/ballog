import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <main className={`page-shell ${className ?? ""}`.trim()}>
      <div className="stadium-backdrop" />
      <div className="page-shell__inner">{children}</div>
    </main>
  );
}
