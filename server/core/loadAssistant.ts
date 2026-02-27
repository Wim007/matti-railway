import { mattiConfig, type AssistantConfig } from "../assistants/matti";

/**
 * loadAssistant()
 *
 * Returns the active assistant config based on ASSISTANT_TYPE env var.
 * Defaults to "matti" when the variable is absent.
 *
 * To add a new assistant:
 *   1. Create /server/assistants/<name>.ts with the same shape as mattiConfig
 *   2. Import it here and add a case to the switch
 *   3. Set ASSISTANT_TYPE=<name> in the deployment environment
 */
export function loadAssistant(): AssistantConfig {
  const type = process.env.ASSISTANT_TYPE ?? "matti";

  switch (type) {
    case "matti":
      return mattiConfig;

    default:
      console.warn(`[loadAssistant] Unknown ASSISTANT_TYPE "${type}", falling back to matti`);
      return mattiConfig;
  }
}
