import type { SessionStore } from "./session-provider";

export const KEYCHAIN_SERVICE = "mcp-computrabajo-open";
export const KEYCHAIN_ACCOUNT = "computrabajo-session";

export class KeytarSessionStore implements SessionStore {
  async read(): Promise<string | undefined> {
    const { default: keytar } = await import("keytar");
    const value = await keytar.getPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT);
    return value || undefined;
  }

  async write(cookies: string): Promise<void> {
    const { default: keytar } = await import("keytar");
    await keytar.setPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT, cookies);
  }

  async clear(): Promise<void> {
    const { default: keytar } = await import("keytar");
    await keytar.deletePassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT);
  }
}
