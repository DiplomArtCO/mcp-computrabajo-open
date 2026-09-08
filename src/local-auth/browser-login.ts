import { chromium, type Cookie } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { validateSessionCookies } from "./cookie-validation";
import type { SessionStore } from "./session-provider";

const LOGIN_URL = "https://candidato.co.computrabajo.com/candidate/home";
const SESSION_COOKIE_NAMES = new Set(["asp.net_sessionid", "uca", "ut"]);
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

function cookieHeader(cookies: Cookie[]): string {
  return cookies.map(({ name, value }) => `${name}=${value}`).join("; ");
}

export async function loginWithBrowser(store: SessionStore): Promise<void> {
  const context = await chromium.launchPersistentContext(
    join(homedir(), ".computrabajo", "browser-profile"),
    {
    headless: false,
    },
  );

  try {
    const page = await context.newPage();
    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });
    console.error(
      "Completa el inicio de sesión en la ventana de Computrabajo. El agente no captura tu contraseña.",
    );
    const deadline = Date.now() + LOGIN_TIMEOUT_MS;
    let validated: string | undefined;

    while (Date.now() < deadline) {
      const cookies = await context.cookies();
      const sessionCookies = cookies.filter(({ name }) =>
        SESSION_COOKIE_NAMES.has(name.toLowerCase()),
      );
      validated = validateSessionCookies(cookieHeader(sessionCookies));
      if (validated) break;
      await page.waitForTimeout(1000);
    }

    if (!validated) {
      throw new Error(
        "No se detectó una sesión válida después de 5 minutos. Completa el inicio de sesión e inténtalo de nuevo.",
      );
    }

    await store.write(validated);
    console.error("Sesión guardada de forma segura. Ya puedes iniciar el MCP local.");
  } finally {
    await context.close();
  }
}
