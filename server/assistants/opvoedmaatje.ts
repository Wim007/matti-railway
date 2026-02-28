import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Opvoedmaatje assistant configuration.
 *
 * systemPrompt is loaded from server/opvoedmaatje-instructions.md.
 * After esbuild bundling, __dirname resolves to /app/dist,
 * so one level up (..) reaches /app/opvoedmaatje-instructions.md.
 *
 * To activate: set ASSISTANT_TYPE=opvoedmaatje in Railway environment variables.
 * Matti remains the default when ASSISTANT_TYPE is absent.
 */
export const opvoedmaatjeConfig = {
  name: "Opvoedmaatje",
  logo: "/assets/opvoedmaatje-logo.svg",
  primaryColor: "#2563B8",
  get systemPrompt(): string {
    return readFileSync(join(__dirname, "..", "opvoedmaatje-instructions.md"), "utf-8");
  },
};

export type AssistantConfig = typeof opvoedmaatjeConfig;