/**
 * Centrale AI-configuratie voor Matti
 *
 * Gebruik:
 *   coach      → normale chatflow, follow-up responses
 *   plan       → goal plan-generatie, gestructureerde coaching
 *   structured → JSON-output, samenvattingen, analyse
 *
 * Geen losse temperature/model/max_tokens waarden elders in de code.
 */

export const aiProfiles = {
  coach: {
    model: "gpt-4o",
    temperature: 0.6,
    max_tokens: 500,
  },
  plan: {
    model: "gpt-4o",
    temperature: 0.5,
    max_tokens: 500,
  },
  structured: {
    model: "gpt-4o",
    temperature: 0.4,
    max_tokens: 400,
  },
} as const;

export type AiProfileKey = keyof typeof aiProfiles;
