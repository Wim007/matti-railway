/**
 * Bullying Detection Module
 * 
 * Comprehensive detection system for identifying bullying patterns in user messages.
 * Uses multi-dimensional analysis: behavior + context + victim signals + emotions.
 * 
 * CRITICAL DISTINCTION:
 * - Single incident ≠ bullying
 * - Bullying = repetition + power imbalance + emotional harm
 */

export interface BullyingDetectionResult {
  isBullying: boolean;
  severity: "none" | "low" | "medium" | "high" | "critical";
  isStructural: boolean; // Repeated/ongoing bullying
  confidence: number; // 0-1
  indicators: {
    behavior: string[];
    context: string[];
    victimSignals: string[];
    emotions: string[];
  };
  reasoning: string;
}

// 1. GEDRAGSPATRONEN
const BEHAVIOR_PATTERNS = {
  verbal: [
    "uitschelden",
    "uitgescholden",
    "schelden",
    "bedreigen",
    "bedreigd",
    "dreigen",
    "belachelijk maken",
    "belachelijk gemaakt",
    "lachen om",
    "lachen me uit",
    "uitlachen",
    "uitgelachen",
    "kleineren",
    "kleinerend",
    "vernederen",
    "vernederd",
    "pesten",
    "gepest",
    "treiteren",
    "getreiter",
  ],
  social: [
    "buitensluiten",
    "buitengesloten",
    "negeren",
    "genegeerd",
    "niemand wil met mij",
    "niemand praat met mij",
    "ik hoor er niet bij",
    "ze laten me links liggen",
    "roddelen",
    "geroddel",
    "praatjes verspreiden",
  ],
  cyber: [
    "cyberpesten",
    "online pesten",
    "screenshots delen",
    "screenshot gedeeld",
    "groepschat",
    "appgroep",
    "uit de groep",
    "verwijderd uit groep",
    "nare berichten",
    "gemene berichten",
  ],
};

// 2. CONTEXTSIGNALEN (waar/wanneer gebeurt het)
const CONTEXT_SIGNALS = {
  location: [
    "klas",
    "in de klas",
    "op school",
    "pauze",
    "in de pauze",
    "gang",
    "schoolplein",
    "online",
    "WhatsApp",
    "Snapchat",
    "Instagram",
    "TikTok",
    "appgroep",
    "groepschat",
  ],
  frequency: [
    "altijd",
    "steeds",
    "elke dag",
    "iedere dag",
    "constant",
    "continu",
    "de hele tijd",
    "weer",
    "opnieuw",
    "blijven",
    "al weken",
    "al maanden",
    "sinds",
  ],
  group: [
    "groep",
    "een groep",
    "ze",
    "zij",
    "iedereen",
    "hele klas",
    "klasgenoten",
    "medeleerlingen",
  ],
};

// 3. SLACHTOFFERSIGNALEN (hoe voelt/reageert het slachtoffer)
const VICTIM_SIGNALS = [
  "ik hoor er niet bij",
  "ze lachen om mij",
  "ze lachen me uit",
  "ik word genegeerd",
  "niemand wil met mij",
  "niemand praat met mij",
  "ik durf niks te zeggen",
  "ik durf niet",
  "ik wil niet meer naar school",
  "ik wil niet naar school",
  "ik ben bang om naar school te gaan",
  "ik haat school",
  "ik voel me waardeloos",
  "ik voel me alleen",
  "niemand mag mij",
  "iedereen haat mij",
  "ze hebben een hekel aan mij",
];

// 4. EMOTIONELE INDICATOREN
const EMOTIONAL_INDICATORS = [
  "bang",
  "angstig",
  "verdrietig",
  "onzeker",
  "alleen",
  "eenzaam",
  "schaamte",
  "schaam me",
  "machteloos",
  "hulpeloos",
  "waardeloos",
  "niet goed genoeg",
  "minderwaardig",
  "depressief",
  "somber",
  "down",
];

/**
 * Detect bullying patterns in user message
 */
export function detectBullyingAdvanced(message: string): BullyingDetectionResult {
  const lowerMessage = message.toLowerCase();
  
  // Initialize result
  const result: BullyingDetectionResult = {
    isBullying: false,
    severity: "none",
    isStructural: false,
    confidence: 0,
    indicators: {
      behavior: [],
      context: [],
      victimSignals: [],
      emotions: [],
    },
    reasoning: "",
  };

  // 1. Check behavior patterns
  const behaviorMatches: string[] = [];
  Object.values(BEHAVIOR_PATTERNS).flat().forEach((pattern) => {
    if (lowerMessage.includes(pattern)) {
      behaviorMatches.push(pattern);
    }
  });
  result.indicators.behavior = behaviorMatches;

  // 2. Check context signals
  const contextMatches: string[] = [];
  Object.values(CONTEXT_SIGNALS).flat().forEach((signal) => {
    if (lowerMessage.includes(signal)) {
      contextMatches.push(signal);
    }
  });
  result.indicators.context = contextMatches;

  // 3. Check victim signals
  const victimMatches: string[] = [];
  VICTIM_SIGNALS.forEach((signal) => {
    if (lowerMessage.includes(signal)) {
      victimMatches.push(signal);
    }
  });
  result.indicators.victimSignals = victimMatches;

  // 4. Check emotional indicators
  const emotionMatches: string[] = [];
  EMOTIONAL_INDICATORS.forEach((emotion) => {
    if (lowerMessage.includes(emotion)) {
      emotionMatches.push(emotion);
    }
  });
  result.indicators.emotions = emotionMatches;

  // 5. ANALYSE-LOGICA: gedrag + context + emotie → PESTEN
  const hasBehavior = behaviorMatches.length > 0;
  const hasContext = contextMatches.length > 0;
  const hasVictimSignal = victimMatches.length > 0;
  const hasEmotion = emotionMatches.length > 0;

  // Calculate confidence score (0-1)
  let confidenceScore = 0;
  if (hasBehavior) confidenceScore += 0.4; // Behavior is strongest indicator
  if (hasContext) confidenceScore += 0.2;
  if (hasVictimSignal) confidenceScore += 0.25;
  if (hasEmotion) confidenceScore += 0.15;

  result.confidence = Math.min(confidenceScore, 1.0);

  // 6. HERHALINGS-DETECTIE: structureel pesten
  const frequencyWords = CONTEXT_SIGNALS.frequency;
  const hasRepetition = frequencyWords.some((word) => lowerMessage.includes(word));
  result.isStructural = hasRepetition && hasBehavior;

  // 7. ONDERSCHEID: 1 incident ≠ pesten
  // Bullying requires: behavior + (repetition OR victim impact OR emotional harm)
  const hasImpact = hasVictimSignal || hasEmotion;
  const meetsDefinition = hasBehavior && (hasRepetition || hasImpact);

  result.isBullying = meetsDefinition && result.confidence >= 0.4;

  // 8. SEVERITY BEPALING
  if (!result.isBullying) {
    result.severity = "none";
  } else if (result.isStructural && hasVictimSignal && hasEmotion) {
    // Structureel + victim signals + emotions = critical
    result.severity = "critical";
  } else if (result.isStructural || (hasVictimSignal && hasEmotion)) {
    // Structureel OF (victim + emotion) = high
    result.severity = "high";
  } else if (hasBehavior && (hasVictimSignal || hasEmotion)) {
    // Behavior + impact = medium
    result.severity = "medium";
  } else {
    // Single incident with low impact = low
    result.severity = "low";
  }

  // 9. REASONING
  if (result.isBullying) {
    const parts: string[] = [];
    if (hasBehavior) parts.push(`gedrag (${behaviorMatches.length}x)`);
    if (hasContext) parts.push(`context (${contextMatches.length}x)`);
    if (hasVictimSignal) parts.push(`slachtoffersignalen (${victimMatches.length}x)`);
    if (hasEmotion) parts.push(`emoties (${emotionMatches.length}x)`);
    if (result.isStructural) parts.push("STRUCTUREEL");
    
    result.reasoning = `Pesten gedetecteerd: ${parts.join(" + ")}. Severity: ${result.severity}. Confidence: ${Math.round(result.confidence * 100)}%.`;
  } else if (hasBehavior && !hasRepetition && !hasImpact) {
    result.reasoning = "Enkel incident zonder herhaling of impact → GEEN pesten (nog).";
  } else {
    result.reasoning = "Geen pesten-indicatoren gedetecteerd.";
  }

  return result;
}

/**
 * Get recommended action based on severity
 */
export function getRecommendedAction(severity: BullyingDetectionResult["severity"]): string {
  switch (severity) {
    case "critical":
      return "URGENT: Directe interventie nodig. Adviseer contact met vertrouwenspersoon, ouders, of hulplijn (Kindertelefoon 0800-0432).";
    case "high":
      return "Serieus: Adviseer gesprek met mentor, vertrouwenspersoon, of ouders. Monitor situatie actief.";
    case "medium":
      return "Aandacht: Adviseer gesprek met vertrouwenspersoon. Bied concrete tips voor assertiviteit.";
    case "low":
      return "Waakzaam: Monitor situatie. Bied tips voor omgaan met conflict.";
    default:
      return "Geen actie nodig.";
  }
}

// ============================================================================
// LEGACY FUNCTIONS (kept for backward compatibility)
// ============================================================================

const BULLYING_KEYWORDS = [
  "pesten", "gepest", "pest", "pester", "pesters", "pestgedrag",
  "cyberpesten", "online pesten", "digitaal pesten",
  "uitlachen", "uitgelachen", "lachen om", "belachelijk maken",
  "negeren", "genegeerd", "doen alsof ik lucht ben",
  "buitensluiten", "buitengesloten", "niet meedoen", "niet uitgenodigd",
  "roddelen", "roddel", "achter mijn rug", "praatjes", "geruchten",
  "screenshots delen", "screenshot", "doorsturen", "foto's delen",
  "uit de groep", "groepschat",
  "gemeen", "gemene dingen", "gemeen doen", "rot doen",
  "plagen", "geplaagd", "sarren", "treiteren", "treiteraar",
  "schelden", "gescholden", "uitschelden", "scheldwoorden",
  "bedreigen", "bedreigd", "bang maken", "intimideren",
  "slaan", "schoppen", "duwen", "fysiek", "geweld",
  "spullen pakken", "afpakken", "verstopt", "kapot maken",
  "verraad", "geheim doorverteld",
  "niet durven", "bang op school", "niet naar school willen",
  "voor gek gezet", "vernederd", "beschaamd"
];

/**
 * Legacy: Detect if bullying is mentioned in messages
 * @deprecated Use detectBullyingAdvanced() for comprehensive analysis
 */
export function detectBullying(messages: Array<{ role: string; content: string }>): boolean {
  const userMessages = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase())
    .join(" ");

  if (!userMessages.trim()) {
    return false;
  }

  for (const keyword of BULLYING_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\w*\\b`, "gi");
    if (regex.test(userMessages)) {
      return true;
    }
  }

  return false;
}

/**
 * Legacy: Get bullying severity level
 * @deprecated Use detectBullyingAdvanced() for comprehensive severity assessment
 */
export function getBullyingSeverity(messages: Array<{ role: string; content: string }>): "low" | "medium" | "high" {
  const userMessages = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase())
    .join(" ");

  const highSeverityKeywords = [
    "bedreigen", "bedreigd", "bang maken", "intimideren",
    "slaan", "schoppen", "duwen", "fysiek", "geweld",
    "niet naar school willen", "bang op school",
    "zelfmoord", "dood", "pijn doen"
  ];

  const mediumSeverityKeywords = [
    "cyberpesten", "screenshots delen", "doorsturen",
    "uit de groep", "buitengesloten",
    "schelden", "gescholden", "uitschelden",
    "vernederd", "beschaamd", "voor gek gezet"
  ];

  for (const keyword of highSeverityKeywords) {
    const regex = new RegExp(`\\b${keyword}\\w*\\b`, "gi");
    if (regex.test(userMessages)) {
      return "high";
    }
  }

  for (const keyword of mediumSeverityKeywords) {
    const regex = new RegExp(`\\b${keyword}\\w*\\b`, "gi");
    if (regex.test(userMessages)) {
      return "medium";
    }
  }

  return "low";
}
