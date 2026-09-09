import { chromium, type Cookie } from "playwright";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { createInterface } from "node:readline/promises";
import { validateSessionCookies } from "./cookie-validation";
import type { SessionStore } from "./session-provider";

const LOGIN_URL = "https://candidato.co.computrabajo.com/candidate/home";
const SESSION_COOKIE_NAMES = new Set(["asp.net_sessionid", "uca", "ut"]);
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;
const execFileAsync = promisify(execFile);

function cookieHeader(cookies: Cookie[]): string {
  return cookies.map(({ name, value }) => `${name}=${value}`).join("; ");
}

async function confirmChromiumInstall(): Promise<boolean> {
  const readline = createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  try {
    const answer = await readline.question(
      "Chromium no está instalado. ¿Deseas descargarlo ahora? [s/N] ",
    );
    return /^s(i)?$/i.test(answer.trim());
  } finally {
    readline.close();
  }
}

async function ensureChromiumInstalled(): Promise<void> {
  if (existsSync(chromium.executablePath())) return;

  console.error(
    "Para iniciar sesión se necesita Chromium. La descarga se realiza solo durante este primer inicio de sesión.",
  );
  if (!(await confirmChromiumInstall())) {
    throw new Error(
      "Instalación de Chromium cancelada. Ejecuta iniciar-sesion nuevamente cuando quieras continuar.",
    );
  }

  console.error("Descargando Chromium mediante Playwright...");
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  await execFileAsync(command, ["playwright", "install", "chromium"], {
    windowsHide: true,
  });

  if (!existsSync(chromium.executablePath())) {
    throw new Error(
      "Chromium no quedó disponible después de la instalación. Revisa la salida de Playwright e inténtalo de nuevo.",
    );
  }
}

export async function loginWithBrowser(store: SessionStore): Promise<void> {
  await ensureChromiumInstalled();
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
