import { describe, it, expect } from "vitest";
import { getRecentConversationContext, generateContextPrompt } from "@shared/follow-up-context";
import type { ThemeId } from "@shared/matti-types";

describe("Follow-up Context System", () => {
  describe("getRecentConversationContext", () => {
    it("should return null if no conversation data", () => {
      const result = getRecentConversationContext(null, []);
      expect(result).toBeNull();
    });

    it("should return null if conversation is too old (> 7 days)", () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const result = getRecentConversationContext(
        {
          themeId: "bullying" as ThemeId,
          summary: "Gepest door klasgenoten",
          updatedAt: tenDaysAgo,
          bullyingDetected: true,
          bullyingSeverity: "high",
          initialProblem: "Gepest",
          outcome: "in_progress",
        },
        []
      );

      expect(result).toBeNull();
    });

    it("should return context for bullying within 3 days", () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const result = getRecentConversationContext(
        {
          themeId: "bullying" as ThemeId,
          summary: "Gepest door klasgenoten, voelt zich eenzaam",
          updatedAt: twoDaysAgo,
          bullyingDetected: true,
          bullyingSeverity: "high",
          initialProblem: "Gepest",
          outcome: "in_progress",
        },
        [
          { actionText: "Praat met mentor", status: "pending" },
          { actionText: "Schrijf op wat er gebeurt", status: "pending" },
        ]
      );

      expect(result).not.toBeNull();
      expect(result?.themeId).toBe("bullying");
      expect(result?.themeName).toBe("Pesten");
      expect(result?.daysAgo).toBe(2);
      expect(result?.pendingActions).toHaveLength(2);
      expect(result?.sentiment).toBe("negative");
      expect(result?.severity).toBe("high");
      expect(result?.shouldFollowUp).toBe(true);
    });

    it("should return context for negative feelings within 3 days", () => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const result = getRecentConversationContext(
        {
          themeId: "feelings" as ThemeId,
          summary: "Voelt zich angstig en somber, weet niet wat te doen",
          updatedAt: oneDayAgo,
          bullyingDetected: false,
          bullyingSeverity: null,
          initialProblem: "Angst en somberheid",
          outcome: "in_progress",
        },
        []
      );

      expect(result).not.toBeNull();
      expect(result?.themeId).toBe("feelings");
      expect(result?.sentiment).toBe("negative");
      expect(result?.shouldFollowUp).toBe(true);
    });

    it("should NOT return context for positive feelings", () => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const result = getRecentConversationContext(
        {
          themeId: "feelings" as ThemeId,
          summary: "Voelt zich goed en blij, alles gaat fijn",
          updatedAt: oneDayAgo,
          bullyingDetected: false,
          bullyingSeverity: null,
          initialProblem: null,
          outcome: "in_progress",
        },
        []
      );

      expect(result).toBeNull(); // Positive feelings don't trigger follow-up
    });

    it("should return context for school with pending actions within 5 days", () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const result = getRecentConversationContext(
        {
          themeId: "school" as ThemeId,
          summary: "Faalangst voor tentamen, moeilijk om te leren",
          updatedAt: threeDaysAgo,
          bullyingDetected: false,
          bullyingSeverity: null,
          initialProblem: "Faalangst",
          outcome: "in_progress",
        },
        [{ actionText: "Maak een planning voor studeren", status: "pending" }]
      );

      expect(result).not.toBeNull();
      expect(result?.themeId).toBe("school");
      expect(result?.pendingActions).toHaveLength(1);
      expect(result?.shouldFollowUp).toBe(true);
    });

    it("should NOT return context for school without pending actions", () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const result = getRecentConversationContext(
        {
          themeId: "school" as ThemeId,
          summary: "Faalangst voor tentamen",
          updatedAt: threeDaysAgo,
          bullyingDetected: false,
          bullyingSeverity: null,
          initialProblem: "Faalangst",
          outcome: "in_progress",
        },
        [] // No pending actions
      );

      expect(result).toBeNull(); // School without actions doesn't trigger follow-up
    });

    it("should NOT return context for resolved conversations", () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const result = getRecentConversationContext(
        {
          themeId: "bullying" as ThemeId,
          summary: "Pesten is opgelost, kan nu beter voor zichzelf opkomen",
          updatedAt: twoDaysAgo,
          bullyingDetected: true,
          bullyingSeverity: "low",
          initialProblem: "Gepest",
          outcome: "resolved", // Resolved!
        },
        []
      );

      expect(result).toBeNull(); // Resolved conversations don't trigger follow-up
    });

    it("should NOT return context for general theme", () => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const result = getRecentConversationContext(
        {
          themeId: "general" as ThemeId,
          summary: "Algemeen gesprek over school en vrienden",
          updatedAt: oneDayAgo,
          bullyingDetected: false,
          bullyingSeverity: null,
          initialProblem: null,
          outcome: "in_progress",
        },
        []
      );

      expect(result).toBeNull(); // General theme has no follow-up window
    });
  });

  describe("generateContextPrompt", () => {
    it("should generate compact prompt for bullying with actions", () => {
      const context = {
        themeId: "bullying" as ThemeId,
        themeName: "Pesten",
        lastConversationDate: new Date(),
        daysAgo: 2,
        summary: "Gepest door klasgenoten, voelt zich eenzaam",
        pendingActions: ["Praat met mentor", "Schrijf op wat er gebeurt"],
        sentiment: "negative" as const,
        severity: "high" as const,
        shouldFollowUp: true,
      };

      const prompt = generateContextPrompt(context);

      expect(prompt).toContain("RECENTE CONTEXT");
      expect(prompt).toContain("2 dagen geleden");
      expect(prompt).toContain("Thema: Pesten");
      expect(prompt).toContain("Gepest door klasgenoten");
      expect(prompt).toContain("Openstaande acties: Praat met mentor, Schrijf op wat er gebeurt");
      expect(prompt).toContain("Ernst: high");
      expect(prompt).toContain("Vraag natuurlijk hoe het nu gaat met pesten");
      expect(prompt).toContain("of het gelukt is om de acties uit te voeren");
      expect(prompt).toContain("sentiment negatief was");
    });

    it("should generate compact prompt without actions", () => {
      const context = {
        themeId: "feelings" as ThemeId,
        themeName: "Gevoelens",
        lastConversationDate: new Date(),
        daysAgo: 1,
        summary: "Voelt zich angstig en somber",
        pendingActions: [],
        sentiment: "negative" as const,
        shouldFollowUp: true,
      };

      const prompt = generateContextPrompt(context);

      expect(prompt).toContain("RECENTE CONTEXT");
      expect(prompt).toContain("1 dag geleden");
      expect(prompt).toContain("Thema: Gevoelens");
      expect(prompt).toContain("Voelt zich angstig en somber");
      expect(prompt).not.toContain("Openstaande acties");
      expect(prompt).not.toContain("Ernst:");
      expect(prompt).toContain("Vraag natuurlijk hoe het nu gaat met gevoelens");
      expect(prompt).not.toContain("of het gelukt is om de acties uit te voeren");
    });

    it("should keep prompt under ~100 tokens", () => {
      const context = {
        themeId: "school" as ThemeId,
        themeName: "School",
        lastConversationDate: new Date(),
        daysAgo: 3,
        summary:
          "Faalangst voor tentamen, moeilijk om te leren, veel stress over cijfers en toekomst",
        pendingActions: [
          "Maak een planning voor studeren",
          "Praat met docent over extra tijd",
          "Vraag hulp aan mentor",
        ],
        sentiment: "negative" as const,
        shouldFollowUp: true,
      };

      const prompt = generateContextPrompt(context);

      // Rough estimate: ~4 chars per token
      const estimatedTokens = prompt.length / 4;
      expect(estimatedTokens).toBeLessThan(150); // Allow some margin
    });
  });
});
