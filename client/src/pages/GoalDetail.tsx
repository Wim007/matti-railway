import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Circle, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function GoalDetail() {
  const { goalId } = useParams<{ goalId: string }>();
  const [, navigate] = useLocation();
  const [completing, setCompleting] = useState<number | null>(null);

  const goalIdNum = goalId ? parseInt(goalId, 10) : null;

  const { data: goal, isLoading, refetch } = trpc.goals.getGoalById.useQuery(
    { goalId: goalIdNum! },
    { enabled: !!goalIdNum }
  );

  const updateStatus = trpc.action.updateActionStatus.useMutation({
    onSuccess: () => {
      refetch();
      setCompleting(null);
      toast.success("Stap voltooid! 🎉");
    },
    onError: (err) => {
      setCompleting(null);
      toast.error("Er ging iets mis. Probeer opnieuw.");
      console.error(err);
    },
  });

  const handleComplete = (actionId: number) => {
    setCompleting(actionId);
    updateStatus.mutate({ actionId, status: "completed" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Laden...</div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">Doel niet gevonden.</p>
        <Button onClick={() => navigate(-1)} variant="outline">Terug</Button>
      </div>
    );
  }

  const { completed, total } = goal.progress;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isGoalDone = goal.status === "completed";

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/actions")}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground truncate flex-1">{goal.title}</h1>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {/* Progress block */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Voortgang</span>
            <span className="text-sm font-semibold text-foreground">{completed} / {total} stappen</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
              }}
            />
          </div>
          {isGoalDone && (
            <div className="mt-4 flex items-center gap-2 text-green-600">
              <Trophy className="w-5 h-5" />
              <span className="font-semibold text-sm">Doel behaald! Goed gedaan 🎉</span>
            </div>
          )}
        </div>

        {/* Steps list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Stappen</h2>
          {goal.steps.map((step, idx) => {
            const isCompleted = step.status === "completed";
            const isActive = step.isActiveStep === true && !isCompleted;
            const isFuture = !isCompleted && !isActive;

            return (
              <div
                key={step.id}
                className={`rounded-2xl border p-4 transition-all ${
                  isActive
                    ? "bg-blue-50 border-blue-300 shadow-sm dark:bg-blue-950 dark:border-blue-700"
                    : isCompleted
                    ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                    : "bg-card border-border opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Step indicator */}
                  <div className="mt-0.5 flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : isActive ? (
                      <Circle className="w-5 h-5 text-blue-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground font-medium">{idx + 1}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {step.actionText}
                    </p>
                    {isActive && (
                      <span className="inline-block mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        Huidige stap
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-block mt-1 text-xs font-semibold text-green-600 dark:text-green-400">
                        Voltooid ✓
                      </span>
                    )}
                    {isFuture && (
                      <span className="inline-block mt-1 text-xs text-muted-foreground">
                        Nog niet aan de beurt
                      </span>
                    )}
                  </div>
                </div>

                {/* Complete button — only for active step */}
                {isActive && !isGoalDone && (
                  <div className="mt-4">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleComplete(step.id)}
                      disabled={completing === step.id}
                      style={{ background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", color: "white" }}
                    >
                      {completing === step.id ? "Bezig..." : "✓ Stap voltooid"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
