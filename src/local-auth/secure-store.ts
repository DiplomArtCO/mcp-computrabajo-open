import keytar from "keytar";
import type { SessionStore } from "./session-provider";

export const KEYCHAIN_SERVICE = "mcp-computrabajo";
export const KEYCHAIN_ACCOUNT = "computrabajo-session";

export class KeytarSessionStore implements SessionStore {
  read(): Promise<string | undefined> {
    return keytar
      .getPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT)
      .then((value) => value || undefined);
  }

  async write(cookies: string): Promise<void> {
    await keytar.setPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT, cookies);
  }

  async clear(): Promise<void> {
    await keytar.deletePassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT);
  }
}
