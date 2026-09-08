import { describe, expect, test } from "bun:test";
import { StoredSessionProvider, type SessionStore } from "../../src/local-auth/session-provider";

function createStore(initial?: string): SessionStore & { value?: string } {
  return {
    value: initial,
    read: async function () {
      return this.value;
    },
    write: async function (cookies) {
      this.value = cookies;
    },
    clear: async function () {
      this.value = undefined;
    },
  };
}

describe("StoredSessionProvider", () => {
  test("reports and returns an available session", async () => {
    const provider = new StoredSessionProvider(createStore("SESSION=redacted"));

    expect(await provider.status()).toBe("authenticated");
    expect(await provider.getCookies()).toBe("SESSION=redacted");
  });

  test("clears the local session", async () => {
    const store = createStore("SESSION=redacted");
    const provider = new StoredSessionProvider(store);

    await provider.clear();

    expect(await provider.status()).toBe("missing");
    expect(await provider.getCookies()).toBeUndefined();
  });
});
