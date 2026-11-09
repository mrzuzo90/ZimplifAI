import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(path.join(__dirname, "UF0894Gate.tsx"), "utf8");

describe("UF0894Gate access-code privacy & client gatekeeping", () => {
  it("does not reveal the access code in placeholder or visible copy", () => {
    // Extrae y valida el placeholder
    const placeholderMatch = source.match(/placeholder="([^"]*)"/);
    expect(placeholderMatch).toBeTruthy();
    expect(placeholderMatch?.[1]).not.toMatch(/ELEE0109/i);
    expect(placeholderMatch?.[1]).not.toMatch(/Ej\./i);

    // Comprueba que los textos de interfaz y encabezados no muestren la clave
    expect(source).not.toMatch(/<h[1-6][^>]*>[^<]*ELEE0109/i);
    expect(source).not.toMatch(/<p[^>]*>[^<]*ELEE0109/i);
    expect(source).not.toMatch(/<label[^>]*>[^<]*ELEE0109/i);
    expect(source).not.toMatch(/<span[^>]*>[^<]*ELEE0109/i);
  });

  it("does not embed any secret env var or server dependency in the client component", () => {
    expect(source).not.toMatch(/UF0894_SESSION_SECRET|AUTH_SECRET|process\.env/);
  });

  it("includes a clear technical comment explaining the casual barrier visible in bundle", () => {
    expect(source).toMatch(/barrera casual/i);
    expect(source).toMatch(/bundle/i);
    expect(source).toMatch(/inspeccionar/i);
  });
});
