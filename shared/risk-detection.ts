/**
 * Risk Detection Utility
 * 
 * Detects crisis signals in AI responses and user messages
 * Used for RISK_DETECTED analytics events
 */

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type RiskType = "suicidality" | "self_harm" | "abuse" | "other";

export interface RiskDetection {
  detected: boolean;
  level: RiskLevel;
  type: RiskType;
  confidence: number; // 0-1
  keywords: string[];
  actionTaken: string;
}

/**
 * Crisis keywords grouped by risk type
 */
const CRISIS_KEYWORDS = {
  suicidality: [
    "zelfmoord",
    "dood willen",
    "niet meer leven",
    "einde maken",
    "beter af zonder mij",
    "geen zin meer in leven",
    "wil dood",
    "suicide",
  ],
  self_harm: [
    "zelfbeschadiging",
    "mezelf pijn doen",
    "snijden",
    "mezelf verwonden",
    "zelf verwonden",
    "cutting",
    "zelf pijn",
  ],
  abuse: [
    "misbruik",
    "mishandeling",
    "aanranding",
    "verkrachting",
    "geweld thuis",
    "geslagen",
    "pijn gedaan",
    "gedwongen",
  ],
};

/**
 * Detect risk in text (user message or AI response)
 */
export function detectRisk(text: string): RiskDetection | null {
  const lowerText = text.toLowerCase();
  
  // Check for suicidality (CRITICAL)
  const suicidalityKeywords = CRISIS_KEYWORDS.suicidality.filter(kw => lowerText.includes(kw));
  if (suicidalityKeywords.length > 0) {
    return {
      detected: true,
      level: "critical",
      type: "suicidality",
      confidence: Math.min(0.5 + (suicidalityKeywords.length * 0.2), 1.0),
      keywords: suicidalityKeywords,
      actionTaken: "Crisis resources provided, stakeholder notification triggered",
    };
  }
  
  // Check for self-harm (HIGH)
  const selfHarmKeywords = CRISIS_KEYWORDS.self_harm.filter(kw => lowerText.includes(kw));
  if (selfHarmKeywords.length > 0) {
    return {
      detected: true,
      level: "high",
      type: "self_harm",
      confidence: Math.min(0.5 + (selfHarmKeywords.length * 0.2), 1.0),
      keywords: selfHarmKeywords,
      actionTaken: "Self-harm resources provided, monitoring enabled",
    };
  }
  
  // Check for abuse (HIGH)
  const abuseKeywords = CRISIS_KEYWORDS.abuse.filter(kw => lowerText.includes(kw));
  if (abuseKeywords.length > 0) {
    return {
      detected: true,
      level: "high",
      type: "abuse",
      confidence: Math.min(0.5 + (abuseKeywords.length * 0.2), 1.0),
      keywords: abuseKeywords,
      actionTaken: "Abuse resources provided, support services recommended",
    };
  }
  
  // No risk detected
  return null;
}

/**
 * Check if AI response contains crisis intervention language
 * This helps detect when Matti is responding to a crisis situation
 */
export function detectCrisisResponse(aiResponse: string): boolean {
  const crisisIndicators = [
    "113",
    "hulplijn",
    "crisis",
    "noodlijn",
    "kindertelefoon",
    "0800-0432",
    "professional",
    "hulpverlener",
    "direct contact",
  ];
  
  const lowerResponse = aiResponse.toLowerCase();
  return crisisIndicators.some(indicator => lowerResponse.includes(indicator));
}
