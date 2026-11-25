import { NextResponse } from "next/server";
import { route } from "../handler";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession } from "../security";
import * as authService from "../services/auth";
import type { User } from "@/domain/types";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

function withSession(user: User, status = 200): Response {
  const res = NextResponse.json({ data: { user } }, { status });
  res.cookies.set(SESSION_COOKIE, signSession(user.id), { ...cookieOptions, maxAge: SESSION_TTL_SECONDS });
  return res;
}

export const registerRoute = route(
  async ({ req }) => withSession(await authService.register(await req.json().catch(() => ({}))), 201),
  { auth: false },
);

export const loginRoute = route(
  async ({ req }) => withSession(await authService.login(await req.json().catch(() => ({})))),
  { auth: false },
);

export const logoutRoute = route(
  async () => {
    const res = NextResponse.json({ data: null });
    res.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    return res;
  },
  { auth: false },
);

export const meRoute = route(async ({ user }) => ({ user }));
