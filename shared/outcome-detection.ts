/**
 * Outcome Detection Utility
 * 
 * Detects when a problem is resolved based on user responses
 */

export type OutcomeStatus = "unresolved" | "in_progress" | "resolved" | "escalated";

/**
 * Detect if user indicates problem is resolved
 */
export function detectResolution(userMessage: string, aiResponse: string): {
  isResolved: boolean;
  confidence: "low" | "medium" | "high";
} {
  const lowerMessage = userMessage.toLowerCase();
  const lowerResponse = aiResponse.toLowerCase();

  // Strong positive indicators
  const strongPositive = [
    "veel beter",
    "helemaal opgelost",
    "geen probleem meer",
    "gaat nu goed",
    "is opgelost",
    "niet meer gepest",
    "zijn gestopt",
    "vrienden geworden",
    "excuses gemaakt",
    "het is over",
  ];

  // Medium positive indicators
  const mediumPositive = [
    "beter",
    "gaat goed",
    "kan ermee omgaan",
    "weet wat ik moet doen",
    "durf nu",
    "kan voor mezelf opkomen",
    "heb het gezegd",
    "heb hulp gevraagd",
  ];

  // Check for strong positive
  for (const phrase of strongPositive) {
    if (lowerMessage.includes(phrase) || lowerResponse.includes(phrase)) {
      return { isResolved: true, confidence: "high" };
    }
  }

  // Check for medium positive
  for (const phrase of mediumPositive) {
    if (lowerMessage.includes(phrase)) {
      return { isResolved: true, confidence: "medium" };
    }
  }

  return { isResolved: false, confidence: "low" };
}

/**
 * Extract resolution description from conversation
 */
export function extractResolution(messages: Array<{ role: string; content: string }>): string | null {
  // Look at last 3 messages for resolution context
  const recentMessages = messages.slice(-3);
  
  const resolutionKeywords = [
    "kan nu",
    "durf nu",
    "weet nu",
    "heb geleerd",
    "voor mezelf opkomen",
    "hulp gevraagd",
    "gepraat met",
    "vrienden gemaakt",
    "gestopt met",
  ];

  for (const msg of recentMessages) {
    if (msg.role === "user") {
      const lower = msg.content.toLowerCase();
      for (const keyword of resolutionKeywords) {
        if (lower.includes(keyword)) {
          // Extract sentence containing keyword
          const sentences = msg.content.split(/[.!?]/);
          for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(keyword)) {
              return sentence.trim();
            }
          }
        }
      }
    }
  }

  return null;
}

/**
 * Generate outcome summary for Dashboard
 */
export function generateOutcomeSummary(
  initialProblem: string,
  conversationCount: number,
  duration: number, // days
  resolution: string | null,
  actionCompletionRate: number
): string {
  const durationText = duration === 1 ? "1 dag" : `${duration} dagen`;
  const conversationText = conversationCount === 1 ? "1 gesprek" : `${conversationCount} gesprekken`;
  
  if (resolution) {
    return `${initialProblem} - Na ${conversationText} (${durationText}) opgelost - ${resolution} - ${actionCompletionRate}% acties voltooid`;
  } else {
    return `${initialProblem} - ${conversationText} (${durationText}) - ${actionCompletionRate}% acties voltooid - Nog bezig`;
  }
}
