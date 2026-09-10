import { json } from "../shared/cors";
import { checkCookieInput } from "./cookie-input";

export const SESSION_KEY_PREFIX = "remote-session:";
export const SESSION_TTL_SECONDS = 300;
const CHALLENGE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type PendingSession = {
  authUrl: string;
  clientId: string;
  createdAt: number;
  cookies?: string;
};

export interface RemoteSessionKv {
  get<T>(key: string, type: "json"): Promise<T | null>;
  put(key: string, value: string, options: { expirationTtl: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export async function claimSession(
  request: Request,
  kv: RemoteSessionKv,
): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const body = (await request.json().catch(() => null)) as
    | { challenge?: unknown; cookies?: unknown }
    | null;
  const challenge = typeof body?.challenge === "string" ? body.challenge : "";
  const cookies = typeof body?.cookies === "string" ? body.cookies : "";
  const checked = checkCookieInput(cookies);
  if (!CHALLENGE_PATTERN.test(challenge) || !checked.ok) {
    return json({ error: "Invalid session" }, 400);
  }

  const key = `${SESSION_KEY_PREFIX}${challenge}`;
  const pending = await kv.get<PendingSession>(key, "json");
  if (!pending || pending.cookies) return json({ error: "Expired session" }, 410);

  await kv.put(
    key,
    JSON.stringify({ ...pending, cookies: checked.cookies }),
    { expirationTtl: SESSION_TTL_SECONDS },
  );
  return json({ ok: true });
}

export async function getClaimedSession(
  challenge: string,
  kv: RemoteSessionKv,
): Promise<PendingSession | null> {
  if (!CHALLENGE_PATTERN.test(challenge)) return null;
  const pending = await kv.get<PendingSession>(
    `${SESSION_KEY_PREFIX}${challenge}`,
    "json",
  );
  if (!pending?.cookies) return null;
  return pending;
}

export async function sessionStatus(
  request: Request,
  kv: RemoteSessionKv,
): Promise<Response> {
  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
  const challenge = new URL(request.url).searchParams.get("challenge") || "";
  if (!CHALLENGE_PATTERN.test(challenge)) {
    return json({ status: "expired" }, 410);
  }
  const pending = challenge
    ? await kv.get<PendingSession>(`${SESSION_KEY_PREFIX}${challenge}`, "json")
    : null;
  if (!pending) return json({ status: "expired" }, 410);
  return json({ status: pending.cookies ? "ready" : "pending" });
}
