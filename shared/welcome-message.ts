/**
 * Generate welcome message with fixed templates (no AI generation)
 */
export function generateWelcomeMessage(name: string): string {
  // Fixed greeting templates
  const greetings = [
    `Hey ${name}!`,
    `Hoi ${name}!`,
    `Yo ${name}!`,
  ];

  // Fixed question templates
  const questions = [
    "Waar wil je het over hebben?",
    "Wat kan ik voor je doen?",
    "Hoe kan ik je helpen?",
  ];

  // Random selection
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  const question = questions[Math.floor(Math.random() * questions.length)];

  return `${greeting} ${question}`;
}
