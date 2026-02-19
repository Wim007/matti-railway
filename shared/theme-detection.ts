import type { ThemeId } from "./matti-types";

/**
 * Theme detection based on conversation content
 * Analyzes user messages to determine the most relevant theme
 */

interface ThemeKeywords {
  theme: ThemeId;
  keywords: string[];
  weight: number; // Higher weight = stronger match
}

const THEME_PATTERNS: ThemeKeywords[] = [
  {
    theme: "friends",
    keywords: [
      "vriend", "vrienden", "vriendin", "vriendschap", "ruzie", 
      // Pesten keywords (uitgebreid)
      "pesten", "gepest", "pest", "pester", "pesters", "pestgedrag",
      "cyberpesten", "online pesten", "digitaal pesten",
      "uitlachen", "uitgelachen", "lachen om", "belachelijk maken",
      "negeren", "genegeerd", "doen alsof ik lucht ben",
      "buitensluiten", "buitengesloten", "niet meedoen", "niet uitgenodigd",
      "roddelen", "roddel", "achter mijn rug", "praatjes", "geruchten",
      "screenshots delen", "screenshot", "doorsturen", "foto's delen",
      "groepsdruk", "whatsapp", "groep", "groepje", "groepschat", "uit de groep",
      "gemeen", "gemene dingen", "gemeen doen", "rot doen",
      "plagen", "geplaagd", "sarren", "treiteren", "treiteraar",
      "schelden", "gescholden", "uitschelden", "scheldwoorden",
      "bedreigen", "bedreigd", "bang maken", "intimideren",
      "slaan", "schoppen", "duwen", "fysiek", "geweld",
      "spullen pakken", "afpakken", "verstopt", "kapot maken",
      "vertrouwen", "verraden", "verraad", "geheim doorverteld",
      "alleen", "niemand", "eenzaam", "geen vrienden",
      "niet durven", "bang op school", "niet naar school willen",
      "uitgemaakt", "voor gek gezet", "vernederd", "beschaamd"
    ],
    weight: 3, // Higher weight for bullying detection
  },
  {
    theme: "school",
    keywords: [
      "school", "les", "docent", "leraar", "cijfer", "toets", "examen", "huiswerk",
      "klas", "klasgenoot", "studie", "studeren", "leren", "concentreren",
      "motivatie", "stress", "deadline", "project", "presentatie", "vmbo", "havo", "vwo"
    ],
    weight: 2,
  },
  {
    theme: "feelings",
    keywords: [
      "somber", "depressief", "verdrietig", "eenzaam", "bang", "angstig", "stress",
      "nerveus", "onzeker", "zelfvertrouwen", "waardeloos", "falen", "teleurgesteld",
      "boos", "gefrustreerd", "moe", "uitgeput", "slapen", "slecht geslapen",
      "nachtmerrie", "piekeren", "zorgen", "paniekaanval"
    ],
    weight: 3, // Feelings are often primary
  },
  {
    theme: "home",
    keywords: [
      "ouder", "ouders", "vader", "moeder", "pa", "ma", "broer", "zus", "familie",
      "thuis", "ruzie thuis", "gescheiden", "scheiding", "stiefvader", "stiefmoeder",
      "begrijpen me niet", "luisteren niet", "streng", "regels", "huisregels"
    ],
    weight: 2,
  },
  {
    theme: "love",
    keywords: [
      "verliefd", "liefde", "crush", "date", "relatie", "verkering", "vriendje", "grappig", "lief", "leuk", "leuke jongen", "leuk meisje", "hij is", "zij is",
      "vriendinnetje", "zoenen", "kussen", "seks", "eerste keer", "afgewezen",
      "uit elkaar", "gebroken hart", "jaloers", "jaloezie", "tinder", "daten"
    ],
    weight: 3, // Verhoogd voor betere detectie verliefdheid
  },
  {
    theme: "self",
    keywords: [
      "uiterlijk", "lichaam", "dik", "dun", "afvallen", "eten", "niet eten",
      "anorexia", "boulimia", "sporten", "fitness", "gym", "puistjes", "acne",
      "ongesteld", "menstruatie", "borsten", "penis", "schaamhaar", "verandering",
      "puberteit", "lelijk", "mooi", "knap", "aantrekkelijk"
    ],
    weight: 2,
  },
  {
    theme: "future",
    keywords: [
      "toekomst", "later", "beroep", "werk", "baan", "studie", "universiteit",
      "hbo", "mbo", "stage", "carrière", "dromen", "ambities", "doel", "plan",
      "kiezen", "keuze", "richting", "wat wil ik", "geen idee"
    ],
    weight: 1,
  },
  {
    theme: "freetime",
    keywords: [
      "geld", "zakgeld", "bijbaan", "werken", "verdienen", "kopen", "duur",
      "goedkoop", "sparen", "schuld", "schulden", "lenen", "betalen",
      "kleding", "merk", "nike", "adidas", "iphone", "playstation"
    ],
    weight: 1,
  },
  {
    theme: "feelings",
    keywords: [
      "roken", "sigaretten", "vapen", "blowen", "wiet", "hasj", "drugs",
      "alcohol", "drinken", "zuipen", "pillen", "xtc", "coke", "verslaafd",
      "verslaving", "stoppen", "niet kunnen stoppen", "afhankelijk", "gaming",
      "gamen", "social media", "tiktok", "instagram", "verslaafd aan"
    ],
    weight: 3, // Addiction is critical
  },
];

/**
 * Detect theme from conversation messages
 * Returns the most likely theme based on keyword matching
 */
export function detectTheme(messages: Array<{ role: string; content: string }>): ThemeId {
  // Combine all user messages
  const userMessages = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase())
    .join(" ");

  if (!userMessages.trim()) {
    return "general";
  }

  // Score each theme
  const scores: Record<ThemeId, number> = {
    general: 0,
    school: 0,
    friends: 0,
    feelings: 0,
    home: 0,
    love: 0,
    self: 0,
    future: 0,
    freetime: 0,
    bullying: 0,
  };

  // Count keyword matches for each theme
  for (const pattern of THEME_PATTERNS) {
    let matchCount = 0;
    for (const keyword of pattern.keywords) {
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${keyword}\\w*\\b`, "gi");
      const matches = userMessages.match(regex);
      if (matches) {
        matchCount += matches.length;
      }
    }
    scores[pattern.theme] = matchCount * pattern.weight;
  }

  // Find theme with highest score
  let bestTheme: ThemeId = "general";
  let bestScore = 0;

  for (const [theme, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestTheme = theme as ThemeId;
    }
  }

  // Require minimum score to override "general"
  if (bestScore < 2) {
    return "general";
  }

  return bestTheme;
}
