"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: string;
  active?: boolean;
  disabled?: boolean;
  primary?: boolean;
};

export function PageShell({ children, className }: PageShellProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const navItems: NavItem[] = [
    { label: "홈", href: "/", icon: "⌂", active: pathname === "/" },
    { label: "일정", href: "/diary", icon: "◫", active: pathname === "/diary" },
    { label: "기록", href: "/create", icon: "+", active: pathname === "/create", primary: true },
    {
      label: "티켓",
      href: "/collection",
      icon: "▭",
      active: pathname === "/collection" || pathname.startsWith("/entries/"),
    },
    { label: "MY", href: "/my", icon: "◌", active: pathname === "/my" },
  ] as const;

  return (
    <main
      className={`page-shell ${isHome ? "page-shell--landing" : "page-shell--app"} ${className ?? ""}`.trim()}
    >
      <div className="stadium-backdrop" />
      <div className="page-shell__paper" />
      {!isHome ? (
        <header className="app-topbar">
          <span className="app-topbar__corner app-topbar__corner--left" />
          <span className="app-topbar__corner app-topbar__corner--right" />
          <div className="app-topbar__inner">
            <strong>BALLLOG</strong>
            <p>⚾ 야구 직관 다이어리</p>
          </div>
        </header>
      ) : null}
      <div className="page-shell__inner">{children}</div>
      <nav aria-label="하단 내비게이션" className="bottom-nav">
        <div className="bottom-nav__inner">
          {navItems.map((item) =>
            item.disabled ? (
              <span
                aria-disabled="true"
                className={`bottom-nav__item${item.primary ? " bottom-nav__item--primary" : ""}`}
                key={item.label}
              >
                <span className="bottom-nav__icon">
                  {item.primary ? <span className="bottom-nav__plus">+</span> : item.icon}
                </span>
                <span className="bottom-nav__label">{item.label}</span>
              </span>
            ) : (
              <Link
                className={`bottom-nav__item${item.active ? " bottom-nav__item--active" : ""}${item.primary ? " bottom-nav__item--primary" : ""}`}
                href={item.href}
                key={item.label}
              >
                <span className="bottom-nav__icon">
                  {item.primary ? <span className="bottom-nav__plus">+</span> : item.icon}
                </span>
                <span className="bottom-nav__label">{item.label}</span>
              </Link>
            ),
          )}
        </div>
      </nav>
    </main>
  );
}
