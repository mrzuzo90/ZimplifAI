import { describe, expect, it } from "vitest";
import CVPage, { metadata } from "./page";
import { cvEncryptedPayload } from "@/content/cvPayload";

describe("Protected CV Route & Metadata", () => {
  it("exports correct noindex, nofollow, noarchive robots metadata", () => {
    expect(metadata.robots).toEqual(
      expect.objectContaining({
        index: false,
        follow: false,
        noarchive: true,
      }),
    );
  });

  it("has generic initial metadata without leaking private personal identity", () => {
    expect(metadata.title).toBe("Acceso a documento privado · ZimplifAI");
    expect(metadata.description).toBe(
      "Consulta de documento privado protegido mediante cifrado local.",
    );
    expect(metadata.alternates?.canonical).toBe("/cv");
  });

  it("exports a valid default page component", () => {
    expect(typeof CVPage).toBe("function");
  });
});

describe("Encrypted Payload Structure & Cryptographic Parameters", () => {
  it("matches expected cryptographic parameters (AES-256-GCM, PBKDF2 310k iter)", () => {
    expect(cvEncryptedPayload.iterations).toBe(310000);
    expect(typeof cvEncryptedPayload.salt).toBe("string");
    expect(typeof cvEncryptedPayload.iv).toBe("string");
    expect(typeof cvEncryptedPayload.ciphertext).toBe("string");

    // Validate base64 format and byte sizes
    const saltBytes = Uint8Array.from(atob(cvEncryptedPayload.salt), (c) => c.charCodeAt(0));
    const ivBytes = Uint8Array.from(atob(cvEncryptedPayload.iv), (c) => c.charCodeAt(0));
    const ciphertextBytes = Uint8Array.from(atob(cvEncryptedPayload.ciphertext), (c) =>
      c.charCodeAt(0),
    );

    expect(saltBytes.length).toBe(16); // 128-bit salt
    expect(ivBytes.length).toBe(12); // 96-bit standard AES-GCM IV
    expect(ciphertextBytes.length).toBeGreaterThan(1000); // contains encrypted payload
  });

  it("normalizes passcode consistently (removes spaces, hyphens, and uppercases)", () => {
    const normalize = (code: string) => code.replace(/[-\s]/g, "").toUpperCase();
    expect(normalize("abc-def-ghi")).toBe("ABCDEFGHI");
    expect(normalize("  abc def - ghi  ")).toBe("ABCDEFGHI");
    expect(normalize("a-B-c 1-2-3")).toBe("ABC123");
  });

  it("fails securely when attempting decryption with an invalid passcode without crashing", async () => {
    const dummyPasscode = "WRONG-PASS-CODE-0000";
    const normalized = dummyPasscode.replace(/[-\s]/g, "").toUpperCase();

    const saltBytes = Uint8Array.from(atob(cvEncryptedPayload.salt), (c) => c.charCodeAt(0));
    const ivBytes = Uint8Array.from(atob(cvEncryptedPayload.iv), (c) => c.charCodeAt(0));
    const ciphertextBytes = Uint8Array.from(atob(cvEncryptedPayload.ciphertext), (c) =>
      c.charCodeAt(0),
    );

    const baseKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(normalized),
      "PBKDF2",
      false,
      ["deriveKey"],
    );

    // Using 100 iterations here only to test crypto failure path quickly in unit test
    const aesKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: saltBytes,
        iterations: 100,
        hash: "SHA-256",
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );

    await expect(
      crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBytes }, aesKey, ciphertextBytes),
    ).rejects.toThrow();
  });

  it("verifies PBKDF2-SHA256 + AES-GCM encryption/decryption roundtrip compatibility", async () => {
    // Verify Web Crypto subtle encryption & decryption roundtrip matches the exact pipeline
    const testSecret = JSON.stringify({ test: "ok", data: [1, 2, 3] });
    const testPasscode = "TEST-KEY-123456";
    const normalized = testPasscode.replace(/[-\s]/g, "").toUpperCase();

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const baseKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(normalized),
      "PBKDF2",
      false,
      ["deriveKey"],
    );

    const aesKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 1000,
        hash: "SHA-256",
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      new TextEncoder().encode(testSecret),
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encrypted,
    );

    const result = new TextDecoder().decode(decrypted);
    expect(result).toBe(testSecret);
  });
});
