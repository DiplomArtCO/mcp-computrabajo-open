export interface SessionProvider {
  getCookies(): Promise<string | undefined>;
  clear(): Promise<void>;
  status(): Promise<"authenticated" | "missing">;
}

export type SessionStore = {
  read(): Promise<string | undefined>;
  write(cookies: string): Promise<void>;
  clear(): Promise<void>;
};

export class StoredSessionProvider implements SessionProvider {
  constructor(private readonly store: SessionStore) {}

  getCookies(): Promise<string | undefined> {
    return this.store.read();
  }

  async status(): Promise<"authenticated" | "missing"> {
    return (await this.store.read()) ? "authenticated" : "missing";
  }

  clear(): Promise<void> {
    return this.store.clear();
  }
}
