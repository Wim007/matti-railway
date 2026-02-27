import { mattiConfig } from "../assistants/matti";
import { opvoedmaatjeConfig } from "../assistants/opvoedmaatje";

export type AssistantConfig = typeof mattiConfig;

/**
 * loadAssistant()
 *
 * Returns the active assistant config based on ASSISTANT_TYPE env var.
 * Defaults to "matti" when the variable is absent — Matti keeps working unchanged.
 *
 * To activate Opvoedmaatje in a separate deployment:
 *   Set ASSISTANT_TYPE=opvoedmaatje in that environment's Railway variables.
 */
export function loadAssistant(): AssistantConfig {
  const type = process.env.ASSISTANT_TYPE ?? "matti";

  switch (type) {
    case "opvoedmaatje":
      return opvoedmaatjeConfig;

    case "matti":
    default:
      if (type !== "matti") {
        console.warn(`[loadAssistant] Unknown ASSISTANT_TYPE "${type}", falling back to matti`);
      }
      return mattiConfig;
  }
}
