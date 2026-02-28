import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Target, ChevronRight, Plus } from "lucide-react";

const GOAL_TEMPLATES = [
  { type: "social", emoji: "🤝", label: "Vriendschappen verbeteren" },
  { type: "bullying", emoji: "🛡️", label: "Omgaan met pesten" },
  { type: "school", emoji: "📚", label: "Beter presteren op school" },
  { type: "stress", emoji: "😮‍💨", label: "Minder stress en zorgen" },
  { type: "confidence", emoji: "💪", label: "Meer zelfvertrouwen" },
  { type: "family", emoji: "🏠", label: "Beter contact thuis" },
];

export default function GoalsOverview() {
  const [, navigate] = useLocation();

  const { data: activeGoals, isLoading } = trpc.goals.getActiveGoals.useQuery();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/chat")}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground flex-1">Mijn Doelen</h1>
      </div>

      <div className="px-4 pt-6 space-y-8">

        {/* Active goals section */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Actieve doelen
          </h2>

          {isLoading ? (
            <div className="bg-muted/40 rounded-2xl p-5 text-center">
              <p className="text-sm text-muted-foreground">Laden...</p>
            </div>
          ) : activeGoals && activeGoals.length > 0 ? (
            <div className="space-y-3">
              {activeGoals.map((goal: any) => {
                const total = goal.progress?.total ?? 0;
                const completed = goal.progress?.completed ?? 0;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <button
                    key={goal.id}
                    onClick={() => navigate(`/goals/${goal.id}`)}
                    className="w-full text-left bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-sm text-foreground">{goal.title}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {completed} van {total} stappen voltooid
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="bg-muted/40 rounded-2xl p-5 text-center">
              <p className="text-sm text-muted-foreground">Je hebt nog geen actieve doelen.</p>
              <p className="text-xs text-muted-foreground mt-1">Kies hieronder een doel om te beginnen.</p>
            </div>
          )}
        </section>

        {/* Templates section */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Start een nieuw doel
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {GOAL_TEMPLATES.map((t) => (
              <button
                key={t.type}
                onClick={() => navigate(`/goal-intake?goal=${t.type}`)}
                className="bg-card border border-border rounded-2xl p-4 text-left hover:shadow-md transition-all active:scale-[0.97]"
              >
                <span className="text-2xl mb-2 block">{t.emoji}</span>
                <span className="text-sm font-medium text-foreground leading-snug">{t.label}</span>
              </button>
            ))}

            {/* "Iets anders?" tile */}
            <button
              onClick={() => navigate("/goal-intake?goal=custom")}
              className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-left hover:shadow-md transition-all active:scale-[0.97] col-span-2"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  Iets anders? Vertel het Opvoedmaatje
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Opvoedmaatje stelt je een paar vragen en maakt een plan op maat.
              </p>
            </button>
          </div>
        </section>

      </div>

    </div>
  );
}
