#!/usr/bin/env node
import { name, version } from "../package.json";
import { loadConfig } from "./config/node-config";
import { ComputrabajoHttpRepository } from "./infrastructure/http/computrabajo-http.repository";
import { startServer } from "./infrastructure/mcp/stdio";
import { loginWithBrowser } from "./local-auth/browser-login";
import { startRemoteLogin } from "./local-auth/remote-login";

async function main(): Promise<void> {
  const command = process.argv[2];

  if (command === "iniciar-sesion" || command === "login") {
    const { KeytarSessionStore } = await import("./local-auth/secure-store");
    const store = new KeytarSessionStore();
    await loginWithBrowser(store);
    return;
  }

  if (command === "iniciar-sesion-remota" || command === "remote-login") {
    await startRemoteLogin();
    return;
  }

  if (command === "cerrar-sesion" || command === "logout") {
    const { KeytarSessionStore } = await import("./local-auth/secure-store");
    const store = new KeytarSessionStore();
    await store.clear();
    console.error("Sesión local eliminada.");
    return;
  }

  if (command === "estado" || command === "status") {
    if (process.env.CT_DISABLE_LOCAL_SESSION === "1") {
      console.error("No hay sesión local.");
      return;
    }
    const { KeytarSessionStore } = await import("./local-auth/secure-store");
    const store = new KeytarSessionStore();
    console.error(
      (await store.read()) ? "Sesión local disponible." : "No hay sesión local.",
    );
    return;
  }

  startServer(
    { name, version },
    new ComputrabajoHttpRepository(await loadConfig()),
  );
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
