"use server";

// Server actions for the /tracking password gate. Setting/deleting cookies is
// only allowed in a Server Action or Route Handler (not during render), which
// is exactly what these are.

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  passwordMatches,
  createSessionToken,
  isTrackingConfigured,
  TRACKING_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/tracking-auth";
import { rateLimit, ipFromHeaders } from "@/lib/rate-limit";

export type LoginState = { error?: string };

// Brute-force guard: at most 10 attempts per IP per 10 minutes.
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_SEC = 600;

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  // Fail closed if the gate isn't configured for production (no password/secret).
  if (!isTrackingConfigured()) {
    return {
      error:
        "Dashboard is not configured. Set TRACKING_PASSWORD and TRACKING_SESSION_SECRET in the environment.",
    };
  }

  const password = String(formData.get("password") ?? "");

  // Check the password first so a correct login is never rate-limited — only
  // FAILED attempts consume the brute-force budget (a legit admin logging in
  // repeatedly can't lock themselves out).
  if (passwordMatches(password)) {
    const cookieStore = await cookies();
    cookieStore.set(TRACKING_COOKIE, createSessionToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    redirect("/tracking");
  }

  // Wrong password: consume a token and lock out after too many failures/IP.
  const ip = ipFromHeaders(await headers());
  const gate = await rateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_SEC);
  if (!gate.allowed) {
    return { error: `Too many attempts. Try again in ${gate.retryAfterSec}s.` };
  }

  // Small fixed delay slows scripted guessing; generic message reveals nothing.
  await new Promise((r) => setTimeout(r, 400));
  return { error: "Incorrect password. Please try again." };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TRACKING_COOKIE);
  redirect("/tracking/login");
}
