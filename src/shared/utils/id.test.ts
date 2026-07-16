import { describe, expect, it, vi } from "vitest";
import { createId } from "./id";

describe("createId", () => {
  it("creates a UUID", () => {
    expect(createId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("falls back when randomUUID is unavailable", () => {
    const original = globalThis.crypto;
    Object.defineProperty(globalThis, "crypto", { value: { getRandomValues: (bytes: Uint8Array) => bytes.fill(7) }, configurable: true });
    expect(createId()).toBe("07070707-0707-4707-8707-070707070707");
    Object.defineProperty(globalThis, "crypto", { value: original, configurable: true });
    vi.restoreAllMocks();
  });
});
