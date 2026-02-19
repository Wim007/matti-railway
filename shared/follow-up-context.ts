/**
 * Follow-up Context Utility
 * 
 * Provides compact conversation context for welcome messages to enable
 * natural follow-up questions from Matti without loading full conversation history.
 * 
 * Theme-specific timing:
 * - Bullying: 2-3 days
 * - Feelings (negative): 2-3 days
 * - School/Friends (with actions): 5 days
 * - General: no extra context
 */

export type ThemeId =
  | "general"
  | "school"
  | "friends"
  | "home"
  | "feelings"
  | "love"
  | "freetime"
  | "future"
  | "self"
  | "bullying";

export interface ConversationContext {
  themeId: ThemeId;
  themeName: string;
  lastConversationDate: Date;
  daysAgo: number;
  summary: string; // 2-3 sentence summary
  pendingActions: string[]; // List of pending action descriptions
  sentiment: "positive" | "neutral" | "negative" | "unknown";
  severity?: "low" | "medium" | "high";
  shouldFollowUp: boolean;
}

interface ConversationData {
  themeId: ThemeId;
  summary: string | null;
  updatedAt: Date;
  bullyingDetected: boolean;
  bullyingSeverity: "low" | "medium" | "high" | null;
  initialProblem: string | null;
  outcome: "unresolved" | "in_progress" | "resolved" | "escalated" | null;
}

interface ActionData {
  actionText: string;
  status: "pending" | "completed" | "cancelled";
}

/**
 * Theme-specific follow-up windows (in days)
 */
const FOLLOW_UP_WINDOWS: Record<ThemeId, number | null> = {
  bullying: 3, // 2-3 days
  feelings: 3, // 2-3 days (for negative sentiment)
  school: 5, // 5 days (if actions exist)
  friends: 5, // 5 days (if actions exist)
  home: 5, // 5 days (if actions exist)
  love: 5, // 5 days (if actions exist)
  future: 5, // 5 days (if actions exist)
  self: 5, // 5 days (if actions exist)
  freetime: null, // No automatic follow-up
  general: null, // No automatic follow-up
};

/**
 * Theme display names (Dutch)
 */
const THEME_NAMES: Record<ThemeId, string> = {
  general: "Algemeen",
  school: "School",
  friends: "Vrienden",
  home: "Thuis",
  feelings: "Gevoelens",
  love: "Liefde",
  freetime: "Vrije tijd",
  future: "Toekomst",
  self: "Jezelf",
  bullying: "Pesten",
};

/**
 * Determine if a conversation should trigger follow-up context
 */
function shouldFollowUp(
  themeId: ThemeId,
  daysAgo: number,
  hasActions: boolean,
  sentiment: "positive" | "neutral" | "negative" | "unknown",
  outcome: "unresolved" | "in_progress" | "resolved" | "escalated" | null
): boolean {
  // Don't follow up on resolved conversations
  if (outcome === "resolved") {
    return false;
  }

  const window = FOLLOW_UP_WINDOWS[themeId];

  // No follow-up window for this theme
  if (window === null) {
    return false;
  }

  // Bullying: always follow up within 3 days
  if (themeId === "bullying" && daysAgo <= 3) {
    return true;
  }

  // Feelings: only follow up if negative sentiment
  if (themeId === "feelings" && sentiment === "negative" && daysAgo <= 3) {
    return true;
  }

  // School/Friends/Home/Love/Future/Self: only follow up if actions exist
  if (
    ["school", "friends", "home", "love", "future", "self"].includes(themeId) &&
    hasActions &&
    daysAgo <= 5
  ) {
    return true;
  }

  return false;
}

/**
 * Detect sentiment from conversation summary and initial problem
 */
function detectSentiment(
  summary: string | null,
  initialProblem: string | null,
  bullyingDetected: boolean
): "positive" | "neutral" | "negative" | "unknown" {
  if (!summary && !initialProblem) {
    return "unknown";
  }

  const text = `${summary || ""} ${initialProblem || ""}`.toLowerCase();

  // Bullying is always negative
  if (bullyingDetected) {
    return "negative";
  }

  // Negative indicators
  const negativeKeywords = [
    "bang",
    "angstig",
    "verdrietig",
    "somber",
    "depressief",
    "eenzaam",
    "stress",
    "zorgen",
    "moeilijk",
    "rot",
    "slecht",
    "niet goed",
    "hulp nodig",
    "weet niet wat",
    "geen idee",
    "hopeloos",
  ];

  // Positive indicators
  const positiveKeywords = [
    "beter",
    "goed",
    "fijn",
    "blij",
    "gelukt",
    "trots",
    "succesvol",
    "opgelost",
    "geholpen",
    "duidelijk",
    "snap het",
    "kan het",
  ];

  const negativeCount = negativeKeywords.filter((kw) => text.includes(kw)).length;
  const positiveCount = positiveKeywords.filter((kw) => text.includes(kw)).length;

  if (negativeCount > positiveCount) {
    return "negative";
  } else if (positiveCount > negativeCount) {
    return "positive";
  } else {
    return "neutral";
  }
}

/**
 * Generate compact context string for Matti's system prompt
 * Max ~100 tokens
 */
export function generateContextPrompt(context: ConversationContext): string {
  const { themeName, daysAgo, summary, pendingActions, sentiment, severity } = context;

  let prompt = `RECENTE CONTEXT (${daysAgo} ${daysAgo === 1 ? "dag" : "dagen"} geleden):\n`;
  prompt += `Thema: ${themeName}\n`;

  if (summary) {
    prompt += `Samenvatting: ${summary}\n`;
  }

  if (pendingActions.length > 0) {
    prompt += `Openstaande acties: ${pendingActions.join(", ")}\n`;
  }

  if (severity) {
    prompt += `Ernst: ${severity}\n`;
  }

  prompt += `\nINSTRUCTIE: Vraag natuurlijk hoe het nu gaat met ${themeName.toLowerCase()}`;

  if (pendingActions.length > 0) {
    prompt += ` en of het gelukt is om de acties uit te voeren`;
  }

  prompt += `. Wees empathisch en niet dwingend. Als het sentiment ${sentiment === "negative" ? "negatief" : sentiment === "positive" ? "positief" : "neutraal"} was, houd daar rekening mee.`;

  return prompt;
}

/**
 * Get recent conversation context for follow-up
 * 
 * @param conversationData - Recent conversation data from database
 * @param actionsData - Pending actions for this conversation
 * @returns ConversationContext or null if no follow-up needed
 */
export function getRecentConversationContext(
  conversationData: ConversationData | null,
  actionsData: ActionData[]
): ConversationContext | null {
  if (!conversationData) {
    return null;
  }

  const { themeId, summary, updatedAt, bullyingDetected, bullyingSeverity, initialProblem, outcome } =
    conversationData;

  // Calculate days since last conversation
  const now = new Date();
  const lastDate = new Date(updatedAt);
  const diffMs = now.getTime() - lastDate.getTime();
  const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Don't follow up if conversation is too old (> 7 days)
  if (daysAgo > 7) {
    return null;
  }

  // Filter pending actions
  const pendingActions = actionsData
    .filter((a) => a.status === "pending")
    .map((a) => a.actionText);

  // Detect sentiment
  const sentiment = detectSentiment(summary, initialProblem, bullyingDetected);

  // Determine if follow-up is needed
  const shouldFollowUpFlag = shouldFollowUp(
    themeId,
    daysAgo,
    pendingActions.length > 0,
    sentiment,
    outcome
  );

  if (!shouldFollowUpFlag) {
    return null;
  }

  // Build compact summary (max 2-3 sentences)
  let compactSummary = summary || initialProblem || "Geen samenvatting beschikbaar";

  // Truncate if too long (aim for ~50-80 tokens = ~200-300 chars)
  if (compactSummary.length > 300) {
    compactSummary = compactSummary.substring(0, 297) + "...";
  }

  return {
    themeId,
    themeName: THEME_NAMES[themeId],
    lastConversationDate: lastDate,
    daysAgo,
    summary: compactSummary,
    pendingActions,
    sentiment,
    severity: bullyingSeverity || undefined,
    shouldFollowUp: true,
  };
}
