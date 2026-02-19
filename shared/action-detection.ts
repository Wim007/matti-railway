/**
 * Action Detection Utility
 * 
 * Parses AI responses to detect actionable tips/advice.
 * AI Assistant is trained to tag actions with [ACTION: description] in responses.
 */

export interface DetectedAction {
  actionText: string;
  cleanResponse: string; // Response with [ACTION] tag removed
}

/**
 * Parse AI response for action tags
 * Format: [ACTION: description]
 * 
 * Example:
 * Input: "Dat klinkt moeilijk. [ACTION: Praat morgen met je leraar] Succes!"
 * Output: { actionText: "Praat morgen met je leraar", cleanResponse: "Dat klinkt moeilijk. Succes!" }
 */
export function detectAction(aiResponse: string): DetectedAction | null {
  const actionRegex = /\[ACTION:\s*([^\]]+)\]/i;
  const match = aiResponse.match(actionRegex);

  if (!match) {
    return null;
  }

  const actionText = match[1].trim();
  const cleanResponse = aiResponse.replace(actionRegex, '').trim();

  console.log('[ActionDetection] Detected action:', actionText);

  return {
    actionText,
    cleanResponse,
  };
}

/**
 * Check if response contains an action
 */
export function hasAction(aiResponse: string): boolean {
  return /\[ACTION:\s*[^\]]+\]/i.test(aiResponse);
}

/**
 * Intelligent post-processing: detect concrete advice even without [ACTION:] tag
 * 
 * Detects patterns like:
 * - "Praat met je mentor/docent/ouders"
 * - "Vraag aan je leraar om hulp"
 * - "Bel de Kindertelefoon"
 * - "Schrijf een bericht naar je vriend"
 * - "Maak een lijstje van taken"
 * 
 * Returns the detected action or null if no concrete advice found.
 */
export function detectActionIntelligent(aiResponse: string): DetectedAction | null {
  // First check for explicit [ACTION:] tag
  const explicitAction = detectAction(aiResponse);
  if (explicitAction) {
    return explicitAction;
  }

  // Patterns for concrete actions (Dutch)
  const actionPatterns = [
    // Direct patterns
    /(?:praat|spreek)\s+(?:met|naar)\s+([^.!?]+?)(?:\.|!|\?|$)/i,
    /vraag\s+(?:aan|je)\s+([^.!?]+?)(?:\s+om\s+[^.!?]+)?(?:\.|!|\?|$)/i,
    /bel\s+(?:met\s+)?([^.!?]+?)(?:\.|!|\?|$)/i,
    /schrijf\s+([^.!?]+?)(?:\.|!|\?|$)/i,
    /maak\s+([^.!?]+?)(?:\.|!|\?|$)/i,
    /zoek\s+([^.!?]+?)(?:\.|!|\?|$)/i,
    
    // Infinitief patterns ("door te bellen naar", "om te praten met")
    /(?:door|om)\s+te\s+(?:bellen|praten|spreken)\s+(?:naar|met)\s+([^.!?]+?)(?:\.|!|\?|$)/i,
    /(?:door|om)\s+(?:contact op te nemen met|te bellen naar)\s+([^.!?]+?)(?:\.|!|\?|$)/i,
    /bereiken\s+door\s+te\s+bellen\s+naar\s+([^.!?]+?)(?:\.|!|\?|$)/i,
    
    // Indirect patterns (suggestions)
    /(?:kun je|kan je|zou je kunnen)\s+(?:ook\s+)?(?:contact opnemen met|bellen met|praten met)\s+([^.!?]+?)(?:\.|!|\?|$)/i,
    /(?:het kan helpen om|probeer eens om|misschien kun je)\s+([^.!?]+?)(?:\.|!|\?|$)/i,
    /(?:neem contact op met|bel naar)\s+([^.!?]+?)(?:\.|!|\?|$)/i,
  ];

  // Split response into sentences
  const sentences = aiResponse.split(/[.!?]+/).filter(s => s.trim().length > 10);

  for (const sentence of sentences) {
    for (const pattern of actionPatterns) {
      const match = sentence.match(pattern);
      if (match) {
        // Extract the action text (capitalize first letter)
        const actionText = sentence.trim().charAt(0).toUpperCase() + sentence.trim().slice(1);
        
        // Filter out pure questions (contain "?" AND start with question words)
        if (sentence.includes('?') && /^(heb je|wil je|denk je|wat|waarom|hoe)/i.test(sentence.trim())) {
          continue;
        }

        // Filter out conditional statements WITHOUT action verbs
        if (/^(als je|wellicht)/i.test(sentence.trim()) && !/(?:praat|bel|schrijf|maak|zoek|contact)/i.test(sentence)) {
          continue;
        }

        console.log('[ActionDetection] Intelligent detection found action:', actionText);
        
        // Return detected action without modifying the response
        // (we keep the original text visible to user)
        return {
          actionText,
          cleanResponse: aiResponse, // Keep original response intact
        };
      }
    }
  }

  return null;
}
