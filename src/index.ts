#!/usr/bin/env node
import { name, version } from "../package.json";
import { loadConfig } from "./config/node-config";
import { ComputrabajoHttpRepository } from "./infrastructure/http/computrabajo-http.repository";
import { startServer } from "./infrastructure/mcp/stdio";
import { loginWithBrowser } from "./local-auth/browser-login";
import { KeytarSessionStore } from "./local-auth/secure-store";

async function main(): Promise<void> {
  const command = process.argv[2];
  const store = new KeytarSessionStore();

  if (command === "iniciar-sesion" || command === "login") {
    await loginWithBrowser(store);
    return;
  }

  if (command === "cerrar-sesion" || command === "logout") {
    await store.clear();
    console.error("Sesión local eliminada.");
    return;
  }

  if (command === "estado" || command === "status") {
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
