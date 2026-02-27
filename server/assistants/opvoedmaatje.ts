import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Opvoedmaatje assistant configuration.
 *
 * systemPrompt is temporarily identical to Matti's (matti-instructions.md).
 * Replace with a dedicated opvoedmaatje-instructions.md when ready.
 */
export const opvoedmaatjeConfig = {
  name: "Opvoedmaatje",
  logo: "/assets/opvoedmaatje-logo.svg",
  primaryColor: "#2F6BFF",
  get systemPrompt(): string {
    // Temporary: reuse Matti's instructions until Opvoedmaatje has its own prompt
    return readFileSync(join(__dirname, "..", "matti-instructions.md"), "utf-8");
  },
};

export type AssistantConfig = typeof opvoedmaatjeConfig;
