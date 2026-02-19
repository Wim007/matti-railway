import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { THEMES } from "@shared/matti-types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, Circle, XCircle, TrendingUp } from "lucide-react";
import confetti from "canvas-confetti";

export default function Actions() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "cancelled">("all");

  // Fetch actions
  const { data: actions = [], refetch } = trpc.action.getActions.useQuery(
    { status: filter === "all" ? undefined : filter },
    { enabled: !!user }
  );

  // Fetch stats
  const { data: stats } = trpc.action.getActionStats.useQuery(undefined, { enabled: !!user });

  // Update action status mutation
  const updateStatus = trpc.action.updateActionStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Actie bijgewerkt!");
    },
    onError: (error) => {
      toast.error("Er ging iets mis: " + error.message);
    },
  });

  const handleMarkCompleted = async (actionId: number) => {
    await updateStatus.mutateAsync({ actionId, status: "completed" });
    
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#c7b8ff', '#aaf2f3', '#7cd5f3', '#a2f1d9', '#deb4e4']
    });
  };

  const handleMarkCancelled = async (actionId: number) => {
    await updateStatus.mutateAsync({ actionId, status: "cancelled" });
  };

  const getThemeInfo = (themeId: string) => {
    return THEMES.find((t) => t.id === themeId) || THEMES[0];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Vandaag";
    if (diffDays === 1) return "Gisteren";
    if (diffDays < 7) return `${diffDays} dagen geleden`;
    return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  };

  const isLoading = !user || !actions || !stats;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{backgroundColor: '#f5f9ff'}}>
      {/* Header */}
      <div className="text-white p-6 pb-8" style={{background: 'linear-gradient(90deg, #c7b8ff 0%, #aaf2f3 100%)'}}>
        <h1 className="text-2xl font-bold mb-2">💪 Mijn Acties</h1>
        <p className="text-purple-100">Jouw concrete stappen naar vooruitgang</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="px-4 -mt-4 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.pending}</div>
              <div className="text-xs text-gray-600">Actief</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-xs text-gray-600">Gelukt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.completionRate}%</div>
              <div className="text-xs text-gray-600">Score</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "all", label: "Alles" },
            { id: "pending", label: "Actief" },
            { id: "completed", label: "Gelukt" },
            { id: "cancelled", label: "Gestopt" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === tab.id
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions List */}
      <div className="px-4 space-y-3">
        {actions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nog geen acties
            </h3>
            <p className="text-gray-600 text-sm">
              Praat met Matti en maak concrete afspraken. Ik help je om ze te volgen!
            </p>
          </div>
        ) : (
          actions.map((action) => {
            const theme = getThemeInfo(action.themeId);
            const isPending = action.status === "pending";
            const isCompleted = action.status === "completed";
            const isCancelled = action.status === "cancelled";

            return (
              <div
                key={action.id}
                className="bg-white rounded-2xl shadow-sm p-4 border-l-4"
                style={{ borderLeftColor: theme.colors.gradient[0] }}
              >
                {/* Theme Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{theme.emoji}</span>
                  <span className="text-xs font-medium text-gray-600">{theme.name}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400">{formatDate(action.createdAt.toString())}</span>
                </div>

                {/* Action Text */}
                <p className="text-gray-900 font-medium mb-3">{action.actionText}</p>

                {/* Status & Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <>
                        <Circle className="w-5 h-5 text-purple-600" />
                        <span className="text-sm text-purple-600 font-medium">Actief</span>
                      </>
                    )}
                    {isCompleted && (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Gelukt!</span>
                      </>
                    )}
                    {isCancelled && (
                      <>
                        <XCircle className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-400 font-medium">Gestopt</span>
                      </>
                    )}
                  </div>

                  {isPending && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkCancelled(action.id)}
                        disabled={updateStatus.isPending}
                      >
                        Stop
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleMarkCompleted(action.id)}
                        disabled={updateStatus.isPending}
                        className="bg-gradient-to-r from-purple-600 to-blue-600"
                      >
                        ✓ Gelukt
                      </Button>
                    </div>
                  )}
                </div>

                {/* Follow-up Info */}
                {isPending && action.followUpScheduled && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <TrendingUp className="w-4 h-4" />
                      <span>Volgende check-in: {formatDate(action.followUpScheduled.toString())}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Navigation Spacer */}
      <div className="h-20" />
    </div>
  );
}
