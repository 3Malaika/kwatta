import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Fait respecter la règle d'architecture :
 * front → (HTTP) → back → data ; tout le monde peut lire domain ; domain ne dépend de rien.
 */
const SRC = path.resolve(__dirname, "../src");

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? files(p) : /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}

function imports(file: string): string[] {
  const src = fs.readFileSync(file, "utf8");
  return [...src.matchAll(/(?:import|export)[^'"]*?from\s+["']([^"']+)["']/g)].map((m) => m[1]);
}

const FORBIDDEN: Record<string, string[]> = {
  domain: ["@/front", "@/back", "@/data", "next", "react", "pg"],
  data: ["@/front", "@/back"],
  back: ["@/front"],
  front: ["@/back", "@/data", "pg"],
};

describe("architecture", () => {
  for (const [layer, banned] of Object.entries(FORBIDDEN)) {
    it(`${layer}/ n'importe pas : ${banned.join(", ")}`, () => {
      const offenders: string[] = [];
      for (const file of files(path.join(SRC, layer))) {
        for (const imp of imports(file)) {
          const bad = banned.some((b) => imp === b || imp.startsWith(`${b}/`));
          const relativeEscape = imp.startsWith("../") && layer === "domain";
          if (bad || relativeEscape) offenders.push(`${path.relative(SRC, file)} → ${imp}`);
        }
      }
      expect(offenders).toEqual([]);
    });
  }
});
