import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Gauge, ShieldCheck } from "lucide-react";
import { verifySessionToken, TRACKING_COOKIE } from "@/lib/tracking-auth";
import SideNav, { ScreenCrumb } from "../SideNav";
import Toolbar from "../Toolbar";
import styles from "../tracking.module.css";

// This layout is the password gate for EVERY dashboard screen. /tracking/login
// deliberately sits outside this route group so it stays reachable — adding a
// screen inside (dashboard) gates it automatically, with no per-page check to
// forget.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(TRACKING_COOKIE)?.value)) {
    redirect("/tracking/login");
  }

  return (
    <main className={styles.page}>
      <div className={styles.appShell}>
        <aside className={styles.sidebar}>
          <Link className={styles.brand} href="/tracking" aria-label="Jesus Boot Camp dashboard overview">
            <Image
              className={styles.brandLogo}
              src="/icon.jpg"
              alt="Jesus Boot Camp"
              width={42}
              height={42}
              priority
            />
            <span>
              <strong>Jesus Boot Camp</strong>
              <small>Owner dashboard</small>
            </span>
          </Link>
          <SideNav />
          <div className={styles.sideNote}>
            <ShieldCheck size={17} />
            <span>Private, password-protected reporting. Every figure is read from a live source — nothing here is estimated.</span>
          </div>
        </aside>

        <div className={styles.workspace}>
          <header className={styles.topbar}>
            <div className={styles.breadcrumb}>
              <Gauge size={15} /> Live reporting <span aria-hidden="true">›</span> <ScreenCrumb />
            </div>
            <Toolbar />
          </header>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </main>
  );
}
