import { createServer, type ServerResponse } from "node:http";
import { loginWithBrowser } from "./browser-login";
import type { SessionStore } from "./session-provider";

const DEFAULT_PORT = 8765;
const DEFAULT_REMOTE_SERVER =
  "https://computrabajo-mcp.torres-sergio2205.workers.dev";

class MemorySessionStore implements SessionStore {
  private cookies?: string;

  async read(): Promise<string | undefined> {
    return this.cookies;
  }

  async write(cookies: string): Promise<void> {
    this.cookies = cookies;
  }

  async clear(): Promise<void> {
    this.cookies = undefined;
  }
}

function response(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(body);
}

export async function startRemoteLogin(
  port = DEFAULT_PORT,
  allowedServer = process.env.CT_REMOTE_SERVER || DEFAULT_REMOTE_SERVER,
): Promise<void> {
  const server = createServer(async (request, res) => {
    const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);

    if (url.pathname !== "/login" || request.method !== "GET") {
      res.writeHead(404).end();
      return;
    }

    const remoteServer = url.searchParams.get("server");
    const challenge = url.searchParams.get("challenge");
    if (
      !remoteServer ||
      !challenge ||
      !/^https:\/\//i.test(remoteServer) ||
      new URL(remoteServer).origin !== allowedServer
    ) {
      response(res, 400, "<p>Enlace de inicio de sesión inválido.</p>");
      return;
    }

    try {
      const store = new MemorySessionStore();
      await loginWithBrowser(store);
      const cookies = await store.read();
      if (!cookies) throw new Error("No se detectó una sesión válida.");

      const claim = await fetch(`${remoteServer}/session/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge, cookies }),
      });
      if (!claim.ok) throw new Error("El enlace remoto expiró o ya fue utilizado.");

      response(
        res,
        200,
        "<p>Sesión detectada. Puedes cerrar esta pestaña y volver al cliente MCP.</p>",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      response(res, 500, `<p>${message.replace(/[<>&"]/g, "")}</p>`);
    } finally {
      server.close();
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });

  console.error(
    `Puente de inicio de sesión listo en http://127.0.0.1:${port}. Abre el enlace “Iniciar sesión automáticamente” del consentimiento OAuth.`,
  );
}
