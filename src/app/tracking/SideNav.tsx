"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CircleDollarSign,
  Database,
  LayoutDashboard,
  Mail,
  Megaphone,
  UserPlus,
  Users,
} from "lucide-react";
import styles from "./tracking.module.css";

/** The dashboard's screens, in sidebar order. One entry = one route. */
export const SCREENS = [
  { href: "/tracking", label: "Overview", Icon: LayoutDashboard },
  { href: "/tracking/course", label: "Course access", Icon: BookOpen },
  { href: "/tracking/email", label: "Email", Icon: Mail },
  { href: "/tracking/audience", label: "Audience", Icon: Users },
  { href: "/tracking/sales", label: "Sales", Icon: CircleDollarSign },
  { href: "/tracking/ads", label: "Acquisition", Icon: Megaphone },
  { href: "/tracking/enroll", label: "Enrol by hand", Icon: UserPlus },
  { href: "/tracking/sources", label: "Data sources", Icon: Database },
] as const;

/** Overview only matches exactly; every other screen also owns its sub-routes. */
function isCurrent(pathname: string, href: string): boolean {
  if (href === "/tracking") return pathname === "/tracking";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SideNav() {
  const pathname = usePathname() ?? "/tracking";
  return (
    <nav className={styles.sideNav} aria-label="Dashboard screens">
      {SCREENS.map(({ href, label, Icon }) => {
        const current = isCurrent(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={current ? styles.sideNavCurrent : undefined}
            aria-current={current ? "page" : undefined}
          >
            <Icon size={17} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** The "Live reporting › Sales" trail in the topbar. */
export function ScreenCrumb() {
  const pathname = usePathname() ?? "/tracking";
  const screen = [...SCREENS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((entry) => isCurrent(pathname, entry.href));
  const deeper = screen && pathname !== screen.href;
  return (
    <>
      <span>{screen?.label ?? "Overview"}</span>
      {deeper ? <span className={styles.crumbLeaf}>· detail</span> : null}
    </>
  );
}
