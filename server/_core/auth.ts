import { ACCESS_COOKIE_NAME, ACCESS_TOKEN_TTL_MS, REFRESH_COOKIE_NAME, REFRESH_TOKEN_TTL_MS } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";

type AccessTokenPayload = {
  sub: string;
  type: "access";
};

type RefreshTokenPayload = {
  sub: string;
  type: "refresh";
  jti: string;
};

const refreshTokenIndex = new Map<string, string>();

function getSecret() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

function parseCookies(req: Request) {
  const parsed = parseCookieHeader(req.headers.cookie ?? "");
  return new Map(Object.entries(parsed));
}

async function signJwt(payload: Record<string, unknown>, expiresInMs: number) {
  const expirationSeconds = Math.floor((Date.now() + expiresInMs) / 1000);

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(getSecret());
}

async function issueSessionCookies(res: Response, req: Request, userOpenId: string) {
  const refreshJti = crypto.randomUUID();
  refreshTokenIndex.set(userOpenId, refreshJti);

  const accessToken = await signJwt(
    { sub: userOpenId, type: "access" satisfies AccessTokenPayload["type"] },
    ACCESS_TOKEN_TTL_MS,
  );
  const refreshToken = await signJwt(
    { sub: userOpenId, type: "refresh" satisfies RefreshTokenPayload["type"], jti: refreshJti },
    REFRESH_TOKEN_TTL_MS,
  );

  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    ...cookieOptions,
    maxAge: ACCESS_TOKEN_TTL_MS,
  });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

async function verifyAccessToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.type !== "access" || typeof payload.sub !== "string") return null;
    return payload.sub;
  } catch {
    return null;
  }
}

async function verifyRefreshToken(token: string | undefined | null): Promise<RefreshTokenPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      payload.type !== "refresh" ||
      typeof payload.sub !== "string" ||
      typeof payload.jti !== "string"
    ) {
      return null;
    }

    const expectedJti = refreshTokenIndex.get(payload.sub);
    if (!expectedJti || expectedJti !== payload.jti) return null;

    return {
      sub: payload.sub,
      type: "refresh",
      jti: payload.jti,
    };
  } catch {
    return null;
  }
}

async function getUserByOpenId(openId: string): Promise<User | null> {
  const user = await db.getUserByOpenId(openId);
  return user ?? null;
}

function getBootstrapProfile(req: Request) {
  const openId = req.headers["x-matti-user-id"];
  const name = req.headers["x-matti-user-name"];

  if (typeof openId !== "string" || !openId.trim()) return null;

  return {
    openId: openId.trim(),
    name: typeof name === "string" && name.trim() ? name.trim() : null,
  };
}

export async function authenticateRequest(req: Request, res: Response): Promise<User | null> {
  const cookies = parseCookies(req);
  const accessToken = cookies.get(ACCESS_COOKIE_NAME);
  const refreshToken = cookies.get(REFRESH_COOKIE_NAME);

  const accessOpenId = await verifyAccessToken(accessToken);
  if (accessOpenId) {
    return getUserByOpenId(accessOpenId);
  }

  const refreshPayload = await verifyRefreshToken(refreshToken);
  if (refreshPayload) {
    const user = await getUserByOpenId(refreshPayload.sub);
    if (user) {
      await issueSessionCookies(res, req, user.openId);
      return user;
    }
  }

  const bootstrapProfile = getBootstrapProfile(req);
  if (!bootstrapProfile) return null;

  await db.upsertUser({
    openId: bootstrapProfile.openId,
    name: bootstrapProfile.name,
    loginMethod: "local",
    lastSignedIn: new Date(),
  });

  const user = await getUserByOpenId(bootstrapProfile.openId);
  if (!user) return null;

  await issueSessionCookies(res, req, user.openId);
  return user;
}

export async function rotateRefreshToken(req: Request, res: Response): Promise<boolean> {
  const cookies = parseCookies(req);
  const refreshPayload = await verifyRefreshToken(cookies.get(REFRESH_COOKIE_NAME));
  if (!refreshPayload) return false;

  const user = await getUserByOpenId(refreshPayload.sub);
  if (!user) return false;

  await issueSessionCookies(res, req, user.openId);
  return true;
}

export function revokeRefreshToken(userOpenId: string | null | undefined) {
  if (!userOpenId) return;
  refreshTokenIndex.delete(userOpenId);
}
