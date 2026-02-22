/**
 * Generate welcome message with fixed templates (no AI generation)
 */
export function generateWelcomeMessage(name: string): string {
  // Vriendelijke, passende begroetingen
  const greetings = [
    `Hoi ${name}!`,
    `Hey ${name}!`,
    `Fijn dat je er bent, ${name}!`,
    `Hallo ${name}!`,
    `Goed je te zien, ${name}!`,
  ];

  // Uitnodigende openingsvragen
  const questions = [
    "Waar wil je het over hebben?",
    "Hoe gaat het met je?",
    "Wat speelt er bij jou?",
    "Wat kan ik voor je doen?",
    "Vertel, wat houdt je bezig?",
  ];

  // Random selection
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  const question = questions[Math.floor(Math.random() * questions.length)];

  return `${greeting} ${question}`;
}
