import { describe, expect, test } from "bun:test";
import {
  claimSession,
  sessionStatus,
  type RemoteSessionKv,
} from "../../src/auth/remote-session";

const COOKIES = "ut=abc; uca=i=1; ASP.NET_SessionId=session";

function fakeKv(value?: unknown): RemoteSessionKv {
  return {
    async get(_key: string, type?: string) {
      return type === "json" ? (value ?? null) : null;
    },
    async put() {},
    async delete() {},
  } as unknown as RemoteSessionKv;
}

describe("remote session bridge", () => {
  test("rejects an invalid cookie claim", async () => {
    const response = await claimSession(
      new Request("https://example.com/session/claim", {
        method: "POST",
        body: JSON.stringify({ challenge: "challenge", cookies: "not-a-cookie" }),
      }),
      fakeKv({ authUrl: "https://example.com/authorize", clientId: "client" }),
    );

    expect(response.status).toBe(400);
  });

  test("rejects a missing or expired challenge", async () => {
    const response = await claimSession(
      new Request("https://example.com/session/claim", {
        method: "POST",
        body: JSON.stringify({ challenge: "expired", cookies: COOKIES }),
      }),
      fakeKv(),
    );

    expect(response.status).toBe(410);
  });

  test("does not allow a claimed challenge to be reused", async () => {
    const response = await claimSession(
      new Request("https://example.com/session/claim", {
        method: "POST",
        body: JSON.stringify({ challenge: "used", cookies: COOKIES }),
      }),
      fakeKv({
        authUrl: "https://example.com/authorize",
        clientId: "client",
        cookies: COOKIES,
      }),
    );

    expect(response.status).toBe(410);
  });

  test("reports pending and ready status without exposing cookies", async () => {
    const pending = await sessionStatus(
      new Request("https://example.com/session/status?challenge=pending"),
      fakeKv({
        authUrl: "https://example.com/authorize",
        clientId: "client",
      }),
    );
    expect(await pending.json()).toEqual({ status: "pending" });

    const ready = await sessionStatus(
      new Request("https://example.com/session/status?challenge=ready"),
      fakeKv({
        authUrl: "https://example.com/authorize",
        clientId: "client",
        cookies: COOKIES,
      }),
    );
    expect(await ready.json()).toEqual({ status: "ready" });
  });
});
