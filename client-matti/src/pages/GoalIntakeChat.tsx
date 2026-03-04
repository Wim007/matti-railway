/**
 * GoalIntakeChat
 *
 * Chat-interface voor goal intake flow.
 * Wordt geopend via /chat?goal=<type> of /chat?goal=custom
 *
 * Flow:
 * 1. Matti stelt de intakevragen (via generateIntakeQuestions)
 * 2. Gebruiker beantwoordt elke vraag
 * 3. Na alle antwoorden: plan genereren + goal aanmaken (finalizeGoalFromIntake)
 * 4. Redirect naar /goals/:goalId
 */
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Send, Loader2 } from "lucide-react";

interface Message {
  id: string;
  content: string;
  isAI: boolean;
}

const GOAL_LABELS: Record<string, string> = {
  social: "Vriendschappen verbeteren",
  bullying: "Omgaan met pesten",
  school: "Beter presteren op school",
  stress: "Minder stress en zorgen",
  confidence: "Meer zelfvertrouwen",
  family: "Beter contact thuis",
  custom: "Eigen doel",
};

export default function GoalIntakeChat() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const goalParam = params.get("goal") ?? "custom";
  const isCustom = goalParam === "custom";

  const goalTitle = GOAL_LABELS[goalParam] ?? "Eigen doel";

  // Intake state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [phase, setPhase] = useState<
    "custom_title" | "loading_questions" | "asking" | "finalizing" | "done"
  >(isCustom ? "custom_title" : "loading_questions");
  const [customTitle, setCustomTitle] = useState("");
  const [intakeQuestions, setIntakeQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const generateQuestions = trpc.goals.generateIntakeQuestions.useMutation();
  const finalizeGoal = trpc.goals.finalizeGoalFromIntake.useMutation();

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (content: string, isAI: boolean) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString() + Math.random(), content, isAI },
    ]);
  };

  // Start: custom flow vraagt eerst om de titel
  useEffect(() => {
    if (phase === "custom_title") {
      addMessage(
        "Wat wil je graag verbeteren of bereiken? Beschrijf het in een paar woorden.",
        true
      );
    }
  }, []);

  // Na custom titel: laad intakevragen
  const handleCustomTitleSubmit = async () => {
    if (!inputText.trim()) return;
    const title = inputText.trim();
    setCustomTitle(title);
    addMessage(title, false);
    setInputText("");
    setPhase("loading_questions");
    await loadIntakeQuestions(title, "custom");
  };

  // Laad intakevragen voor vaste templates
  useEffect(() => {
    if (phase === "loading_questions" && !isCustom) {
      loadIntakeQuestions(goalTitle, goalParam);
    }
  }, [phase]);

  const loadIntakeQuestions = async (title: string, type: string) => {
    try {
      const result = await generateQuestions.mutateAsync({
        goalTitle: title,
        goalType: type,
      });
      setIntakeQuestions(result.questions);
      setPhase("asking");
      // Stel eerste vraag
      addMessage(result.questions[0], true);
    } catch (err) {
      console.error("[GoalIntake] Failed to load questions:", err);
      addMessage(
        "Er ging iets mis bij het laden van de vragen. Probeer het opnieuw.",
        true
      );
    }
  };

  // Verwerk antwoord op intakevraag
  const handleAnswerSubmit = async () => {
    if (!inputText.trim() || phase !== "asking") return;
    const answer = inputText.trim();
    addMessage(answer, false);
    setInputText("");

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < intakeQuestions.length) {
      // Stel volgende vraag
      setCurrentQuestionIndex(nextIndex);
      setTimeout(() => addMessage(intakeQuestions[nextIndex], true), 400);
    } else {
      // Alle vragen beantwoord: genereer plan
      setPhase("finalizing");
      addMessage(
        "Super, ik maak nu een persoonlijk stappenplan voor je. Even geduld...",
        true
      );
      await finalize(newAnswers);
    }
  };

  const finalize = async (allAnswers: string[]) => {
    const effectiveTitle = isCustom ? customTitle : goalTitle;
    const effectiveType = isCustom ? "custom" : goalParam;

    // Bouw Q&A context string
    const intakeQA = intakeQuestions
      .map((q, i) => `V: ${q}\nA: ${allAnswers[i] ?? ""}`)
      .join("\n\n");

    try {
      const result = await finalizeGoal.mutateAsync({
        goalTitle: effectiveTitle,
        goalType: effectiveType,
        intakeQA,
      });
      setPhase("done");
      addMessage(
        `Je stappenplan staat klaar! Je eerste stap wacht op je. 🎯`,
        true
      );
      // Redirect na korte pauze
      setTimeout(() => navigate(`/goals/${result.goalId}`), 1500);
    } catch (err) {
      console.error("[GoalIntake] Finalize failed:", err);
      addMessage(
        "Er ging iets mis bij het aanmaken van je plan. Probeer het opnieuw.",
        true
      );
      setPhase("asking");
    }
  };

  const handleSend = () => {
    if (phase === "custom_title") {
      handleCustomTitleSubmit();
    } else if (phase === "asking") {
      handleAnswerSubmit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isLoading =
    phase === "loading_questions" ||
    phase === "finalizing" ||
    generateQuestions.isPending ||
    finalizeGoal.isPending;

  const effectiveTitle = isCustom && customTitle ? customTitle : goalTitle;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/goals")}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-foreground leading-tight">
            {effectiveTitle}
          </h1>
          <p className="text-xs text-muted-foreground">Matti helpt je op weg</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isAI ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.isAI
                  ? "bg-muted text-foreground rounded-tl-sm"
                  : "bg-primary text-primary-foreground rounded-tr-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Matti denkt na...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3 pb-safe">
        <div className="flex items-end gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              phase === "custom_title"
                ? "Beschrijf je doel..."
                : phase === "asking"
                ? "Typ je antwoord..."
                : ""
            }
            disabled={isLoading || phase === "done"}
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 min-h-[44px] max-h-[120px]"
            style={{ overflowY: "auto" }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading || phase === "done"}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
