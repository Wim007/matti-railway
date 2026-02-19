/**
 * Comprehensive Theme Detection for All 9 Matti Themes
 * 
 * Detects which theme a conversation belongs to based on keywords and context
 */

import type { ThemeId } from "./matti-types";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export interface ThemeDetectionResult {
  theme: ThemeId;
  confidence: number; // 0-1
  severity: SeverityLevel;
  keywords: string[];
  requiresIntervention: boolean;
}

/**
 * Theme keyword definitions with weights
 */
const THEME_KEYWORDS = {
  school: {
    keywords: [
      // Academic performance (HIGH WEIGHT)
      { word: "tentamen", weight: 2.0 },
      { word: "tentamens", weight: 2.0 },
      { word: "toets", weight: 2.0 },
      { word: "toetsen", weight: 2.0 },
      { word: "examen", weight: 2.0 },
      { word: "examens", weight: 2.0 },
      { word: "leren", weight: 2.0 },
      { word: "studeren", weight: 2.0 },
      // Academic performance (NORMAL WEIGHT)
      "faalangst", "cijfer", "zakken", "herkansing",
      "huiswerk", "studie", "concentratie", "aandacht",
      // School environment
      "school", "klas", "docent", "leraar", "rapport", "studiestress",
      "deadline", "presentatie", "groepswerk",
      // Stress indicators
      "te veel", "lukt niet", "snap het niet", "kan het niet",
      "te moeilijk", "stress", "druk", "overweldigd",
    ],
    weight: 1.7,
  },
  friends: {
    keywords: [
      // Bullying (already comprehensive from bullying-detection.ts)
      "pesten", "gepest", "pester", "uitlachen", "uitgelachen",
      "negeren", "genegeerd", "buitensluiten", "buitengesloten",
      "roddelen", "roddels", "achter mijn rug", "gemeen",
      // Friendship issues
      "ruzie", "ruzie met", "vriend", "vriendin", "vriendschap",
      "vertrouwen", "verraden", "verraad", "leugens", "gelogen",
      "eenzaam", "alleen", "niemand", "geen vrienden",
      // Social media
      "whatsapp", "instagram", "tiktok", "snapchat", "online",
      "groepschat", "screenshot", "gepost", "gedeeld",
    ],
    weight: 1.3,
  },
  home: {
    keywords: [
      // Family
      "ouders", "vader", "moeder", "pa", "ma", "thuis",
      "gezin", "broer", "zus", "familie",
      // Conflict
      "ruzie thuis", "schreeuwen", "boos", "oneerlijk",
      "begrijpen me niet", "luisteren niet", "verboden",
      // Serious issues
      "scheiding", "scheiden", "uit elkaar", "verhuizen",
      "geweld", "slaan", "mishandeling", "onveilig",
    ],
    weight: 1.4,
  },
  feelings: {
    keywords: [
      // Anxiety
      "angst", "angstig", "bang", "paniek", "paniekaanval",
      "zenuwachtig", "gespannen", "onrustig",
      // Depression
      "depressie", "depri", "somber", "down", "verdrietig",
      "huilen", "leeg", "niks voelen", "geen zin",
      // Stress
      "stress", "gestrest", "overweldigd", "te veel",
      "moe", "uitgeput", "kan niet meer",
      // Loneliness
      "eenzaam", "alleen", "niemand", "verlaten",
      // Self-harm indicators
      "pijn doen", "zelfbeschadiging", "snijden", "niet meer willen leven",
    ],
    weight: 1.5, // General emotional issues (crisis detection via severity level)
  },
  love: {
    keywords: [
      // Relationships
      "verkering", "relatie", "vriend", "vriendin", "lover",
      "verliefd", "crush", "date", "dating",
      // Heartbreak
      "heartbreak", "uit elkaar", "gedumpt", "verlaten",
      "verdriet", "gemist", "terug", "nog van houden",
      // Romance issues
      "jaloers", "jaloezie", "vertrouwen", "liegen", "bedriegen",
      "ruzie", "onzeker", "bang om te verliezen",
    ],
    weight: 1.1,
  },
  freetime: {
    keywords: [
      // Boredom
      "verveling", "verveeld", "saai", "niks te doen",
      "geen hobby", "geen vrienden", "alleen thuis",
      // Activities
      "vrije tijd", "weekend", "vakantie", "sport",
      "hobby", "interesse", "passie",
    ],
    weight: 0.8, // Lower priority
  },
  future: {
    keywords: [
      // Career/education
      "toekomst", "later", "baan", "werk", "carrière",
      "studie", "universiteit", "mbo", "hbo",
      // Uncertainty
      "onzeker", "weet niet", "geen idee", "bang voor",
      "zorgen", "stress", "druk", "verwachtingen",
      // Goals
      "droom", "ambitie", "doel", "plannen",
    ],
    weight: 1.0,
  },
  self: {
    keywords: [
      // Self-image
      "zelfbeeld", "uiterlijk", "lelijk", "dik", "dun",
      "onzeker", "niet goed genoeg", "minderwaardig",
      // Identity
      "identiteit", "wie ben ik", "mezelf", "veranderen",
      "accepteren", "trots", "schamen",
      // LGBTQ+
      "gender", "seksualiteit", "coming out", "homo", "bi",
      "trans", "queer", "anders",
    ],
    weight: 1.2,
  },
  general: {
    keywords: [
      // Catch-all
      "probleem", "help", "advies", "wat moet ik",
      "hoe kan ik", "tips", "raad",
    ],
    weight: 0.5, // Lowest priority - default fallback
  },
  bullying: {
    keywords: [
      // Direct bullying terms
      "pesten", "gepest", "bully", "bullying",
      "uitlachen", "uitgelachen", "treiteren", "getreiter",
      "buitensluiten", "buitengesloten", "cyberpesten",
      // Bullying behaviors
      "negeren", "genegeerd", "roddelen", "roddels",
      "achter mijn rug", "gemeen", "plagen", "geplaagd",
      "bedreigen", "bedreigd", "intimideren", "geïntimideerd",
      // Online bullying
      "online pesten", "whatsapp groep", "screenshot", "gepost",
      "fake account", "trollen", "haten", "haters",
    ],
    weight: 1.8, // Highest priority - critical intervention needed
  },
};

/**
 * Severity indicators for each theme
 */
const SEVERITY_INDICATORS = {
  critical: [
    "zelfmoord", "dood", "niet meer leven", "einde maken",
    "snijden", "zelfbeschadiging", "pijn doen",
    "mishandeling", "geweld", "onveilig", "bang voor",
  ],
  high: [
    "depressie", "paniek", "angst", "eenzaam",
    "gepest", "uitgelachen", "buitengesloten",
    "ruzie thuis", "scheiding", "geweld",
  ],
  medium: [
    "stress", "somber", "verdrietig", "onzeker",
    "ruzie", "vertrouwen", "heartbreak",
    "faalangst", "tentamen stress",
  ],
  low: [
    "verveling", "saai", "onzeker over toekomst",
    "crush", "verliefd", "hobby",
  ],
};

/**
 * Detect theme from message content
 */
export function detectTheme(message: string): ThemeDetectionResult {
  const lowerMessage = message.toLowerCase();
  const scores: Record<ThemeId, number> = {
    school: 0,
    friends: 0,
    home: 0,
    feelings: 0,
    love: 0,
    freetime: 0,
    future: 0,
    self: 0,
    general: 0,
    bullying: 0,
  };

  const matchedKeywords: string[] = [];

  // Calculate scores for each theme
  for (const [theme, config] of Object.entries(THEME_KEYWORDS)) {
    for (const keyword of config.keywords) {
      if (typeof keyword === 'string') {
        if (lowerMessage.includes(keyword)) {
          scores[theme as ThemeId] += config.weight;
          matchedKeywords.push(keyword);
        }
      } else {
        // Weighted keyword object
        if (lowerMessage.includes(keyword.word)) {
          scores[theme as ThemeId] += config.weight * keyword.weight;
          matchedKeywords.push(keyword.word);
        }
      }
    }
  }

  // Find theme with highest score
  let maxScore = 0;
  let detectedTheme: ThemeId = "general";
  for (const [theme, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedTheme = theme as ThemeId;
    }
  }

  // Calculate confidence (0-1)
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? maxScore / totalScore : 0;

  // Detect severity
  const severity = detectSeverity(lowerMessage);

  // Determine if intervention is required
  const requiresIntervention = severity === "high" || severity === "critical";

  return {
    theme: detectedTheme,
    confidence,
    severity,
    keywords: matchedKeywords,
    requiresIntervention,
  };
}

/**
 * Detect severity level from message
 */
function detectSeverity(message: string): SeverityLevel {
  const lowerMessage = message.toLowerCase();

  // Check critical indicators first
  for (const indicator of SEVERITY_INDICATORS.critical) {
    if (lowerMessage.includes(indicator)) {
      return "critical";
    }
  }

  // Check high severity
  for (const indicator of SEVERITY_INDICATORS.high) {
    if (lowerMessage.includes(indicator)) {
      return "high";
    }
  }

  // Check medium severity
  for (const indicator of SEVERITY_INDICATORS.medium) {
    if (lowerMessage.includes(indicator)) {
      return "medium";
    }
  }

  // Check low severity
  for (const indicator of SEVERITY_INDICATORS.low) {
    if (lowerMessage.includes(indicator)) {
      return "low";
    }
  }

  // Default to low if no indicators found
  return "low";
}

/**
 * Get intervention approach for a theme
 */
export function getInterventionApproach(theme: ThemeId, severity: SeverityLevel): {
  followUpDays: number;
  actionRequired: boolean;
  escalationNeeded: boolean;
} {
  // Critical severity always requires immediate action
  if (severity === "critical") {
    return {
      followUpDays: 1, // Next day
      actionRequired: true,
      escalationNeeded: true, // Alert professional help
    };
  }

  // Theme-specific approaches
  const approaches: Record<ThemeId, { followUpDays: number; actionRequired: boolean }> = {
    school: { followUpDays: 3, actionRequired: true },
    friends: { followUpDays: 2, actionRequired: true }, // Faster for social issues
    home: { followUpDays: 3, actionRequired: true },
    feelings: { followUpDays: 2, actionRequired: true }, // Faster for emotional issues
    love: { followUpDays: 4, actionRequired: false },
    freetime: { followUpDays: 7, actionRequired: false },
    future: { followUpDays: 5, actionRequired: false },
    self: { followUpDays: 3, actionRequired: true },
    general: { followUpDays: 5, actionRequired: false },
    bullying: { followUpDays: 1, actionRequired: true }, // URGENT - immediate intervention
  };

  const approach = approaches[theme];

  return {
    ...approach,
    escalationNeeded: severity === "high",
  };
}
