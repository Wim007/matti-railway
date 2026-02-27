import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Matti assistant configuration.
 *
 * systemPrompt is loaded from matti-instructions.md (root of repo).
 * After esbuild bundling, __dirname resolves to /app/dist,
 * so one level up (..) reaches /app/matti-instructions.md — identical
 * to the original readFileSync(join(__dirname, '..', 'matti-instructions.md')) in chatRouter.
 */
export const mattiConfig = {
  name: "Matti",
  logo: "/assets/matti-logo.svg",
  primaryColor: "#2F6BFF",
  get systemPrompt(): string {
    return readFileSync(join(__dirname, "..", "matti-instructions.md"), "utf-8");
  },
};

export type AssistantConfig = typeof mattiConfig;
