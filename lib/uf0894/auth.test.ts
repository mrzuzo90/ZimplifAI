import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  clearAccessUnlocked,
  isAccessUnlocked,
  setAccessUnlocked,
  UF0894_ACCESS_CODE,
  UF0894_STORAGE_KEY,
  verifyAccessCode,
} from "./auth";

class MockStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

describe("UF0894 Client-Side Auth & SessionStorage", () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
    // Simulamos window y sessionStorage en el entorno Node de Vitest
    // @ts-expect-error Simulación de window en entorno de test Node
    globalThis.window = {
      sessionStorage: mockStorage,
    };
  });

  afterEach(() => {
    // @ts-expect-error Limpieza de window
    delete globalThis.window;
  });

  describe("verifyAccessCode", () => {
    it("accepts valid ELEE0109 code", () => {
      expect(verifyAccessCode("ELEE0109")).toBe(true);
    });

    it("accepts lowercase, untrimmed and mixed-whitespace inputs", () => {
      expect(verifyAccessCode("elee0109")).toBe(true);
      expect(verifyAccessCode("  ELEE0109  ")).toBe(true);
      expect(verifyAccessCode("\n elee0109 \t")).toBe(true);
    });

    it("rejects invalid codes and non-string inputs", () => {
      expect(verifyAccessCode("ELEE0108")).toBe(false);
      expect(verifyAccessCode("WRONG_CODE")).toBe(false);
      expect(verifyAccessCode("")).toBe(false);
      expect(verifyAccessCode("   ")).toBe(false);
      expect(verifyAccessCode(null)).toBe(false);
      expect(verifyAccessCode(undefined)).toBe(false);
      expect(verifyAccessCode(12345)).toBe(false);
      expect(verifyAccessCode({})).toBe(false);
    });
  });

  describe("sessionStorage persistence (tab lifetime)", () => {
    it("starts locked when sessionStorage is empty", () => {
      expect(isAccessUnlocked()).toBe(false);
    });

    it("stores an unlock flag and never the plain text password in storage", () => {
      setAccessUnlocked();
      expect(isAccessUnlocked()).toBe(true);

      const storedValue = mockStorage.getItem(UF0894_STORAGE_KEY);
      expect(storedValue).toBe("true");
      expect(storedValue).not.toContain(UF0894_ACCESS_CODE);
      expect(storedValue).not.toContain("ELEE0109");
    });

    it("clears unlocked state on lock/logout", () => {
      setAccessUnlocked();
      expect(isAccessUnlocked()).toBe(true);

      clearAccessUnlocked();
      expect(isAccessUnlocked()).toBe(false);
      expect(mockStorage.getItem(UF0894_STORAGE_KEY)).toBeNull();
    });

    it("handles SSR gracefully when window is undefined", () => {
      // @ts-expect-error Simulación SSR
      delete globalThis.window;

      expect(() => isAccessUnlocked()).not.toThrow();
      expect(isAccessUnlocked()).toBe(false);
      expect(() => setAccessUnlocked()).not.toThrow();
      expect(() => clearAccessUnlocked()).not.toThrow();
    });

    it("handles unexpected storage failures gracefully", () => {
      mockStorage.getItem = () => {
        throw new Error("QuotaExceeded or disabled storage");
      };

      expect(() => isAccessUnlocked()).not.toThrow();
      expect(isAccessUnlocked()).toBe(false);
    });
  });

  describe("no server auth or env secret dependency", () => {
    it("does not require any server environment variables or HMAC secrets", () => {
      expect(process.env.UF0894_SESSION_SECRET).toBeUndefined();
      expect(process.env.AUTH_SECRET).toBeUndefined();
      expect(verifyAccessCode(UF0894_ACCESS_CODE)).toBe(true);
    });
  });
});
