import { useState } from "react";
import { trpc } from "../lib/trpc";

export default function FeedbackDashboard() {
  const [ratingFilter, setRatingFilter] = useState<"all" | "up" | "down">("all");
  
  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = trpc.feedback.getStatistics.useQuery();
  
  // Fetch feedback with filters
  const { data: feedbackData, isLoading: feedbackLoading } = trpc.feedback.getAllFeedback.useQuery({
    rating: ratingFilter,
    limit: 50,
    offset: 0,
  });

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Feedback Dashboard</h1>
        <p className="text-muted-foreground">Bekijk en analyseer gebruikersfeedback op Matti's responses</p>
      </div>

      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="max-w-6xl mx-auto mb-8">
          <div className="animate-pulse flex gap-4">
            <div className="flex-1 h-32 bg-muted rounded-lg"></div>
            <div className="flex-1 h-32 bg-muted rounded-lg"></div>
            <div className="flex-1 h-32 bg-muted rounded-lg"></div>
          </div>
        </div>
      ) : stats ? (
        <div className="max-w-6xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Feedback Card */}
          <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
            <div className="text-sm text-muted-foreground mb-1">Totaal Feedback</div>
            <div className="text-3xl font-bold text-foreground">{stats.totalCount}</div>
            <div className="text-xs text-muted-foreground mt-2">Alle thumbs up/down</div>
          </div>

          {/* Positive Percentage Card */}
          <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
            <div className="text-sm text-muted-foreground mb-1">Positief Percentage</div>
            <div className="text-3xl font-bold text-green-600">{stats.positivePercentage}%</div>
            <div className="text-xs text-muted-foreground mt-2">{stats.upCount} thumbs up</div>
          </div>

          {/* Negative Count Card */}
          <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
            <div className="text-sm text-muted-foreground mb-1">Negatieve Feedback</div>
            <div className="text-3xl font-bold text-red-600">{stats.downCount}</div>
            <div className="text-xs text-muted-foreground mt-2">Vereist aandacht</div>
          </div>
        </div>
      ) : null}

      {/* Filters */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
          <div className="flex gap-2">
            <button
              onClick={() => setRatingFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                ratingFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              Alle ({stats?.totalCount || 0})
            </button>
            <button
              onClick={() => setRatingFilter("up")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                ratingFilter === "up"
                  ? "bg-green-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              👍 Positief ({stats?.upCount || 0})
            </button>
            <button
              onClick={() => setRatingFilter("down")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                ratingFilter === "down"
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              👎 Negatief ({stats?.downCount || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-card rounded-lg shadow-sm border border-border">
          {feedbackLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              Feedback laden...
            </div>
          ) : feedbackData && feedbackData.feedback.length > 0 ? (
            <div className="divide-y divide-border">
              {feedbackData.feedback.map((item) => (
                <div key={item.id} className="p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {item.rating === "up" ? "👍" : "👎"}
                      </span>
                      <div>
                        <div className="font-medium text-foreground">
                          {item.rating === "up" ? "Positieve feedback" : "Negatieve feedback"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Bericht #{item.messageIndex} • {formatDate(item.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Conversatie ID: {item.conversationId}
                    </div>
                  </div>
                  
                  {item.feedbackText && (
                    <div className="ml-11 bg-muted rounded-lg p-4 border border-border">
                      <div className="text-sm text-foreground">{item.feedbackText}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <div className="text-4xl mb-4">📭</div>
              <div className="text-lg font-medium text-foreground mb-2">Geen feedback gevonden</div>
              <div className="text-sm">
                {ratingFilter === "all"
                  ? "Er is nog geen feedback ontvangen."
                  : `Er is geen ${ratingFilter === "up" ? "positieve" : "negatieve"} feedback.`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
