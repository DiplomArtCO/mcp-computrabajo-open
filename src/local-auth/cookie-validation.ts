const REQUIRED_COOKIE = "asp.net_sessionid";
const IDENTITY_COOKIES = ["uca", "ut"];

export function validateSessionCookies(raw: string): string | undefined {
  const cookies = raw.trim().replace(/^Cookie:\s*/i, "");
  const names = new Set(
    cookies
      .split(";")
      .map((part) => part.slice(0, part.indexOf("=")).trim().toLowerCase())
      .filter(Boolean),
  );

  if (
    !cookies ||
    !names.has(REQUIRED_COOKIE) ||
    !IDENTITY_COOKIES.some((name) => names.has(name))
  ) {
    return undefined;
  }

  return cookies;
}
