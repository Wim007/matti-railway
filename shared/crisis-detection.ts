/**
 * Crisis Detection System
 * 
 * Detects high-risk situations requiring immediate intervention:
 * - Suicidality (thoughts of suicide)
 * - Self-harm (cutting, burning, etc.)
 * - Abuse (physical, sexual, emotional)
 * - Severe violence (physical danger)
 */

export type CrisisType = 'suicidality' | 'self_harm' | 'abuse' | 'severe_violence' | 'none';
export type CrisisSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface CrisisDetectionResult {
  detected: boolean;
  type: CrisisType;
  severity: CrisisSeverity;
  matchedKeywords: string[];
  requiresImmediateAction: boolean;
  recommendedReferral: 'none' | '113_suicide_prevention' | '112_emergency' | 'veilig_thuis' | 'huisarts';
}

/**
 * Suicidality keywords (thoughts of suicide, self-harm ideation)
 */
const SUICIDALITY_KEYWORDS = {
  critical: [
    'ik wil dood',
    'ik ga dood',
    'ik maak mezelf dood',
    'ik pleeg zelfmoord',
    'ik spring van',
    'ik neem pillen',
    'ik hang mezelf',
    'vandaag is mijn laatste dag',
    'afscheidsbrief',
  ],
  high: [
    'zelfmoord',
    'suïcide',
    'dood willen',
    'niet meer willen leven',
    'beter af zonder mij',
    'niemand zou me missen',
    'iedereen is beter af als ik er niet ben',
    'ik wil niet meer',
    'het houdt niet op',
    'geen uitweg',
  ],
  medium: [
    'doodgaan',
    'niet meer wakker worden',
    'alles stoppen',
    'een einde maken',
    'verdwijnen',
    'weg willen',
  ],
};

/**
 * Self-harm keywords (cutting, burning, hitting self)
 */
const SELF_HARM_KEYWORDS = {
  critical: [
    'ik snij mezelf',
    'ik brand mezelf',
    'ik sla mezelf',
    'ik doe mezelf pijn',
    'ik heb mezelf gesneden',
  ],
  high: [
    'snijden',
    'cutter',
    'zelfverwonding',
    'mezelf pijn doen',
    'mezelf verwonden',
    'bloed',
    'littekens',
    'scheermesje',
    'mes',
  ],
  medium: [
    'pijn voelen',
    'mezelf straffen',
    'ik verdien pijn',
  ],
};

/**
 * Abuse keywords (physical, sexual, emotional)
 */
const ABUSE_KEYWORDS = {
  critical: [
    'hij slaat me',
    'zij slaat me',
    'mijn vader slaat me',
    'mijn moeder slaat me',
    'hij heeft me aangeraakt',
    'zij heeft me aangeraakt',
    'verkracht',
    'misbruikt',
    'gedwongen tot seks',
  ],
  high: [
    'slaan',
    'schoppen',
    'stompen',
    'wurgen',
    'aanraken',
    'betasten',
    'seksueel misbruik',
    'huiselijk geweld',
    'kindermishandeling',
    'incest',
  ],
  medium: [
    'bang voor thuis',
    'bang voor mijn vader',
    'bang voor mijn moeder',
    'durft niet naar huis',
    'schreeuwt altijd',
    'vernederd',
    'uitgescholden',
  ],
};

/**
 * Severe violence keywords (physical danger, assault)
 */
const SEVERE_VIOLENCE_KEYWORDS = {
  critical: [
    'in elkaar geslagen',
    'met mes bedreigd',
    'met wapen bedreigd',
    'bang voor mijn leven',
    'ze gaan me vermoorden',
  ],
  high: [
    'bedreigd',
    'geslagen',
    'gewond',
    'blauwe plekken',
    'gebroken',
    'ziekenhuis',
  ],
  medium: [
    'gevaarlijk',
    'bang',
    'onveilig',
    'durft niet',
  ],
};

/**
 * Detect crisis signals in user message
 */
export function detectCrisis(message: string): CrisisDetectionResult {
  const lowerMessage = message.toLowerCase();

  // Check suicidality (highest priority)
  const suicidalityResult = checkKeywords(lowerMessage, SUICIDALITY_KEYWORDS);
  if (suicidalityResult.detected) {
    return {
      detected: true,
      type: 'suicidality',
      severity: suicidalityResult.severity,
      matchedKeywords: suicidalityResult.matchedKeywords,
      requiresImmediateAction: suicidalityResult.severity === 'critical' || suicidalityResult.severity === 'high',
      recommendedReferral: '113_suicide_prevention',
    };
  }

  // Check self-harm
  const selfHarmResult = checkKeywords(lowerMessage, SELF_HARM_KEYWORDS);
  if (selfHarmResult.detected) {
    return {
      detected: true,
      type: 'self_harm',
      severity: selfHarmResult.severity,
      matchedKeywords: selfHarmResult.matchedKeywords,
      requiresImmediateAction: selfHarmResult.severity === 'critical' || selfHarmResult.severity === 'high',
      recommendedReferral: selfHarmResult.severity === 'critical' ? '112_emergency' : 'huisarts',
    };
  }

  // Check abuse
  const abuseResult = checkKeywords(lowerMessage, ABUSE_KEYWORDS);
  if (abuseResult.detected) {
    return {
      detected: true,
      type: 'abuse',
      severity: abuseResult.severity,
      matchedKeywords: abuseResult.matchedKeywords,
      requiresImmediateAction: abuseResult.severity === 'critical' || abuseResult.severity === 'high',
      recommendedReferral: abuseResult.severity === 'critical' ? '112_emergency' : 'veilig_thuis',
    };
  }

  // Check severe violence
  const violenceResult = checkKeywords(lowerMessage, SEVERE_VIOLENCE_KEYWORDS);
  if (violenceResult.detected) {
    return {
      detected: true,
      type: 'severe_violence',
      severity: violenceResult.severity,
      matchedKeywords: violenceResult.matchedKeywords,
      requiresImmediateAction: violenceResult.severity === 'critical' || violenceResult.severity === 'high',
      recommendedReferral: violenceResult.severity === 'critical' ? '112_emergency' : 'veilig_thuis',
    };
  }

  // No crisis detected
  return {
    detected: false,
    type: 'none',
    severity: 'low',
    matchedKeywords: [],
    requiresImmediateAction: false,
    recommendedReferral: 'none',
  };
}

/**
 * Check if message contains keywords from a keyword set
 */
function checkKeywords(
  message: string,
  keywordSet: { critical: string[]; high: string[]; medium: string[] }
): { detected: boolean; severity: CrisisSeverity; matchedKeywords: string[] } {
  // Check critical keywords first
  for (const keyword of keywordSet.critical) {
    if (message.includes(keyword)) {
      return {
        detected: true,
        severity: 'critical',
        matchedKeywords: [keyword],
      };
    }
  }

  // Check high keywords
  for (const keyword of keywordSet.high) {
    if (message.includes(keyword)) {
      return {
        detected: true,
        severity: 'high',
        matchedKeywords: [keyword],
      };
    }
  }

  // Check medium keywords
  for (const keyword of keywordSet.medium) {
    if (message.includes(keyword)) {
      return {
        detected: true,
        severity: 'medium',
        matchedKeywords: [keyword],
      };
    }
  }

  return {
    detected: false,
    severity: 'low',
    matchedKeywords: [],
  };
}

/**
 * Get crisis response message for AI to include
 */
export function getCrisisResponseGuidance(crisis: CrisisDetectionResult): string {
  if (!crisis.detected || !crisis.requiresImmediateAction) {
    return '';
  }

  switch (crisis.recommendedReferral) {
    case '113_suicide_prevention':
      return `
**CRISIS PROTOCOL - SUÏCIDALITEIT GEDETECTEERD**

De gebruiker heeft suïcidale gedachten geuit. Je MOET direct de volgende hulp aanbieden:

1. **Erken hun gevoelens:** "Ik hoor dat je het heel moeilijk hebt. Het is dapper dat je dit deelt."

2. **Bied directe hulp:** "Er zijn mensen die je nu direct kunnen helpen. Wil je met iemand praten?"

3. **Geef 113 Zelfmoordpreventie:**
   - Telefoonnummer: **113** (gratis, 24/7)
   - Chat: **www.113.nl/chat** (anoniem)
   - "Je kunt 113 bellen of chatten, dag en nacht. Ze luisteren zonder te oordelen."

4. **Bij acute crisis:** "Als je nu in gevaar bent, bel dan 112 of vraag iemand om je heen om hulp."

5. **Blijf verbonden:** "Ik blijf hier voor je. Wil je me vertellen wat er speelt?"

**NOOIT zeggen:** "Het komt wel goed", "Anderen hebben het erger", "Denk aan je familie"
`;

    case '112_emergency':
      return `
**CRISIS PROTOCOL - ACUTE GEVAAR GEDETECTEERD**

De gebruiker is in acuut gevaar. Je MOET direct de volgende hulp aanbieden:

1. **Erken de ernst:** "Ik hoor dat je in een gevaarlijke situatie zit. Je veiligheid is het allerbelangrijkste."

2. **Bied directe hulp:** "Als je nu in gevaar bent, bel dan direct **112** (politie/ambulance)."

3. **Veilige plek:** "Kun je nu naar een veilige plek gaan? Naar een vriend, buurvrouw, of openbare plek?"

4. **Veilig Thuis:** "Je kunt ook Veilig Thuis bellen: **0800-2000** (gratis, 24/7) voor hulp bij geweld thuis."

5. **Blijf verbonden:** "Ik blijf hier voor je. Vertel me wat je nodig hebt."
`;

    case 'veilig_thuis':
      return `
**CRISIS PROTOCOL - MISBRUIK/GEWELD GEDETECTEERD**

De gebruiker meldt mogelijk misbruik of geweld. Je MOET direct de volgende hulp aanbieden:

1. **Erken hun moed:** "Het is heel dapper dat je dit vertelt. Niemand verdient dit."

2. **Bied hulp:** "Er zijn mensen die je kunnen helpen om dit te stoppen."

3. **Geef Veilig Thuis:**
   - Telefoonnummer: **0800-2000** (gratis, 24/7)
   - "Veilig Thuis helpt bij geweld, misbruik en verwaarlozing. Je mag anoniem bellen."

4. **Bij acute gevaar:** "Als je nu in gevaar bent, bel dan 112."

5. **Vertrouwenspersoon:** "Kun je dit ook vertellen aan een volwassene die je vertrouwt? Een leraar, mentor, of familielid?"

6. **Blijf verbonden:** "Ik blijf hier voor je. Wat heb je nu het meeste nodig?"
`;

    case 'huisarts':
      return `
**CRISIS PROTOCOL - ZELFBESCHADIGING GEDETECTEERD**

De gebruiker meldt zelfbeschadiging. Je MOET direct de volgende hulp aanbieden:

1. **Erken hun pijn:** "Ik hoor dat je jezelf pijn doet. Dat moet heel moeilijk zijn."

2. **Bied hulp:** "Er zijn betere manieren om met deze gevoelens om te gaan. Wil je hulp?"

3. **Geef huisarts/jeugdarts:**
   - "Kun je naar je huisarts of jeugdarts gaan? Zij kunnen je helpen."
   - "Je kunt ook bellen naar je huisartsenpraktijk voor een afspraak."

4. **Bij ernstige verwonding:** "Als je nu gewond bent, bel dan 112 of ga naar de Spoedeisende Hulp."

5. **Alternatieve coping:** "Wat helpt jou om even tot rust te komen? Muziek, wandelen, iemand bellen?"

6. **Blijf verbonden:** "Ik blijf hier voor je. Vertel me wat je voelt."
`;

    default:
      return '';
  }
}
